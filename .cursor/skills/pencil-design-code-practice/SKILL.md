---
name: pencil-design-code-practice
description: 用中文输出 Pencil Design ↔ Code 关键实操清单、提示词模板与双向同步流程。适用于用户提到 Pencil 设计转代码、代码导入设计、双向同步、design tokens 同步、技术栈约束、图标库替换，或请求 /create-skill 生成 Pencil 实操技能时。
---

# Pencil Design ↔ Code Key Practice

## 适用范围

本技能仅覆盖 Design ↔ Code 的高频实操：
- Design -> Code：从 `.pen` 生成组件/页面代码
- Code -> Design：把现有代码组件还原为可编辑设计
- Two-Way Sync：设计与代码迭代同步
- Variables & Tokens：Pencil Variables 与 CSS Variables 同步
- Stack Constraints：框架/样式/组件库约束提示
- Icon Strategy：代码生成时的图标库指定与替换

## 权威来源

- Primary doc: https://docs.pencil.dev/design-and-code/design-to-code
- 若用户提供其他官方 Pencil 文档，优先使用用户给定链接。

## 输出风格

- 默认中文，技术术语保留英文（Design -> Code、tokens、shadcn/ui）。
- 只给高信息密度要点，不做冗余铺垫。
- 优先给“步骤 + 可复制提示词 + 检查清单”。

## 标准输出模板

除非用户另有要求，按以下结构组织回答：

```markdown
## 快速路径
- 新功能：先 Design -> Code，再工程化收敛。
- 旧功能改造：先 Code -> Design，再可视化改版，最后回写代码。

## Design -> Code（从 .pen 生成代码）
1. 在画布完成页面/组件设计。
2. `.pen` 放在项目工作区并保存。
3. 打开 AI chat（Cmd/Ctrl + K）。
4. 明确“产物类型 + 技术栈 + 组件库 + 图标库”再生成。

可复制提示词：
- `把这个按钮导出为 React + TypeScript 可复用组件`
- `基于这个页面生成 Next.js 14 + Tailwind CSS 页面代码`
- `使用 shadcn/ui 与 React Hook Form 生成这个表单`
- `使用 Lucide icons，不要 Material Icons`

## Code -> Design（从代码还原设计）
前置条件：
- `.pen` 与代码在同一 workspace。
- Agent 能访问目标源码文件。

流程：
1. 打开目标 `.pen`。
2. 在 AI chat 指定源码路径并要求重建。
3. 导入后先核对层级、布局、字体、间距与颜色。

可复制提示词：
- `将 src/components/Button.tsx 重建到当前设计文件`
- `把 src/layouts/Header.tsx 导入为可编辑设计组件`

## Two-Way Sync（双向同步）
1. 从代码导入基础组件到 Pencil。
2. 在 Pencil 做结构/视觉优化。
3. 要求 Agent 把变更回写到对应源码。
4. 小步迭代：每轮只改一个主题（布局/样式/交互之一）。

## Variables & Tokens（变量同步）
CSS -> Pencil：
- `从 src/styles/tokens.css 创建 Pencil variables`
- `从 globals.css 导入 design tokens`

Pencil -> CSS：
- `把当前 Pencil variables 同步到 globals.css`
- `更新 tokens.css，使其与当前设计变量一致`

## 栈与库约束写法
- 框架：`Next.js 14` / `React TS` / `Vue TS`
- 样式：`Tailwind CSS` / `CSS Modules` / `Styled Components`
- 组件库：`shadcn/ui` / `Radix UI` / `Chakra UI` / `MUI`
- 图标库：`Lucide` / `Heroicons` / `FontAwesome`

示例组合提示词：
- `生成 React TS 代码，使用 Tailwind + shadcn/ui + Lucide，保持语义化组件拆分`

## Best Practices（官方推荐）
文件组织：
1. 把 `.pen` 放在仓库内，与 `src/` 同级或同工作区可见位置。
2. 让设计文件与代码同仓版本化，保证变更可追踪。

工作流建议：
1. 新功能：先在 Pencil 设计，再生成初版代码，再工程化细化，必要时回写设计。
2. 旧功能：先从代码导入到 Pencil，再做可视化改版，最后把改动同步回代码。
3. 设计系统：先维护 Variables，再同步到 CSS，在设计与代码两端统一引用。

## 交付前检查清单
- [ ] 生成代码与项目现有技术栈一致
- [ ] 组件命名、目录结构、样式方案符合仓库规范
- [ ] tokens 未硬编码，优先走变量引用
- [ ] 图标库已按要求统一
- [ ] 改动可在本地编译并通过基础页面验收
```

## Guardrails

- 不得把 Pencil 描述为“自动实时双向同步”；应表述为“通过 AI 指令进行迭代同步”。
- 不得虚构 Pencil 未声明能力。
- Code -> Design 必须强调同一 workspace 与源码可访问前提。
- 输出提示词时，优先给可直接复制的一行命令式句子。
- 当用户已指定技术栈/组件库/图标库，回答必须显式继承这些约束。
