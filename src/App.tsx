import React, { useState, useEffect } from 'react';
import TaskManager from './components/TaskManager';
import Shop from './components/Shop';
import Inventory from './components/Inventory';
import PointRecords from './components/PointRecords';
import StyleCustomizer from './components/StyleCustomizer';
import { userDataStorage, exportData, importData } from './utils/storage';
import { themeStorage, applyTheme, themes, Theme } from './utils/theme';
import { applyCustomStyle } from './utils/style-apply';
import { UserAPI } from './api';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'inventory' | 'records'>('tasks');
  const [userPoints, setUserPoints] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeStorage.get());
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showStyleCustomizer, setShowStyleCustomizer] = useState(false);

  useEffect(() => {
    updatePoints();
    applyTheme(currentTheme);
    // 加载并应用自定义样式
    loadCustomStyle();
    // 定期更新积分显示
    const interval = setInterval(updatePoints, 1000);
    return () => clearInterval(interval);
  }, [currentTheme]);

  const loadCustomStyle = async () => {
    try {
      const response = await UserAPI.getCustomStyle();
      if (response.success && response.data?.data) {
        applyCustomStyle(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load custom style:', error);
    }
  };

  const updatePoints = () => {
    const userData = userDataStorage.get();
    setUserPoints(userData.points);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    themeStorage.save(theme);
    applyTheme(theme);
    setShowThemeMenu(false);
  };

  const handleExportData = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `学习奖励数据_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('数据导出成功！');
      setShowDataMenu(false);
    } catch (error) {
      alert('数据导出失败：' + (error as Error).message);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as string;
          const result = importData(data);
          if (result.success) {
            alert(result.message);
            updatePoints();
          } else {
            alert(result.message);
          }
          setShowDataMenu(false);
        } catch (error) {
          alert('数据导入失败：' + (error as Error).message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📚 学习奖励小程序</h1>
        <div className="header-info">
          <div className="points-badge">
            💰 {userPoints.toFixed(2)} 积分
          </div>
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
            <div className="data-menu">
              <button
                className="data-btn"
                onClick={() => setShowDataMenu(!showDataMenu)}
                title="数据管理"
              >
                ⚙️
              </button>
              {showDataMenu && (
                <div className="data-menu-dropdown">
                  <button onClick={handleExportData}>导出数据</button>
                  <button onClick={handleImportData}>导入数据</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'tasks' ? 'active' : ''}
          onClick={() => setActiveTab('tasks')}
        >
          📝 学习任务
        </button>
        <button
          className={activeTab === 'shop' ? 'active' : ''}
          onClick={() => setActiveTab('shop')}
        >
          🛒 积分商城
        </button>
        <button
          className={activeTab === 'inventory' ? 'active' : ''}
          onClick={() => setActiveTab('inventory')}
        >
          🎒 背包
        </button>
        <button
          className={activeTab === 'records' ? 'active' : ''}
          onClick={() => setActiveTab('records')}
        >
          📊 积分记录
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'tasks' && <TaskManager />}
        {activeTab === 'shop' && <Shop />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'records' && <PointRecords />}
      </main>

      {showStyleCustomizer && (
        <StyleCustomizer onClose={() => setShowStyleCustomizer(false)} />
      )}
    </div>
  );
};

export default App;
