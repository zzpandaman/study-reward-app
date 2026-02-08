import React, { useState, useEffect } from 'react';
import { CustomStyle } from '../types';
import {
  BORDER_STYLE_PRESETS,
  BACKGROUND_STYLE_PRESETS,
  CURSOR_STYLE_PRESETS,
} from '../utils/style-presets';
import { imageToBase64, applyCustomStyle } from '../utils/style-apply';
import './StyleCustomizer.css';

interface StyleCustomizerProps {
  onClose: () => void;
}

const StyleCustomizer: React.FC<StyleCustomizerProps> = ({ onClose }) => {
  const CUSTOM_STYLE_KEY = 'study_reward_custom_style';

  const [customStyle, setCustomStyle] = useState<CustomStyle>({});
  const [activeTab, setActiveTab] = useState<'border' | 'background' | 'cursor'>('border');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_STYLE_KEY);
      if (stored) {
        const style = JSON.parse(stored);
        setCustomStyle(style);
        applyCustomStyle(style);
      }
    } catch {
      // ignore
    }
  }, []);

  const updateCustomStyle = (updates: Partial<CustomStyle>) => {
    const newStyle = { ...customStyle, ...updates };
    setCustomStyle(newStyle);
    applyCustomStyle(newStyle);
    try {
      localStorage.setItem(CUSTOM_STYLE_KEY, JSON.stringify(newStyle));
    } catch {
      // ignore
    }
  };

  const handleBorderStyleChange = (styleId: string) => {
    updateCustomStyle({ borderStyle: styleId, borderImage: undefined });
  };

  const handleBackgroundStyleChange = (styleId: string) => {
    updateCustomStyle({ backgroundStyle: styleId, backgroundImage: undefined });
  };

  const handleCursorStyleChange = (styleId: string) => {
    updateCustomStyle({ cursorStyle: styleId, cursorImage: undefined });
  };

  const handleImageUpload = async (type: 'border' | 'background' | 'cursor', file: File): Promise<void> => {
    try {
      const base64 = await imageToBase64(file);
      if (type === 'border') {
        updateCustomStyle({ borderImage: base64, borderStyle: undefined });
      } else if (type === 'background') {
        updateCustomStyle({ backgroundImage: base64, backgroundStyle: undefined });
      } else if (type === 'cursor') {
        // 鼠标图标建议使用小尺寸图片（32x32或更小）
        if (file.size > 100 * 1024) {
          alert('鼠标图标文件过大，建议使用小于100KB的图片');
          return;
        }
        updateCustomStyle({ cursorImage: base64, cursorStyle: undefined });
      }
    } catch (error) {
      alert('图片上传失败：' + (error as Error).message);
    }
  };

  return (
    <div className="style-customizer-overlay" onClick={onClose}>
      <div className="style-customizer" onClick={(e) => e.stopPropagation()}>
        <div className="style-customizer-header">
          <h2>样式定制</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="style-customizer-tabs">
          <button
            className={activeTab === 'border' ? 'active' : ''}
            onClick={() => setActiveTab('border')}
          >
            边框样式
          </button>
          <button
            className={activeTab === 'background' ? 'active' : ''}
            onClick={() => setActiveTab('background')}
          >
            背景样式
          </button>
          <button
            className={activeTab === 'cursor' ? 'active' : ''}
            onClick={() => setActiveTab('cursor')}
          >
            鼠标图标
          </button>
        </div>

        <div className="style-customizer-content">
          {activeTab === 'border' && (
            <div className="style-section">
              <h3>预设边框样式</h3>
              <div className="style-grid">
                {BORDER_STYLE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className={`style-item ${customStyle.borderStyle === preset.id ? 'selected' : ''}`}
                    onClick={() => handleBorderStyleChange(preset.id)}
                  >
                    <div className={`style-preview border-preview border-${preset.id}`}></div>
                    <div className="style-info">
                      <div className="style-name">{preset.name}</div>
                      <div className="style-desc">{preset.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="upload-section">
                <h3>自定义边框图片</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload('border', file);
                    }
                  }}
                  className="file-input"
                />
              </div>
            </div>
          )}

          {activeTab === 'background' && (
            <div className="style-section">
              <h3>预设背景样式</h3>
              <div className="style-grid">
                {BACKGROUND_STYLE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className={`style-item ${customStyle.backgroundStyle === preset.id ? 'selected' : ''}`}
                    onClick={() => handleBackgroundStyleChange(preset.id)}
                  >
                    <div
                      className="style-preview background-preview"
                      style={{ background: preset.cssValue }}
                    ></div>
                    <div className="style-info">
                      <div className="style-name">{preset.name}</div>
                      <div className="style-desc">{preset.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="upload-section">
                <h3>自定义背景图片</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload('background', file);
                    }
                  }}
                  className="file-input"
                />
              </div>
            </div>
          )}

          {activeTab === 'cursor' && (
            <div className="style-section">
              <h3>预设鼠标图标</h3>
              <div className="style-grid">
                {CURSOR_STYLE_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className={`style-item ${customStyle.cursorStyle === preset.id ? 'selected' : ''}`}
                    onClick={() => handleCursorStyleChange(preset.id)}
                  >
                    <div className="style-preview cursor-preview">
                      <span className="cursor-emoji">{preset.preview}</span>
                    </div>
                    <div className="style-info">
                      <div className="style-name">{preset.name}</div>
                      <div className="style-desc">{preset.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="upload-section">
                <h3>自定义鼠标图标</h3>
                <p className="upload-hint">建议使用32x32像素的小图标（.png或.cur格式），文件大小小于100KB</p>
                <p className="upload-hint">提示：可以从网上下载疯狂动物城解读笔、酷洛米等图标文件上传使用</p>
                <input
                  type="file"
                  accept="image/png,image/cur,image/x-icon"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload('cursor', file);
                    }
                  }}
                  className="file-input"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StyleCustomizer;
