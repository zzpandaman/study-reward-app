/**
 * 样式预设定义
 * 包含边框、背景、鼠标图标的预设样式
 */

// 边框样式预设
export interface BorderStylePreset {
  id: string;
  name: string;
  description: string;
  cssClass: string;
  cssValue?: string; // CSS样式值（如border-radius、clip-path等）
}

export const BORDER_STYLE_PRESETS: BorderStylePreset[] = [
  {
    id: 'rectangle',
    name: '矩形',
    description: '经典矩形边框',
    cssClass: 'border-rectangle',
    cssValue: 'border-radius: 8px;',
  },
  {
    id: 'rounded',
    name: '圆角',
    description: '柔和圆角边框',
    cssClass: 'border-rounded',
    cssValue: 'border-radius: 20px;',
  },
  {
    id: 'soft',
    name: '柔和',
    description: '柔和的圆角边框',
    cssClass: 'border-soft',
    cssValue: 'border-radius: 16px;',
  },
];

// 背景样式预设
export interface BackgroundStylePreset {
  id: string;
  name: string;
  description: string;
  type: 'gradient' | 'pattern' | 'image';
  cssValue: string; // CSS背景样式值
  preview?: string; // 预览图片URL（可选）
}

export const BACKGROUND_STYLE_PRESETS: BackgroundStylePreset[] = [
  {
    id: 'gradient-purple',
    name: '紫色渐变',
    description: '优雅的紫色渐变背景',
    type: 'gradient',
    cssValue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 'gradient-blue',
    name: '蓝色渐变',
    description: '清新的蓝色渐变背景',
    type: 'gradient',
    cssValue: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  },
];

// 鼠标图标预设（使用emoji作为预览，实际使用CSS cursor）
export interface CursorStylePreset {
  id: string;
  name: string;
  description: string;
  type: 'css' | 'image';
  cssValue?: string; // CSS cursor值
  imageUrl?: string; // 图标图片URL（base64或URL）
  preview: string; // 预览emoji
}

// 鼠标图标预设
export const CURSOR_STYLE_PRESETS: CursorStylePreset[] = [
  {
    id: 'default',
    name: '默认',
    description: '系统默认鼠标指针',
    type: 'css',
    cssValue: 'default',
    preview: '⬆️',
  },
  {
    id: 'pointer',
    name: '手型指针',
    description: '友好的手型指针',
    type: 'css',
    cssValue: 'pointer',
    preview: '👆',
  },
  {
    id: 'text',
    name: '文本选择',
    description: '文本选择光标',
    type: 'css',
    cssValue: 'text',
    preview: 'I',
  },
  {
    id: 'zootopia-pen',
    name: '解读笔',
    description: '疯狂动物城2解读笔风格',
    type: 'image',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIOeWr+eLguWKqOeJqeWfjjLop6Por7vnrJTpo47moLzlm77moIcgLSDljp/liJvorr7orqEgLS0+CiAgPCEtLSDok53oibLnp5HmioDmhJ/nmoTnrJTnirblm77moIcgLS0+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9InBlbkdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMzYjgyZjY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzFlNDBhZjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDwhLS0g56yU6Lqr5Li75L2TIC0tPgogIDxyZWN0IHg9IjEwIiB5PSI2IiB3aWR0aD0iMTIiIGhlaWdodD0iMjAiIHJ4PSI2IiBmaWxsPSJ1cmwoI3BlbkdyYWRpZW50KSIvPgogIDwhLS0g56yU5bCWIC0tPgogIDxwYXRoIGQ9Ik0xNiAyNiBMMTIgMzIgTDIwIDMyIFoiIGZpbGw9IiMxZTQwYWYiLz4KICA8IS0tIOeslOW4veijhemlsCAtLT4KICA8cmVjdCB4PSIxMiIgeT0iNCIgd2lkdGg9IjgiIGhlaWdodD0iMyIgcng9IjEuNSIgZmlsbD0iIzYwYTVmYSIvPgogIDwhLS0g5Lit5aSu57q/5p2h6KOF6aWwIC0tPgogIDxsaW5lIHgxPSIxNiIgeTE9IjgiIHgyPSIxNiIgeTI9IjI0IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC42Ii8+CiAgPCEtLSDlsI/lnIbngrnoo4XppbAgLS0+CiAgPGNpcmNsZSBjeD0iMTQiIGN5PSIxMiIgcj0iMS41IiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIwLjgiLz4KICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjE2IiByPSIxLjUiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOCIvPgo8L3N2Zz4K',
    preview: '🖊️',
  },
];

/**
 * 根据ID获取边框样式预设
 */
export function getBorderStylePreset(id: string): BorderStylePreset | undefined {
  return BORDER_STYLE_PRESETS.find((p) => p.id === id);
}

/**
 * 根据ID获取背景样式预设
 */
export function getBackgroundStylePreset(id: string): BackgroundStylePreset | undefined {
  return BACKGROUND_STYLE_PRESETS.find((p) => p.id === id);
}

/**
 * 根据ID获取鼠标样式预设
 */
export function getCursorStylePreset(id: string): CursorStylePreset | undefined {
  return CURSOR_STYLE_PRESETS.find((p) => p.id === id);
}
