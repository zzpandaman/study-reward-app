#!/usr/bin/env python3
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ROUTES_FILE = ROOT / "src" / "AppRoutes.tsx"
DESIGN_ROOT = ROOT / "docs" / "design" / "pencil" / "design-sources"
CODE_MAP = DESIGN_ROOT / "code-map.md"


ROUTE_TO_PEN = {
    "/login": "pages/auth/login.pen",
    "/console": "pages/tasks/console-focus.pen",
    "/templates": "pages/tasks/templates.pen",
    "/templates/new": "pages/tasks/template-create.pen",
    "/shop": "pages/shop/shop.pen",
    "/shop/new": "pages/shop/shop-item-create.pen",
    "/points": "pages/points/points-list.pen",
    "/points/:id": "pages/points/point-record-detail.pen",
    "/inventory": "pages/inventory/inventory.pen",
    "/settings": "pages/settings/settings.pen",
}


def parse_routes(tsx: str):
    pattern = re.compile(r'<Route\s+path="([^"]+)"\s+element={<([A-Za-z0-9_]+)\s*/>}')
    return pattern.findall(tsx)


def page_path(component_name: str):
    return f"src/pages/{component_name}.tsx"


def parse_page_components_and_apis(page_file: Path):
    if not page_file.exists():
        return "-", "-"
    text = page_file.read_text(encoding="utf-8")

    component_paths = []
    for match in re.findall(r"import\s+[^;]+\s+from\s+'([^']+)'", text):
        if match.startswith("../components/"):
            base = match.split("/")[-1]
            component_paths.append(f"src/components/{base}.tsx")
        elif match.startswith("../layouts/"):
            base = match.split("/")[-1]
            component_paths.append(f"src/layouts/{base}.tsx")
    component_paths = sorted(set(component_paths))

    apis = set(re.findall(r"\b([A-Za-z0-9_]*API)\b", text))
    if "api" in text:
        # 兜底：针对 `import { hasToken } from '../api'` 这类聚合 API 使用
        if "hasToken" in text:
            apis.add("hasToken")
        if "logout" in text:
            apis.add("logout")
        if "getCurrentUser" in text:
            apis.add("getCurrentUser")
    api_list = sorted(apis)

    components_str = " / ".join(component_paths) if component_paths else "-"
    api_str = " / ".join(api_list) if api_list else "-"
    return components_str, api_str


def ensure_pen(path: Path, title: str):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    doc = {
        "version": "2.9",
        "children": [
            {
                "id": f"page_{path.stem.replace('-', '_')}",
                "type": "frame",
                "x": 0,
                "y": 0,
                "width": 1280,
                "height": 800,
                "layout": "vertical",
                "padding": [24, 24, 24, 24],
                "children": [
                    {
                        "id": f"title_{path.stem.replace('-', '_')}",
                        "type": "text",
                        "textGrowth": "fixed-width",
                        "width": 1232,
                        "content": title,
                        "fontSize": 24,
                    }
                ],
            }
        ],
    }
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def build_map_rows(routes):
    rows = []
    for route, comp in routes:
        if route not in ROUTE_TO_PEN:
            continue
        pen = ROUTE_TO_PEN[route]
        page = page_path(comp)
        page_file = ROOT / page
        components, apis = parse_page_components_and_apis(page_file)
        rows.append((pen, route, page, components, apis))
    return rows


def write_code_map(rows):
    lines = [
        "# 设计稿到代码映射（最小）",
        "",
        "| 设计稿 | Route | Page | Components | API |",
        "|---|---|---|---|---|",
    ]
    for pen, route, page, components, apis in rows:
        lines.append(f"| `{pen}` | `{route}` | `{page}` | `{components}` | `{apis}` |")
    CODE_MAP.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    tsx = ROUTES_FILE.read_text(encoding="utf-8")
    routes = parse_routes(tsx)
    rows = build_map_rows(routes)
    for pen, route, page, _, _ in rows:
        ensure_pen(DESIGN_ROOT / pen, f"{route} -> {page}")
    write_code_map(rows)
    print(f"synced {len(rows)} routes")


if __name__ == "__main__":
    main()

