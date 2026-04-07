---
name: pencil-usage
description: 使用 Pencil 进行设计到开发的双向协作，包含 .pen 文件规范、变量、组件、插槽、设计库、导入导出与快捷键。用于用户提到 Pencil、.pen、设计稿逆向、Design to Code、Code to Design、设计系统同步时。
---

# Pencil Usage

## 适用场景
- 用户提到：`Pencil`、`.pen`、设计稿逆向、Design to Code、Code to Design、Variables、Components、Slots、Design Libraries。
- 需要把当前代码实现逆向为设计稿，或把设计稿同步到代码。

## 硬规则
1. `.pen` 文件必须是合法 JSON。
2. 设计资产与代码同仓维护，走 Git 分支与提交。
3. 设计组织按设计域（layout/tasks/commerce/...），不要把代码映射塞进文件名。
4. 代码映射集中在单文件（如 `design-sources/code-map.md`），不要分散多文档。
5. 无 `.pen` 设计源，不进入开发实现。

## 标准流程（默认）
1. **确认范围**：页面/组件清单 + 目标路由。
2. **逆向或建稿**：在 `design-sources/` 下创建或更新 `.pen`。
3. **结构优先**：先补 `blocks/states/interactions`，再细化视觉。
4. **映射同步**：更新 `code-map.md` 的 Route/Page/Components/API。
5. **校验**：所有 `.pen` 通过 JSON 解析。
6. **提交建议**：设计与代码同次或同分支提交，便于追溯。

## .pen 最小模板
```json
{
  "meta": "templates page",
  "type": "page",
  "version": "v1.0",
  "status": "draft",
  "blocks": ["filter-bar", "list"],
  "states": ["default", "loading", "empty", "error"],
  "interactions": ["search", "page-switch"]
}
```

## Design ↔ Code 规则
- **Design -> Code**：从 `.pen` 生成代码草稿后，必须按项目现有风格收敛。
- **Code -> Design**：从现有页面/组件逆向回 `.pen`，补状态与交互。
- 两向同步时优先同步 Variables（token），避免视觉漂移。

## Variables / Components / Slots
- Variables：颜色、间距、字号、圆角等统一变量，不硬编码。
- Components：重复结构必须组件化，实例优先 override。
- Slots：容器组件优先 slot 化，降低复制粘贴。

## Design Libraries
- 可复用资产沉淀为 `.lib.pen`。
- 业务文件引用库，不复制基础组件。

## 导入导出
- 导入：Figma/图片/SVG 用于迁移与素材吸收。
- 导出：PNG/JPEG/WEBP/PDF 用于评审与交付展示。
- 主资产永远是 `.pen`。

## 常用快捷键（高频）
- `Cmd/Ctrl + S`：保存
- `Cmd/Ctrl + K`：AI Chat
- `Cmd/Ctrl + Option/Alt + K`：创建/取消组件
- `Cmd/Ctrl + Option/Alt + G`：应用 flex 布局
- `Cmd/Ctrl + Z` / `Cmd/Ctrl + Shift + Z`：撤销 / 重做

## 执行检查清单
- [ ] 新增或更新了 `.pen`
- [ ] `.pen` 为合法 JSON
- [ ] `code-map.md` 已同步
- [ ] 状态覆盖默认/加载/空态/错误（按需含禁用）
- [ ] 设计与代码可双向追溯
