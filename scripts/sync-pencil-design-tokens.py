#!/usr/bin/env python3
"""
Unify .pen design tokens: shared study-reward.tokens.pen + imports + radius/color binding.
Run from repo root: python3 scripts/sync-pencil-design-tokens.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / "docs/design/pencil/design-sources"
TOKENS_NAME = "study-reward.tokens.pen"
TOKEN_RELPATH = "../../study-reward.tokens.pen"  # from any pages/*/*.pen

# Normalize hex to #rrggbb lowercase for lookup
_HEX3 = re.compile(r"^#([0-9a-fA-F]{3})$")


def norm_hex(s: str) -> str | None:
    if not isinstance(s, str) or not s.startswith("#"):
        return None
    s = s.strip()
    m = _HEX3.match(s)
    if m:
        a, b, c = m.group(1)
        s = f"#{a}{a}{b}{b}{c}{c}"
    if len(s) == 7:
        return s.lower()
    if len(s) == 9:  # #rrggbbaa
        return s[:7].lower()
    return None


# Semantic color → token (after norm_hex)
COLOR_TO_TOKEN: dict[str, str] = {
    "#137fec": "$color.primary",
    "#0f172a": "$color.text",
    "#111827": "$color.text",
    "#1e293b": "$color.text",
    "#334155": "$color.text",
    "#475569": "$color.text-secondary",
    "#64748b": "$color.text-secondary",
    "#6b7280": "$color.text-secondary",
    "#94a3b8": "$color.muted",
    "#ffffff": "$color.surface",
    "#fff": "$color.surface",
    "#f8fafc": "$color.bg-subtle",
    "#f1f5f9": "$color.card-bg",
    "#fafafa": "$color.bg-subtle",
    "#e2e8f0": "$color.border",
    "#e5e7eb": "$color.border",
    "#f0f4ff": "$color.hint-bg",
    "#eff6ff": "$color.hint-bg",
    "#e0f2fe": "$color.tint-blue",
    "#e8f3fe": "$color.nav-active-bg",
    "#ecfdf5": "$color.success-bg",
    "#15803d": "$color.success-text",
    "#fef2f2": "$color.danger-bg",
    "#b91c1c": "$color.danger-text",
    "#1e40af": "$color.hint-text",
    "#dc2626": "$color.danger-accent",
    "#16a34a": "$color.success-accent",
    "#99000000": "$color.overlay",
    "#66000000": "$color.overlay",
    "#fde68a": "$color.avatar-warm",
    "#3b82f6": "$color.accent-blue",
    "#3b82f640": "$color.tint-blue-40",
    "#eef2ff": "$color.tint-indigo",
    "#f0f9ff": "$color.tint-sky",
}


def map_radius(v) -> str | int | float:
    if isinstance(v, str) and v.startswith("$"):
        return v
    if not isinstance(v, (int, float)):
        return v
    n = int(v)
    if n >= 500:
        return "$radius.pill"
    if n >= 24:
        return "$radius.screen"
    if n >= 17:
        return "$radius.panel"
    if n >= 13:
        return "$radius.card"
    if n >= 9:
        return "$radius.control"
    return "$radius.tight"


def maybe_token_color(s: str) -> str:
    if not isinstance(s, str):
        return s
    if s.startswith("$"):
        return s
    if s.startswith("#") and len(s) == 9:
        lk = s.lower()
        if lk in COLOR_TO_TOKEN:
            return COLOR_TO_TOKEN[lk]
    h = norm_hex(s)
    if h and h in COLOR_TO_TOKEN:
        return COLOR_TO_TOKEN[h]
    # #rrggbbaa
    if isinstance(s, str) and len(s) == 9 and s.startswith("#"):
        h6 = s[:7].lower()
        if h6 in COLOR_TO_TOKEN:
            return COLOR_TO_TOKEN[h6]
    return s


def walk(node):
    if isinstance(node, dict):
        if "cornerRadius" in node:
            node["cornerRadius"] = map_radius(node["cornerRadius"])
        if "fill" in node:
            f = node["fill"]
            if isinstance(f, str):
                node["fill"] = maybe_token_color(f)
            elif isinstance(f, dict) and f.get("type") == "color" and "color" in f:
                f["color"] = maybe_token_color(f["color"])
            elif isinstance(f, dict) and f.get("type") == "gradient" and isinstance(
                f.get("colors"), list
            ):
                for stop in f["colors"]:
                    if isinstance(stop, dict) and "color" in stop:
                        stop["color"] = maybe_token_color(stop["color"])
        if "stroke" in node and isinstance(node["stroke"], dict):
            st = node["stroke"]
            if "fill" in st:
                sf = st["fill"]
                if isinstance(sf, str):
                    st["fill"] = maybe_token_color(sf)
                elif isinstance(sf, dict) and sf.get("type") == "color" and "color" in sf:
                    sf["color"] = maybe_token_color(sf["color"])
        for k, v in list(node.items()):
            if k == "variables":
                continue
            walk(v)
    elif isinstance(node, list):
        for item in node:
            walk(item)


def process_file(path: Path) -> None:
    if path.name == TOKENS_NAME:
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("version") != "2.10":
        print(f"skip (version): {path}")
        return

    rel = path.relative_to(DS)
    depth = len(rel.parts) - 1
    up = "/".join([".."] * depth)
    imp_path = f"{up}/{TOKENS_NAME}" if depth else TOKENS_NAME

    data["imports"] = {"sr": imp_path}
    if "variables" in data:
        del data["variables"]

    walk(data.get("children", []))
    ordered = {
        "version": data["version"],
        "imports": data["imports"],
        "children": data["children"],
    }
    out = json.dumps(ordered, ensure_ascii=False, indent=2) + "\n"
    # import 别名 sr：$color.* → $sr:color.*（已带 $sr: 的不重复加）
    out = out.replace("$color.", "$sr:color.").replace("$radius.", "$sr:radius.")
    out = out.replace("$sr:sr:", "$sr:")
    path.write_text(out, encoding="utf-8")
    print(f"updated {path.relative_to(ROOT)}")


def main():
    tokens = {
        "version": "2.10",
        "variables": {
            "color.primary": {"type": "color", "value": "#137fec"},
            "color.text": {"type": "color", "value": "#0f172a"},
            "color.text-secondary": {"type": "color", "value": "#64748b"},
            "color.muted": {"type": "color", "value": "#94a3b8"},
            "color.surface": {"type": "color", "value": "#FFFFFF"},
            "color.bg-subtle": {"type": "color", "value": "#f8fafc"},
            "color.border": {"type": "color", "value": "#e2e8f0"},
            "color.card-bg": {"type": "color", "value": "#f1f5f9"},
            "color.nav-active-bg": {"type": "color", "value": "#E8F3FE"},
            "color.hint-bg": {"type": "color", "value": "#EFF6FF"},
            "color.hint-text": {"type": "color", "value": "#1e40af"},
            "color.hint-stroke": {"type": "color", "value": "rgba(59,130,246,0.25)"},
            "color.tint-blue": {"type": "color", "value": "#e0f2fe"},
            "color.overlay": {"type": "color", "value": "#99000000"},
            "color.success-bg": {"type": "color", "value": "#ecfdf5"},
            "color.success-text": {"type": "color", "value": "#15803d"},
            "color.success-accent": {"type": "color", "value": "#16a34a"},
            "color.danger-bg": {"type": "color", "value": "#fef2f2"},
            "color.danger-text": {"type": "color", "value": "#b91c1c"},
            "color.danger-accent": {"type": "color", "value": "#dc2626"},
            "color.avatar-warm": {"type": "color", "value": "#fde68a"},
            "color.accent-blue": {"type": "color", "value": "#3b82f6"},
            "color.tint-blue-40": {"type": "color", "value": "#3b82f640"},
            "color.tint-indigo": {"type": "color", "value": "#eef2ff"},
            "color.tint-sky": {"type": "color", "value": "#f0f9ff"},
            "radius.tight": {"type": "number", "value": 8},
            "radius.control": {"type": "number", "value": 12},
            "radius.card": {"type": "number", "value": 16},
            "radius.panel": {"type": "number", "value": 20},
            "radius.screen": {"type": "number", "value": 24},
            "radius.pill": {"type": "number", "value": 999},
        },
        "children": [
            {
                "type": "note",
                "id": "token-readme",
                "name": "Design tokens",
                "x": 0,
                "y": 0,
                "width": 420,
                "height": 200,
                "content": (
                    "全局 token：圆角 radius.tight→screen、pill；颜色 color.*。\n"
                    "各页面通过 imports.sr 引用本文件。\n"
                    "运行时「样式定制」改的是 CSS 类与 --border-style 等，"
                    "与 token 语义对应：边框/背景/光标预设影响 .app 与 body；"
                    "稿内用 $color / $radius 与产品默认主题对齐。"
                ),
                "fontSize": 12,
                "fill": "$color.text-secondary",
            }
        ],
    }
    (DS / TOKENS_NAME).write_text(
        json.dumps(tokens, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {DS / TOKENS_NAME}")

    for p in DS.rglob("*.pen"):
        if p.name == TOKENS_NAME:
            continue
        process_file(p)


if __name__ == "__main__":
    main()
