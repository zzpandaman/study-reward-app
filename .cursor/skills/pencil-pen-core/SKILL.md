---
name: pencil-core-concepts
description: 用中文解释 Pencil 的 .pen Files、Design as Code、Variables、Components、Slots、Design Libraries 核心概念，并输出高密度要点。适用于用户提到 Pencil、.pen、Design as Code、Variables、Components、Slots、Design Libraries、design tokens、主题切换、组件复用、插槽扩展、设计库复用、设计走 Git diff、核心概念，或请求 /create-skill 生成 Pencil 基础技能时。
---

# Pencil Core Concepts (.pen + Design as Code)

## 适用范围

本技能仅覆盖六部分核心概念：
- JSON-based format
- Git-friendly collaboration
- Cross-platform portability
- Basic create/open/save workflow
- Commit/branch/merge design files like code
- Text diff review for design changes
- Variables as design tokens (color/spacing/radius/size/font)
- Theme columns (light/dark) and token-driven updates
- Components for reusable design units and consistency
- Origin-instance relationship and bulk updates
- Slots as flexible drop regions inside component origins
- Suggested slot components for constrained composition
- Design Libraries for cross-file component reuse
- Library-driven global component updates
- Lightweight best practices

## 权威来源

- Primary doc: https://docs.pencil.dev/core-concepts/pen-files
- Secondary doc: https://docs.pencil.dev/core-concepts/design-as-code
- Variables doc: https://docs.pencil.dev/core-concepts/variables
- Components doc: https://docs.pencil.dev/core-concepts/components
- Slots doc: https://docs.pencil.dev/core-concepts/slots
- Design Libraries doc: https://docs.pencil.dev/core-concepts/design-libraries
- 若用户提供其他官方 Pencil 文档，优先使用用户给定链接。

## 输出风格

- 默认中文表达，必要术语保留英文（如 Git diff、Design as Code）。
- 只输出高信息密度内容，避免冗余铺垫。
- 优先使用要点列表，少用长段落。

## 标准输出模板

除非用户另有要求，使用以下结构：

```markdown
## 核心概念
- `.pen` 是 JSON-based 设计文件格式，可读、可版本化。
- 适合 Git 协作，便于代码评审与变更追踪。
- 文件可移植，便于跨团队与跨环境共享。
- Design as Code：设计文件可像代码一样 commit、review、branch、merge。
- Variables 类似 CSS custom properties / design tokens：颜色、间距、圆角、尺寸、字体等可复用参数统一定义。
- 变量变更会联动所有引用元素；可通过主题列管理 light/dark 等主题。
- Components 用于复用设计单元与保持一致性：修改组件源可同步所有实例。
- 组件支持嵌套，适合作为设计系统基础能力。
- Slots 是组件内部可投放内容的指定区域，用于提升组件组合灵活性。
- 可为 slot 指定建议组件（suggested slot components），约束和引导可投放内容。
- Design Libraries 是可跨 `.pen` 文件导入的组件集合，适合统一沉淀设计系统资产。
- 库文件组件更新后，可在引用处同步生效，支持跨文件一致性维护。

## 工作方式
- 创建：新建 `.pen` 文件（IDE 或 Pencil Desktop）。
- 打开：像普通代码文件一样打开，Pencil 自动激活。
- 保存：手动保存（Cmd/Ctrl + S），当前无 auto-save。
- 协作：将 `.pen` 与代码同仓提交，通过 Git diff 审查设计变更。
- 变量创建：可手动定义，也可从 CSS/Figma 令 AI 协助提取并建立变量。
- 变量使用：优先引用变量，避免硬编码；按主题切换验证设计一致性。
- 组件创建：选中元素后创建组件（Cmd/Ctrl + Option/Alt + K 或属性区按钮）。
- 组件使用：复制组件源生成实例；需要回溯时使用 “Go to component” 定位源组件。
- Slot 创建：在组件源中将空 frame 标记为 slot（仅组件源中的空 frame 可设置）。
- Slot 使用：在组件实例中通过拖拽或复制粘贴把元素放入 slot。
- 约束提示：slot 区域在画布中有斜线标识，可在属性区维护建议组件列表。
- 设计库创建：新建文件并沉淀组件后，可将该文件标记为 library，文件后缀为 `.lib.pen`。
- 设计库导入：在目标文件导入库后，通过 Assets 面板检索并投放组件资产。

## 最佳实践
- 高频手动保存。
- 与代码同仓管理并高频提交 Git（commit 信息要清晰）。
- 使用语义化文件名（如 `dashboard.pen`、`components.pen`）。
- 先建立基础变量（色板/间距/字号），再搭页面，减少后续全局返工。
- 变量命名保持稳定语义（如 `color.primary`、`space.4`），避免按页面临时命名。
- 先组件化高复用模块（按钮/卡片/导航），再扩展页面，降低一致性维护成本。
- 复杂模块优先拆分为可嵌套组件，避免大组件难维护。
- 对高变体内容（如表格行、列表项）优先用 slot，而非为每种内容新建组件分支。
- 为每个 slot 维护“建议组件”集合，降低误用并提升团队协作一致性。
- 将跨页面通用组件优先沉淀到 design library，页面文件仅保留业务组装层。
- 规划库前先确认命名与结构；一旦文件标记为 library，官方说明不可撤销。
```

## Guardrails

- 不得虚构 Pencil 未声明能力。
- 涉及保存行为时，必须明确“当前无 auto-save”。
- Variables 仅描述官方已说明能力：定义、复用、主题列、与 CSS 双向同步语义。
- Components 仅描述官方已说明能力：创建组件、实例复用、源改动联动更新、可嵌套。
- Slots 仅描述官方已说明能力：组件源空 frame 建槽、建议组件、实例内投放内容。
- Design Libraries 仅描述官方已说明能力：`.lib.pen`、跨文件导入、Assets 使用、库更新联动。
- 必须明确：文件一旦标记为 design library，官方说明不可撤销。
- Design as Code 相关表述严格限定在官方明确能力（commit / diff / branch / merge）。
