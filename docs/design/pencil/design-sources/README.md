# Design Sources

本目录只管理设计稿，不掺杂实现细节。

## 全局主题（必读本文件）

- `study-reward.tokens.pen`：**唯一颜色/圆角数值源**；所有页面 `.pen` 通过 `imports.sr` 引用。
- 页面节点里请写 **`$sr:color.*` / `$sr:radius.*`**（与 import 键 `sr` 对应）；tokens 根文件内无 import，说明文字可直接用 hex。
- 圆角阶梯：`$sr:radius.tight`(8) → `control`(12) → `card`(16) → `panel`(20) → `screen`(24) → `pill`(999)。
- 改全稿风格：先改 tokens，再运行 `python3 scripts/sync-pencil-design-tokens.py`（会重写 token 文件并重新扫稿；若仅手改 tokens，页面内勿再写散落的 `variables`）。
- 与「个人设置 → 样式定制」关系：该功能改的是运行时 CSS（`StyleCustomizer` / `applyCustomStyle`）；设计稿对应**默认主题**，与 `$color.*` / `$radius.*` 一致。

## 目录结构
子目录**随稿件递增创建**；当前已有：

- `pages/layout/app-shell.pen`：壳层 + Shell 组件库
- `pages/auth/login.pen`：登录/注册 + Auth 组件库
- `pages/tasks/task-views.pen`：积分模版列表 + 控制台
- `pages/create/template-create.pen`、`shop-item-create.pen`：新建模版 / 新建商品
- `pages/commerce/shop.pen`：积分商店列表与兑换展开态
- `pages/points/points-list.pen`、`pages/detail/point-record-detail.pen`：积分记录列表与详情
- `pages/inventory/inventory.pen`：背包
- `pages/settings/settings.pen`：样式定制（浮层）

新增业务页时：在对应 `pages/<域>/` 下增 `.pen`，并更新 `code-map.md` 一行。若某组件需多页复用且不宜塞进单一页面 `.pen`，再在 `components/<domain>/` 拆独立 `.pen`。

## 命名约定
- 页面：`<page>.pen`
- 组件：`<component>.pen`
- 只要求可读，不堆前缀。

## 约束
- 设计调整优先改 `.pen`（推荐用 Pencil MCP：`batch_design` / `set_variables` / `get_screenshot` 校验）。
- `.pen` 与 Pencil 引擎一致：当前 schema 为 `version: \"2.10\"`；壳层页左侧为 **Design kit**（`reusable` 组件），右侧为 **Screen** 合成稿。
- 代码映射统一维护在 `code-map.md`（单文件，不分散）。
