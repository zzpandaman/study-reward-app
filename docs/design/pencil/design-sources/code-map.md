# 设计稿到代码映射（初始化）

| 设计稿 | Route | Page | Layout / Components | 骨架分区 |
|---|---|---|---|---|
| `pages/layout/app-shell.pen` | `/*`（登录外） | `src/layouts/AppShell.tsx` | `src/layouts/AppShell.css` | `sidebar` + `header` + `content` |
| `pages/auth/login.pen` | `/login` | `src/pages/LoginRoute.tsx` | `src/components/LoginPage.tsx` | `content` + `form` |
| `pages/tasks/task-views.pen` | `/console`, `/templates` | `src/pages/ConsolePage.tsx`, `src/pages/TemplatesPage.tsx` | `src/components/TaskManager.tsx`, `src/components/ConsoleTodoPanel.tsx` | `header` + `list` + `detail` |
| `pages/create/template-create.pen` | `/templates/new` | `src/pages/TemplatesNewPage.tsx` | `src/pages/PageChrome.css` | `header` + `form` + `detail` |
| `pages/commerce/shop.pen` | `/shop` | `src/pages/ShopPage.tsx` | `src/components/Shop.tsx` | `header` + `list` |
| `pages/create/shop-item-create.pen` | `/shop/new` | `src/pages/ShopNewPage.tsx` | `src/pages/PageChrome.css` | `header` + `form` + `detail` |
| `pages/points/points-list.pen` | `/points` | `src/pages/PointsPage.tsx` | `src/components/PointRecords.tsx` | `header` + `list` |
| `pages/detail/point-record-detail.pen` | `/points/:id` | `src/pages/PointRecordDetailPage.tsx` | `src/pages/PageChrome.css` | `header` + `detail` + `list` |
| `pages/inventory/inventory.pen` | `/inventory` | `src/pages/InventoryPage.tsx` | `src/components/Inventory.tsx` | `header` + `list` + `detail` |
| `pages/settings/settings.pen` | `/settings` | `src/pages/SettingsPage.tsx` | `src/components/PairingSettingsSection.tsx` | `header` + `sidebar` + `form` |

## 后续同步流程（最小）

1. 页面结构变化：先改代码，再补对应 `.pen` 页面结构。
2. 全局视觉变化：先改 `study-reward.tokens.pen`，再检查页面引用。
3. 每次新增页面路由时，同步追加本表一行映射。
4. `login.pen`、`app-shell.pen` 已接入 `study-reward.tokens.pen` 的 `imports`；为规避 `batch_design` 覆盖 document-level metadata 的限制，两页同时保留页面内 `page.*` variables 作为可执行桥接层，关键视觉属性统一引用 `$page.*`。

## 第三阶段补充（本轮最小映射）

- `pages/create/template-create.pen`：新增 `component/form-section`，在 `form/template-form` 与 `detail/template-preview` 以 `ref` 落位。
- `pages/create/shop-item-create.pen`：新增 `component/form-section`，在 `form/shop-item-form` 与 `detail/shop-item-preview` 以 `ref` 落位。
- `pages/points/points-list.pen`：新增 `component/point-row`，在 `list/points-records` 以 `ref` 落位（复用两次）。
- `pages/detail/point-record-detail.pen`：新增 `component/detail-kv`，在 `detail/point-record` 与 `list/trace-log` 以 `ref` 落位。
- `pages/inventory/inventory.pen`：新增 `component/inventory-item`，在 `list/inventory-list` 与 `detail/inventory-detail` 以 `ref` 落位。

## 全局 token -> 页面桥接键（统一规范）

- 仅允许以下桥接前缀：`page.bg.*` / `page.text.*` / `page.border.*` / `page.space.*` / `page.radius.*` / `page.font.*`。
- 页面属性优先引用 `$page.*`；`study-reward.tokens.pen` 与各页面内同名 `page.*` 保持同值。
- 禁止新增未在上述前缀内的页面语义键（禁止“野生语义”变量名）。
