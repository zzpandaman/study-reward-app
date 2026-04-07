# 设计稿到代码映射（最小）

逆向原则：**Variables（token）→ 可复用组件（`reusable` + `ref`）→ 页面 Frame**，与代码结构一一对应。

全局变量与圆角：**`study-reward.tokens.pen`**（各页 `imports.sr`）。详见 `README.md`「全局主题」。

## 已维护

| 设计稿 | Route | 代码入口 | 设计组件 / 说明 | API |
|---|---|---|---|---|
| `pages/layout/app-shell.pen` | 壳层 | `AppShell.tsx` + `AppShell.css` | `Shell/*`；`Slot · page content` ≈ `<Outlet />`；token 对齐 `App.css` `:root` | `UserAPI`、`getCurrentUser` |
| `pages/auth/login.pen` | `/login` | `LoginRoute.tsx` | `Auth/*`；登录主卡 + 注册态小卡 | `login` / `register` |
| `pages/tasks/task-views.pen` | `/templates`、`/console` | `TemplatesPage.tsx`、`ConsolePage.tsx` | `Task/TemplateCard`；两 Screen | `TaskTemplateAPI`、`TaskExecutionAPI` |
| `pages/create/template-create.pen` | `/templates/new` | `TemplatesNewPage.tsx` | Page chrome + 表单卡 | `TaskTemplateAPI.createTaskTemplate` |
| `pages/commerce/shop.pen` | `/shop` | `ShopPage.tsx` | `Shop/ProductCard`；列表 + 展开购买态示例 | `ProductAPI`、`UserAPI` |
| `pages/create/shop-item-create.pen` | `/shop/new` | `ShopNewPage.tsx` | Page chrome + 名称/描述/单价/最小数量/单位 | `ProductAPI.createProduct` |
| `pages/points/points-list.pen` | `/points` | `PointsPage.tsx` | `Points/RecordRow`；类型 Tab + 列表 | `UserAPI.getPointRecords` |
| `pages/detail/point-record-detail.pen` | `/points/:id` | `PointRecordDetailPage.tsx` | 两 Frame：earn / spend 详情 | `UserAPI`、`TaskExecutionAPI` |
| `pages/inventory/inventory.pen` | `/inventory` | `InventoryPage.tsx` | `Inventory/ItemRow` | `UserAPI.getInventory` |
| `pages/settings/settings.pen` | `/settings` | `SettingsPage.tsx` | 样式定制浮层（`StyleCustomizer`）：Tab + 预设栅格 + 上传占位 | `localStorage` 自定义样式 |

## 待建

当前路由与主列表页均已覆盖；后续若新增页面，在此表追加一行即可。
