import React, { useState, useEffect } from 'react';
import TaskManager from './components/TaskManager';
import Shop from './components/Shop';
import Inventory from './components/Inventory';
import PointRecords from './components/PointRecords';
import StyleCustomizer from './components/StyleCustomizer';
import ApiErrorToast from './components/ApiErrorToast';
import LoginPage from './components/LoginPage';
import UserMenu from './components/UserMenu';
import { hasToken, UserAPI } from './api';
import type { TaskExecution } from './types';
import { themeStorage, applyTheme, themes, Theme } from './utils/theme';
import { applyCustomStyle } from './utils/style-apply';
import './App.css';

const App: React.FC = () => {
  const [, setLoginVersion] = useState(0);
  const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'inventory' | 'records'>('tasks');
  const [userPoints, setUserPoints] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeStorage.get());
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showStyleCustomizer, setShowStyleCustomizer] = useState(false);
  const [runningTask, setRunningTask] = useState<TaskExecution | null>(null);

  const loadPoints = async () => {
    const res = await UserAPI.getPoints();
    if (res.success && res.data) {
      const d = res.data as { points?: number; data?: { points?: number } };
      const points = d.points ?? d.data?.points;
      if (typeof points === 'number') setUserPoints(points);
    }
  };

  useEffect(() => {
    if (hasToken()) loadPoints();
    applyTheme(currentTheme);
    loadCustomStyle();
  }, [currentTheme]);

  const loadCustomStyle = () => {
    try {
      const stored = localStorage.getItem('study_reward_custom_style');
      if (stored) {
        const style = JSON.parse(stored);
        applyCustomStyle(style);
      }
    } catch {
      // ignore
    }
  };


  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    themeStorage.save(theme);
    applyTheme(theme);
    setShowThemeMenu(false);
  };

  // 点击外部关闭主题菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.theme-selector')) {
        setShowThemeMenu(false);
      }
    };

    if (showThemeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showThemeMenu]);

  if (!hasToken()) {
    return <LoginPage onSuccess={() => setLoginVersion((v) => v + 1)} />;
  }

  return (
    <div className="app">
              <header className="app-header">
                <h1>
                  <span className="header-icon">📚</span>
                  <span className="header-label">学习奖励</span>
                </h1>
                <div className="header-info">
                  {runningTask && (
                    <button
                      type="button"
                      className="running-task-entry"
                      onClick={() => setActiveTab('tasks')}
                      title="查看进行中任务"
                    >
                      进行中: {runningTask.taskName}
                    </button>
                  )}
                  <div className="points-badge">
                    💰 {userPoints.toFixed(2)} 积分
                    <button
                      type="button"
                      className="points-refresh-btn"
                      onClick={loadPoints}
                      title="刷新积分"
                      aria-label="刷新积分"
                    >
                      ↻
                    </button>
                  </div>
                  <UserMenu onLogout={() => setLoginVersion((v) => v + 1)} />
                  <div className="header-actions">
            <div className="theme-selector">
              <button
                className="theme-btn"
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                title="切换主题"
              >
                🎨
              </button>
              {showThemeMenu && (
                <div className="theme-menu">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      className={`theme-option ${currentTheme === key ? 'active' : ''}`}
                      onClick={() => handleThemeChange(key as Theme)}
                      style={{
                        background: theme.gradient,
                      }}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="style-customizer-btn">
              <button
                className="style-btn"
                onClick={() => setShowStyleCustomizer(true)}
                title="样式定制"
              >
                🎭
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          <span className="tab-icon">📝</span>
          <span className="tab-label">学习任务</span>
        </button>
        <button
          className={activeTab === 'shop' ? 'active' : ''}
          onClick={() => setActiveTab('shop')}
        >
          <span className="tab-icon">🛒</span>
          <span className="tab-label">积分商城</span>
        </button>
        <button
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          <span className="tab-icon">🎒</span>
          <span className="tab-label">我的背包</span>
        </button>
        <button
          className={activeTab === 'records' ? 'active' : ''}
          onClick={() => setActiveTab('records')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">积分记录</span>
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'tasks' && (
            <TaskManager
              onPointsChange={loadPoints}
              onRunningTaskChange={setRunningTask}
            />
          )}
        {activeTab === 'shop' && <Shop onPointsChange={loadPoints} />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'records' && <PointRecords />}
      </main>

      {showStyleCustomizer && (
        <StyleCustomizer onClose={() => setShowStyleCustomizer(false)} />
      )}

      <ApiErrorToast />
    </div>
  );
};

export default App;
