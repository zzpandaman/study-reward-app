export type Theme = 'purple' | 'cyan' | 'blue' | 'green' | 'orange';

export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  gradient: string;
}

export const themes: Record<Theme, ThemeConfig> = {
  purple: {
    name: '紫色',
    primary: '#667eea',
    secondary: '#764ba2',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  cyan: {
    name: '青色',
    primary: '#06b6d4',
    secondary: '#0891b2',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  },
  blue: {
    name: '蓝色',
    primary: '#3b82f6',
    secondary: '#2563eb',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  },
  green: {
    name: '绿色',
    primary: '#10b981',
    secondary: '#059669',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  orange: {
    name: '橙色',
    primary: '#f97316',
    secondary: '#ea580c',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  },
};

const THEME_STORAGE_KEY = 'study_reward_theme';

export const themeStorage = {
  get(): Theme {
    const data = localStorage.getItem(THEME_STORAGE_KEY);
    return (data as Theme) || 'purple';
  },
  save(theme: Theme): void {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  },
};

export const applyTheme = (theme: Theme): void => {
  const themeConfig = themes[theme];
  const root = document.documentElement;
  root.style.setProperty('--primary-color', themeConfig.primary);
  root.style.setProperty('--secondary-color', themeConfig.secondary);
  root.style.setProperty('--gradient', themeConfig.gradient);
  
  // 背景统一由 applyBackgroundStyle 处理
  // 如果没有自定义背景，CSS 中的 var(--gradient) 会自动生效
};
