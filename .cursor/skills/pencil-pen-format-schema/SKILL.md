---
name: pencil-pen-format-schema
description: 用中文解读 Pencil `.pen` 文件格式与 TypeScript Schema，并输出可执行的结构说明、字段约束与示例。适用于用户提到 `.pen`、The .pen Format、TypeScript Schema、Document schema、variables/themes、ref/descendants、slot、layout、fill/stroke/effect、或请求 /create-skill 生成 `.pen` 格式技能时。
---

# Pencil .pen Format + TypeScript Schema

## 适用范围

本技能用于回答和产出以下内容：
- `.pen` 文档整体结构（`Document` 顶层）
- 对象树模型（`children`、`id`、`type`）
- 布局与尺寸（`layout`、`padding`、`SizingBehavior`、`layoutPosition`）
- 图形系统（`fill`、`stroke`、`effect`）
- 复用机制（`reusable`、`ref`、`descendants`、slot）
- 变量与主题（`variables`、`themes`、`$variable` 绑定）
- 导入机制（`imports` 相对路径）
- TypeScript schema 细节问答与字段级校验

## 权威来源

- Primary doc: https://docs.pencil.dev/for-developers/the-pen-format
- TypeScript schema section: https://docs.pencil.dev/for-developers/the-pen-format#typescript-schema
- 若用户提供了新的官方链接，优先以用户链接为准。

## 输出风格

- 默认中文，高信息密度；术语保留英文（如 `Ref`、`Layout`、`BlendMode`）。
- 优先要点列表 + 小段示例，避免冗长背景介绍。
- 涉及约束时，明确“必须 / 可选 / 默认值 / 禁止项”。

## 快速工作流

1. 先判断用户诉求：
   - **读格式**：解释字段与关系
   - **写文件**：给最小可用 `.pen` JSON 样例
   - **排错**：逐项对照 schema 约束
2. 输出时固定覆盖：
   - 顶层 `Document`
   - 至少 1 个基础图元（如 `frame`/`text`）
   - 是否涉及 `ref` 复用
   - 是否涉及变量/主题
3. 若用户要“完整字段表”，按模块拆分输出：
   - Core entity
   - Layout & size
   - Graphics
   - Components/instances
   - Variables/themes/imports

## TypeScript Schema 输出策略

- **短答模式（默认）**：仅输出当前问题涉及字段，不展开全表。
- **详解模式（用户要求详尽/完整）**：按模块输出，并补充校验要点。
- **排错模式**：用“错误现象 -> 违反约束 -> 修复示例”格式。
- 需要详尽字段时，优先读取并遵循 [reference.md](reference.md)。

## 标准输出模板

除非用户另有要求，优先使用以下结构：

```markdown
## `.pen` 顶层结构（Document）
- `version`: 必填，当前 schema 示例为 `"2.10"`。
- `children`: 必填，画布根对象数组。
- `themes`: 可选，主题轴定义（每轴一个枚举数组）。
- `variables`: 可选，文档级变量（boolean/color/number/string）。
- `imports`: 可选，导入外部 `.pen`（相对路径）。

## 对象通用约束（Entity）
- `id` 必须唯一，且不得包含 `/`。
- `type` 必填，决定对象具体结构。
- 常见通用字段：`x/y`、`rotation`、`opacity`、`theme`、`reusable`。
- 父级为 flex layout 时，子级 `x/y` 会被布局系统忽略。

## 复用机制（Component + Ref）
- 组件：对象设 `reusable: true`。
- 实例：`type: "ref"` + `ref: "<component-id>"`。
- 局部覆写：`descendants` 以 `id path` 指向后代（如 `ok-button/label`）。
- 若覆写对象含 `type`，表示“对象替换”而非普通属性覆写。

## 变量与主题
- 变量引用采用 `$name`（例如 `fill: "$color.background"`）。
- 变量可按 theme 条件提供多值，命中规则为“最后一个满足条件的值”。
- `theme` 可挂在任意对象上，作用域覆盖其后代。

## 常见坑位
- 在 `ref.descendants` 的“属性覆写”模式下，不应写 `id/type/children`。
- `text` 想控制 `width/height` 时，必须先设置 `textGrowth`。
- `imports` 路径必须是相对 URI。
```

## 最小可用示例

```json
{
  "version": "2.10",
  "variables": {
    "color.bg": { "type": "color", "value": "#FFFFFF" },
    "color.text": { "type": "color", "value": "#222222" }
  },
  "children": [
    {
      "id": "card",
      "type": "frame",
      "reusable": true,
      "x": 40,
      "y": 40,
      "width": 320,
      "height": 120,
      "fill": "$color.bg",
      "children": [
        {
          "id": "title",
          "type": "text",
          "content": "Hello",
          "fill": "$color.text"
        }
      ]
    },
    {
      "id": "card-2",
      "type": "ref",
      "ref": "card",
      "x": 400,
      "y": 40,
      "descendants": {
        "title": { "content": "World" }
      }
    }
  ]
}
```

## Guardrails

- 不得虚构 schema 字段、默认值或对象类型。
- 用户说“按官方 schema 校验”时，仅基于官方文档与 schema 片段回答。
- 说明 `descendants` 时必须区分两种语义：属性覆写 vs 对象替换。
- 涉及 `text` 尺寸时，必须提示 `textGrowth` 先决条件。
- 输出样例时，保证 `id` 无 `/` 且同一文档内唯一。
- 用户要求“完整/详尽 schema”时，不得只给概念性摘要，必须给字段分组与校验清单。
