# The .pen Format（按原文档结构）

Pencil documents are stored in `.pen` files。该文件是给“详尽模式”使用的结构化参考，章节顺序与官方文档一致，并包含全部示例。

## Overview

- `.pen` 文件是 JSON 结构，表达对象树（类似 HTML/SVG）。
- 每个对象是无限二维画布上的图形实体。
- 每个对象必须有唯一 `id` 与合法 `type`（完整类型以 TypeScript schema 为准）。

## Layout

- 顶层对象位于无限画布，使用 `x`、`y` 定位左上角。
- 子对象坐标相对父对象左上角。
- 父对象可通过 flex 风格属性（如 `layout`、`justifyContent`、`alignItems`）接管子元素布局。
- 子对象可固定 `width/height`，也可选择填充父容器。
- 父对象可固定大小，也可按子元素内容适配（fit content）。

## Graphics

- 图形外观由 `fill`、`stroke`、`effect` 控制。
- `fill` 可为 `color` / `gradient`（linear/radial/angular）/ `image` / `mesh_gradient`。
- 支持多重 `fill`（按数组顺序叠加）。
- 对象只有一个 `stroke`，但 `stroke` 自身可有多 `fill`。
- 支持多个 `effect`（按数组顺序应用）。

## Components and Instances

Pencil 与 HTML/SVG 的关键差异：支持对象树片段复用，构建可复用组件。

### Components

当对象标记 `reusable: true` 后成为可复用组件。

```json
{
  "id": "foo",
  "type": "rectangle",
  "reusable": true,
  "x": 0,
  "y": 0,
  "width": 100,
  "height": 100,
  "fill": "#FF0000"
}
```

### Instances

使用 `type: "ref"` 创建组件实例。

```json
{
  "id": "bar",
  "type": "ref",
  "ref": "foo",
  "x": 120,
  "y": 0
}
```

### Overrides

实例可覆写组件属性。

```json
{
  "id": "baz",
  "type": "ref",
  "ref": "foo",
  "x": 240,
  "y": 0,
  "fill": "#0000FF"
}
```

### Nesting

实例会复制组件根节点下的全部结构。

```json
{
  "id": "round-button",
  "type": "frame",
  "reusable": true,
  "cornerRadius": 9999,
  "children": [
    {
      "id": "label",
      "type": "text",
      "content": "Submit",
      "fill": "#000000"
    }
  ]
}

{
  "id": "red-round-button",
  "type": "ref",
  "ref": "round-button",
  "fill": "#FF0000"
}
```

可通过 `descendants` 定位后代并覆写。

```json
{
  "id": "red-round-button",
  "type": "ref",
  "ref": "round-button",
  "fill": "#FF0000",
  "descendants": {
    "label": {
      "text": "Cancel",
      "fill": "#FFFFFF"
    }
  }
}
```

组件可由其他组件实例构成。

```json
{
  "id": "alert",
  "type": "frame",
  "reusable": true,
  "children": [
    {
      "id": "message",
      "type": "text",
      "content": "This is an alert!",
      "fill": "#000000"
    },
    {
      "id": "ok-button",
      "type": "ref",
      "ref": "round-button",
      "descendants": {
        "label": {
          "text": "OK"
        }
      }
    },
    {
      "id": "cancel-button",
      "type": "ref",
      "ref": "round-button",
      "descendants": {
        "label": {
          "text": "Cancel"
        }
      }
    }
  ]
}
```

嵌套实例后代可用 `instance-id/child-id` 路径覆写。

```json
{
  "id": "save-alert",
  "type": "ref",
  "ref": "alert",
  "descendants": {
    "message": {
      "content": "You have unsaved changes. Do you want to save them?"
    },
    "ok-button/label": {
      "content": "Save"
    },
    "cancel-button/label": {
      "content": "Discard Changes",
      "fill": "#FF0000"
    }
  }
}
```

可做对象级替换（`descendants` 中目标含 `type`）。

```json
{
  "id": "icon-button",
  "type": "ref",
  "ref": "round-button",
  "descendants": {
    "label": {
      "id": "icon",
      "type": "icon_font",
      "iconFontFamily": "lucide",
      "icon": "check"
    }
  }
}
```

也可仅替换后代的 `children`。

```json
{
  "id": "sidebar",
  "type": "frame",
  "reusable": true,
  "children": [
    {
      "id": "header",
      "type": "frame",
      "fill": "#FF0000"
    },
    {
      "id": "content",
      "type": "frame",
      "fill": "#00FF00"
    },
    {
      "id": "footer",
      "type": "frame",
      "fill": "#0000FF"
    }
  ]
}

{
  "id": "menu-sidebar",
  "type": "ref",
  "ref": "sidebar",
  "descendants": {
    "content": {
      "children": [
        {
          "id": "home-button",
          "type": "ref",
          "ref": "round-button",
          "descendants": {
            "label": {
              "text": "Home"
            }
          }
        },
        {
          "id": "settings-button",
          "type": "ref",
          "ref": "round-button",
          "descendants": {
            "label": {
              "text": "Settings"
            }
          }
        },
        {
          "id": "help-button",
          "type": "ref",
          "ref": "round-button",
          "descendants": {
            "label": {
              "text": "Help"
            }
          }
        }
      ]
    }
  }
}
```

## Slots

组件内部用于承载可替换内容的 frame，可通过 `slot` 标记并给出推荐组件。

```json
{
  "id": "sidebar",
  "type": "frame",
  "reusable": true,
  "children": [
    {
      "id": "header",
      "type": "frame",
      "fill": "#FF0000"
    },
    {
      "id": "content",
      "type": "frame",
      "fill": "#00FF00",
      "slot": [
        "round-button",
        "icon-button"
      ]
    },
    {
      "id": "footer",
      "type": "frame",
      "fill": "#0000FF"
    }
  ]
}
```

## Variables and Themes

变量可抽离颜色/数值并在文档范围复用。

```json
{
  "variables": {
    "color.background": {
      "type": "color",
      "value": "#FFFFFF"
    },
    "color.text": {
      "type": "color",
      "value": "#333333"
    },
    "text.title": {
      "type": "number",
      "value": 72
    }
  },
  "children": [
    {
      "id": "landing-page",
      "type": "frame",
      "fill": "$color.background",
      "children": [
        {
          "id": "welcome-label",
          "type": "text",
          "fill": "$color.text",
          "fontSize": "$text.title",
          "content": "Welcome!"
        }
      ]
    }
  ]
}
```

变量可按主题条件动态求值；多值命中时取最后满足条件项。

```json
{
  "variables": {
    "color.background": {
      "type": "color",
      "value": [
        { "value": "#FFFFFF", "theme": { "mode": "light" } },
        { "value": "#000000", "theme": { "mode": "dark" } }
      ]
    },
    "color.text": {
      "type": "color",
      "value": [
        { "value": "#333333", "theme": { "mode": "light" } },
        { "value": "#AAAAAA", "theme": { "mode": "dark" } }
      ]
    },
    "text.title": {
      "type": "number",
      "value": [
        { "value": 72, "theme": { "spacing": "regular" } },
        { "value": 36, "theme": { "spacing": "condensed" } }
      ]
    }
  },
  "themes": {
    "mode": ["light", "dark"],
    "spacing": ["regular", "condensed"]
  },
  "children": [
    {
      "id": "landing-page-light",
      "type": "frame",
      "fill": "$color.background",
      "children": [
        {
          "id": "welcome-label",
          "type": "text",
          "fill": "$color.text",
          "fontSize": "$text.title",
          "content": "Welcome!"
        }
      ]
    },
    {
      "id": "landing-page-dark",
      "type": "frame",
      "theme": { "mode": "dark" },
      "fill": "$color.background",
      "children": [
        {
          "id": "welcome-label",
          "type": "text",
          "fill": "$color.text",
          "fontSize": "$text.title",
          "content": "Welcome!"
        }
      ]
    },
    {
      "id": "landing-page-dark-condensed",
      "type": "frame",
      "fill": "$color.background",
      "theme": { "mode": "dark", "spacing": "condensed" },
      "children": [
        {
          "id": "welcome-label",
          "type": "text",
          "fill": "$color.text",
          "fontSize": "$text.title",
          "content": "Welcome!"
        }
      ]
    }
  ]
}
```

## TypeScript Schema

该章节在输出时应遵循：

- 用户仅问局部字段：给局部类型和关键约束。
- 用户要求“完整/详尽”：给完整类型分组（`Document`、基础别名、`Layout/Graphics`、各 `Child` union 成员、`Ref.descendants` 约束、`variables/themes/imports`）。
- 若需贴出原始 schema，请以官方页面末尾 `generated-types-public.ts` 为准，不得自行改写类型含义。

```ts
/** Each key must be an existing theme axis, and each value must be one of the possible values for that axis. E.g. { 'device': 'phone' } */
export interface Theme {
  [key: string]: string;
}

/** To bind a variable to a property, set the property to the dollar-prefixed name of the variable! */
export type Variable = string;

export type NumberOrVariable = number | Variable;

/** Colors can be 8-digit RGBA hex strings (e.g. #AABBCCDD), 6-digit RGB hex strings (e.g. #AABBCC) or 3-digit RGB hex strings (e.g. #ABC which means #AABBCC). */
export type Color = string;

export type ColorOrVariable = Color | Variable;

export type BooleanOrVariable = boolean | Variable;

export type StringOrVariable = string | Variable;

export interface Layout {
  /** Enable flex layout. None means all children are absolutely positioned and will not be affected by layout properties. Frames default to horizontal, groups default to none. */
  layout?: "none" | "vertical" | "horizontal";
  /** The gap between children in the main axis direction. Defaults to 0. */
  gap?: NumberOrVariable;
  layoutIncludeStroke?: boolean;
  /** The Inside padding along the edge of the container */
  padding?:
    | NumberOrVariable
    | [NumberOrVariable, NumberOrVariable]
    | [NumberOrVariable, NumberOrVariable, NumberOrVariable, NumberOrVariable];
  /** Control the justify alignment of the children along the main axis. Defaults to 'start'. */
  justifyContent?:
    | "start"
    | "center"
    | "end"
    | "space_between"
    | "space_around";
  /** Control the alignment of children along the cross axis. Defaults to 'start'. */
  alignItems?: "start" | "center" | "end";
}

/** SizingBehavior controls the dynamic layout size.
- fit_content: Use the combined size of all children for the container size. Fallback is used when there are no children.
- fill_container: Use the parent size for the container size. Fallback is used when the parent has no layout.
Optional number in parentheses (e.g., 'fit_content(100)') specifies the fallback size. */
export type SizingBehavior = string;

/** Position is relative to the parent object's position. X increases rightwards, Y increases downwards.
IMPORTANT: x and y are IGNORED when parent uses flexbox layout. */
export interface Position {
  x?: number;
  y?: number;
}

export interface Size {
  width?: NumberOrVariable | SizingBehavior;
  height?: NumberOrVariable | SizingBehavior;
}

export interface CanHaveRotation {
  /** Rotation is represented in degrees, measured counter-clockwise. */
  rotation?: NumberOrVariable;
}

export type BlendMode =
  | "normal"
  | "darken"
  | "multiply"
  | "linearBurn"
  | "colorBurn"
  | "light"
  | "screen"
  | "linearDodge"
  | "colorDodge"
  | "overlay"
  | "softLight"
  | "hardLight"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export type Fill =
  | ColorOrVariable
  | {
      type: "color";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      color: ColorOrVariable;
    }
  | {
      type: "gradient";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      gradientType?: "linear" | "radial" | "angular";
      opacity?: NumberOrVariable;
      /** Normalized to bounding box (default: 0.5,0.5). */
      center?: Position;
      /** Normalized to bounding box (default: 1,1). Linear: height sets gradient length, width is ignored. Radial/Angular: sets ellipse diameters. */
      size?: { width?: NumberOrVariable; height?: NumberOrVariable };
      /** Rotation in degrees, counterclockwise (0° up, 90° left, 180° down). */
      rotation?: NumberOrVariable;
      colors?: { color: ColorOrVariable; position: NumberOrVariable }[];
    }
  | {
      type: "image";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      opacity?: NumberOrVariable;
      url: string;
      mode?: "stretch" | "fill" | "fit";
    }
  | {
      type: "mesh_gradient";
      enabled?: BooleanOrVariable;
      blendMode?: BlendMode;
      opacity?: NumberOrVariable;
      columns?: number;
      rows?: number;
      colors?: ColorOrVariable[];
      points?: (
        | [number, number]
        | {
            position: [number, number];
            leftHandle?: [number, number];
            rightHandle?: [number, number];
            topHandle?: [number, number];
            bottomHandle?: [number, number];
          }
      )[];
    };

export type Fills = Fill | Fill[];

export interface Stroke {
  align?: "inside" | "center" | "outside";
  thickness?:
    | NumberOrVariable
    | {
        top?: NumberOrVariable;
        right?: NumberOrVariable;
        bottom?: NumberOrVariable;
        left?: NumberOrVariable;
      };
  join?: "miter" | "bevel" | "round";
  miterAngle?: NumberOrVariable;
  cap?: "none" | "round" | "square";
  dashPattern?: number[];
  fill?: Fills;
}

export type Effect =
  | { enabled?: BooleanOrVariable; type: "blur"; radius?: NumberOrVariable }
  | {
      enabled?: BooleanOrVariable;
      type: "background_blur";
      radius?: NumberOrVariable;
    }
  | {
      type: "shadow";
      enabled?: BooleanOrVariable;
      shadowType?: "inner" | "outer";
      offset?: { x: NumberOrVariable; y: NumberOrVariable };
      spread?: NumberOrVariable;
      blur?: NumberOrVariable;
      color?: ColorOrVariable;
      blendMode?: BlendMode;
    };

export type Effects = Effect | Effect[];

export interface CanHaveGraphics {
  stroke?: Stroke;
  fill?: Fills;
  effect?: Effects;
}

export interface CanHaveEffects {
  effect?: Effects;
}

/** Entities have unique identifiers. */
export interface Entity extends Position, CanHaveRotation {
  /** A unique string that MUST NOT contain slash (/) characters. If omitted, a unique ID will be generated automatically. */
  id: string;
  /** Optional name for the entity, used for display and identification purposes */
  name?: string;
  /** Optional context information about this object. */
  context?: string;
  /** Objects are not reusable by default. If an object is made reusable by setting this property to `true`, the object can be duplicated using `ref` objects. */
  reusable?: boolean;
  theme?: Theme;
  enabled?: BooleanOrVariable;
  opacity?: NumberOrVariable;
  flipX?: BooleanOrVariable;
  flipY?: BooleanOrVariable;
  /** layoutPosition controls how a node is positioned within its parent. */
  layoutPosition?: "auto" | "absolute";
  metadata?: { type: string; [key: string]: any };
}

export interface Rectangleish extends Entity, Size, CanHaveGraphics {
  cornerRadius?:
    | NumberOrVariable
    | [NumberOrVariable, NumberOrVariable, NumberOrVariable, NumberOrVariable];
}

/** A rectangle is defined by its position and size. The position corresponds to the top-left corner. */
export interface Rectangle extends Rectangleish {
  type: "rectangle";
}

/** An ellipse is defined by its bounding rectangle's position and size. */
export interface Ellipse extends Entity, Size, CanHaveGraphics {
  type: "ellipse";
  /** Inner-to-outer radius ratio for ring shapes. 0 = solid, 1 = fully hollow. Default: 0. */
  innerRadius?: NumberOrVariable;
  /** Arc start angle in degrees, counter-clockwise from the right. Default: 0. */
  startAngle?: NumberOrVariable;
  /** Arc length in degrees from startAngle. Positive = counter-clockwise, negative = clockwise. Range: -360 to 360. Default: 360 (full ellipse). */
  sweepAngle?: NumberOrVariable;
}

/** A line is defined by its bounding rectangle's position and size. */
export interface Line extends Entity, Size, CanHaveGraphics {
  type: "line";
}

/** A regular polygon is defined by its bounding rectangle's position and size. */
export interface Polygon extends Entity, Size, CanHaveGraphics {
  type: "polygon";
  polygonCount?: NumberOrVariable;
  cornerRadius?: NumberOrVariable;
}

export interface Path extends Entity, Size, CanHaveGraphics {
  /** fillRule is used to determine which parts of the path are considered inside the shape to be filled. Default is 'nonzero'. */
  fillRule?: "nonzero" | "evenodd";
  /** SVG Path */
  geometry?: string;
  type: "path";
}

export interface TextStyle {
  fontFamily?: StringOrVariable;
  fontSize?: NumberOrVariable;
  fontWeight?: StringOrVariable;
  letterSpacing?: NumberOrVariable;
  fontStyle?: StringOrVariable;
  underline?: BooleanOrVariable;
  /** A multiplier that gets applied to the font size to determine spacing between lines. If not specified, uses the font's built-in line height. */
  lineHeight?: NumberOrVariable;
  textAlign?: "left" | "center" | "right" | "justify";
  textAlignVertical?: "top" | "middle" | "bottom";
  strikethrough?: BooleanOrVariable;
  href?: string;
}

export type TextContent = StringOrVariable | TextStyle[];

export interface Text extends Entity, Size, CanHaveGraphics, TextStyle {
  type: "text";
  content?: TextContent;
  /** textGrowth controls how the text box dimensions behave. It must be set before width or height can be used — without textGrowth, the width and height properties are ignored.
'auto': The text box automatically grows to fit the text content. Text does not wrap. Width and height adjust dynamically.
'fixed-width': The width is fixed and text wraps within it. The height grows automatically to fit the wrapped content.
'fixed-width-height': Both width and height are fixed. Text wraps and may be overflow if it exceeds the bounds.
IMPORTANT: Never set width or height without also setting textGrowth. If you want to control the size of a text box, you must set textGrowth first. */
  textGrowth?: "auto" | "fixed-width" | "fixed-width-height";
}

export interface CanHaveChildren {
  children?: Child[];
}

/** A frame is a rectangle that can have children. */
export interface Frame extends Rectangleish, CanHaveChildren, Layout {
  type: "frame";
  /** Visually clip content that overflows the frame bounds. Default is false. */
  clip?: BooleanOrVariable;
  placeholder?: boolean;
  /** If this property is set to an array, it indicates that this frame is a "slot" - which means that it is intended be customized with children in instances of the parent component. Each element of the array is an ID of a "recommended" reusable component, one which fits semantically as a child here (e.g. inside a menu bar, the content slot would recommend IDs of various menu item components). */
  slot?: false | string[];
}

export interface Group extends Entity, CanHaveChildren, CanHaveEffects, Layout {
  type: "group";
  width?: SizingBehavior;
  height?: SizingBehavior;
}

export interface Note extends Entity, Size, TextStyle {
  type: "note";
  content?: TextContent;
}

export interface Prompt extends Entity, Size, TextStyle {
  type: "prompt";
  content?: TextContent;
  model?: StringOrVariable;
}

export interface Context extends Entity, Size, TextStyle {
  type: "context";
  content?: TextContent;
}

/** Icon from a font */
export interface IconFont extends Entity, Size, CanHaveEffects {
  type: "icon_font";
  /** Name of the icon in the icon font */
  iconFontName?: StringOrVariable;
  /** Icon font to use. Valid fonts are 'lucide', 'feather', 'Material Symbols Outlined', 'Material Symbols Rounded', 'Material Symbols Sharp', 'phosphor' */
  iconFontFamily?: StringOrVariable;
  /** Variable font weight, only valid for icon fonts with variable weight. Values from 100 to 700. */
  weight?: NumberOrVariable;
  fill?: Fills;
}

/** References allow reusing other objects in different places. */
export interface Ref extends Entity {
  type: "ref";
  /** The `ref` property must be another object's ID. */
  ref: string;
  /** This can be used to customize the properties of descendant objects except the `children` property. */
  descendants?: {
    [key: string]: {};
  };
  [key: string]: any;
}

export type Child =
  | Frame
  | Group
  | Rectangle
  | Ellipse
  | Line
  | Path
  | Polygon
  | Text
  | Note
  | Prompt
  | Context
  | IconFont
  | Ref;

export type IdPath = string;

export interface Document {
  version: "2.10";
  themes?: { [key: string]: string[] };
  imports?: {
    [key: string]: string;
  };
  variables?: {
    [key: string]:
      | {
          type: "boolean";
          value:
            | BooleanOrVariable
            | { value: BooleanOrVariable; theme?: Theme }[];
        }
      | {
          type: "color";
          value: ColorOrVariable | { value: ColorOrVariable; theme?: Theme }[];
        }
      | {
          type: "number";
          value:
            | NumberOrVariable
            | { value: NumberOrVariable; theme?: Theme }[];
        }
      | {
          type: "string";
          value:
            | StringOrVariable
            | { value: StringOrVariable; theme?: Theme }[];
        };
  };
  children: (
    | Frame
    | Group
    | Rectangle
    | Ellipse
    | Line
    | Polygon
    | Path
    | Text
    | Note
    | Context
    | Prompt
    | IconFont
    | Ref
  )[];
}
```

## 高频校验清单

- [ ] `id` 文档内唯一且不含 `/`
- [ ] `type` 是 schema 支持的对象类型
- [ ] `ref.ref` 指向存在的可复用对象
- [ ] `descendants` 路径可解析
- [ ] `Text` 若设置 `width/height`，已先设 `textGrowth`
- [ ] 变量引用均为 `$name` 且存在定义
- [ ] 主题轴与主题值均已在 `themes` 声明
- [ ] `imports` 与 `image.url` 使用相对路径
