# Pencil 设计源（初始化）

本目录用于维护前端页面的 Pencil 设计源，与 `src/pages` / `src/layouts` / `src/components` 做最小可追踪映射。

## 目录约定

- 设计源：`docs/design/pencil/design-sources/`
- 页面设计稿：`docs/design/pencil/design-sources/pages/**.pen`
- 设计 tokens：`docs/design/pencil/design-sources/study-reward.tokens.pen`
- 代码映射：`docs/design/pencil/design-sources/code-map.md`

## 同步原则（首版）

- 先保证路径稳定，再逐步细化页面节点。
- 页面结构以现有代码为准，不在设计稿中引入额外业务交互。
- 涉及布局/主题变更时，同步更新 tokens 与 code-map。

## 首版骨架完成标准

- 顶层 frame 使用 `page_*` 命名，页面标题与说明保留。
- 页面至少包含语义分区中的 2-4 项：`header` / `sidebar` / `content` / `form` / `list` / `detail`。
- `design-sources/code-map.md` 必须能定位到对应 `src/pages`、`src/layouts`、`src/components`。
