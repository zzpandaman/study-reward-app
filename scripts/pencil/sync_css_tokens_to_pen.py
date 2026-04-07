#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CSS_FILE = ROOT / "src" / "App.css"
OUT_FILE = ROOT / "docs" / "design" / "pencil" / "design-sources" / "tokens.pen"


def parse_css_vars(css_text: str):
    pattern = re.compile(r"--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);")
    return pattern.findall(css_text)


def map_token(name: str, value: str):
    value = value.strip()
    key = name.replace("-", ".")
    if re.fullmatch(r"#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})", value):
        return key, {"type": "color", "value": value}
    if re.fullmatch(r"-?\d+(\.\d+)?", value):
        return key, {"type": "number", "value": float(value)}
    return key, {"type": "string", "value": value}


def main():
    if not CSS_FILE.exists():
        print("css not found, skip")
        return
    css = CSS_FILE.read_text(encoding="utf-8")
    pairs = parse_css_vars(css)
    variables = {}
    for name, value in pairs:
        k, v = map_token(name, value)
        variables[k] = v

    doc = {
        "version": "2.9",
        "variables": variables,
        "children": [
            {
                "id": "tokens_board",
                "type": "frame",
                "x": 0,
                "y": 0,
                "width": 960,
                "height": 320,
                "children": [
                    {
                        "id": "tokens_title",
                        "type": "text",
                        "textGrowth": "fixed-width",
                        "width": 920,
                        "content": "Design Tokens from src/App.css",
                        "fontSize": 20,
                    }
                ],
            }
        ],
    }
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"synced {len(variables)} tokens")


if __name__ == "__main__":
    main()

