/**
 * 样式应用工具
 * 负责将自定义样式应用到DOM元素
 */
import { CustomStyle } from '../types';
import {
  BORDER_STYLE_PRESETS,
  BACKGROUND_STYLE_PRESETS,
  CURSOR_STYLE_PRESETS,
  getBorderStylePreset,
  getBackgroundStylePreset,
  getCursorStylePreset,
} from './style-presets';

/**
 * 应用自定义样式到全局
 */
export function applyCustomStyle(customStyle?: CustomStyle): void {
  if (!customStyle) {
    return;
  }

  const root = document.documentElement;
  
  // 应用边框样式
  applyBorderStyle(customStyle, root);
  
  // 应用背景样式
  applyBackgroundStyle(customStyle, root);
  
  // 应用鼠标样式
  applyCursorStyle(customStyle, root);
}

/**
 * 应用边框样式
 */
function applyBorderStyle(customStyle: CustomStyle, root: HTMLElement): void {
  // 移除之前的边框样式类
  BORDER_STYLE_PRESETS.forEach((preset) => {
    document.body.classList.remove(`border-style-${preset.id}`);
  });

  // 如果使用预设边框样式
  if (customStyle.borderStyle) {
    const preset = getBorderStylePreset(customStyle.borderStyle);
    if (preset) {
      // 将样式类应用到body，以便CSS规则生效
      document.body.classList.add(`border-style-${preset.id}`);
      if (preset.cssValue) {
        root.style.setProperty('--border-style', preset.cssValue);
      }
    }
  }

  // 如果使用自定义边框图片
  if (customStyle.borderImage) {
    root.style.setProperty('--border-image', `url(${customStyle.borderImage})`);
  }
}

/**
 * 应用背景样式
 */
function applyBackgroundStyle(customStyle: CustomStyle, root: HTMLElement): void {
  // 移除之前的背景样式类
  BACKGROUND_STYLE_PRESETS.forEach((preset) => {
    document.body.classList.remove(`background-style-${preset.id}`);
  });

  // 清除自定义背景图片样式
  document.body.style.removeProperty('--background-image');
  document.body.style.removeProperty('background-image');
  document.body.style.removeProperty('background-size');
  document.body.style.removeProperty('background-position');
  document.body.style.removeProperty('background-repeat');

  // 如果使用预设背景样式
  if (customStyle.backgroundStyle) {
    const preset = getBackgroundStylePreset(customStyle.backgroundStyle);
    if (preset) {
      document.body.classList.add(`background-style-${preset.id}`);
      if (preset.cssValue) {
        root.style.setProperty('--background-style', preset.cssValue);
      }
    }
  }

  // 如果使用自定义背景图片
  if (customStyle.backgroundImage) {
    document.body.style.setProperty('--background-image', `url(${customStyle.backgroundImage})`);
    document.body.style.backgroundImage = `url(${customStyle.backgroundImage})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
  }
}

/**
 * 应用鼠标样式
 */
function applyCursorStyle(customStyle: CustomStyle, _root: HTMLElement): void {
  // 移除之前的鼠标样式类
  CURSOR_STYLE_PRESETS.forEach((preset) => {
    document.body.classList.remove(`cursor-style-${preset.id}`);
  });

  // 如果使用预设鼠标样式
  if (customStyle.cursorStyle) {
    const preset = getCursorStylePreset(customStyle.cursorStyle);
    if (preset) {
      document.body.classList.add(`cursor-style-${preset.id}`);
      
      if (preset.type === 'css' && preset.cssValue) {
        document.body.style.cursor = preset.cssValue;
      } else if (preset.type === 'image' && preset.imageUrl) {
        // 使用自定义图片作为鼠标指针
        document.body.style.cursor = `url(${preset.imageUrl}), auto`;
      }
    }
  }

  // 如果使用自定义鼠标图片
  if (customStyle.cursorImage) {
    document.body.style.cursor = `url(${customStyle.cursorImage}), auto`;
  }
}

/**
 * 图片转换为base64
 */
export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
