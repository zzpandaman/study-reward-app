import React, { useState, useEffect, useCallback } from 'react';
import TaskManager from './components/TaskManager';
import Shop from './components/Shop';
import Inventory from './components/Inventory';
import PointRecords from './components/PointRecords';
import StyleCustomizer from './components/StyleCustomizer';
import { userDataStorage, exportData, importData } from './utils/storage';
import { themeStorage, applyTheme, themes, Theme } from './utils/theme';
import { applyCustomStyle } from './utils/style-apply';
import {
  UserAPI,
  checkMigrationNeeded,
  getLocalDataToMigrate,
  migrateLocalDataToServer,
  MigrationProgress,
} from './api';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'shop' | 'inventory' | 'records'>('tasks');
  const [userPoints, setUserPoints] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeStorage.get());
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [showStyleCustomizer, setShowStyleCustomizer] = useState(false);
  
  // 数据迁移相关状态
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; message: string } | null>(null);

  // 检查数据迁移
  const checkAndShowMigration = useCallback(() => {
    if (checkMigrationNeeded()) {
      const localData = getLocalDataToMigrate();
      const total = localData.templates.length + localData.products.length;
      if (total > 0) {
        setShowMigrationDialog(true);
      }
    }
  }, []);

  useEffect(() => {
    updatePoints();
    applyTheme(currentTheme);
    // 加载并应用自定义样式
    loadCustomStyle();
    // 检查数据迁移
    checkAndShowMigration();
    // 定期更新积分显示
    const interval = setInterval(updatePoints, 1000);
    return () => clearInterval(interval);
  }, [currentTheme, checkAndShowMigration]);

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

  // 执行数据迁移
  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    
    try {
      const result = await migrateLocalDataToServer((progress) => {
        setMigrationProgress(progress);
      });
      
      setMigrationResult({
        success: result.success,
        message: result.message,
      });
      
      if (result.success) {
        // 迁移成功后刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        message: '迁移失败：' + (error as Error).message,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // 关闭迁移对话框
  const closeMigrationDialog = () => {
    if (!isMigrating) {
      setShowMigrationDialog(false);
      setMigrationProgress(null);
      setMigrationResult(null);
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

  const handleExportData = async () => {
    try {
      const data = exportData();
      
      // 生成带日期时间的文件名：学习奖励数据备份_2024-01-17_14-30-25.srdata
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss
      const fileName = `学习奖励数据备份_${dateStr}_${timeStr}.srdata`;
      
      // 检测 Electron 环境
      const electronAPI = window.electronAPI;
      const isElectron = electronAPI && typeof electronAPI.saveFile === 'function';
      
      if (isElectron) {
        try {
          const result = await electronAPI.saveFile(data, fileName);
          
          if (result && result.success) {
            alert('数据导出成功！');
            setShowDataMenu(false);
            return;
          } else {
            // 继续执行下面的 Blob 下载作为备选
          }
        } catch (electronError) {
          // 继续执行下面的 Blob 下载作为备选
        }
      }
      
      // 最后的备选方案：使用 Blob 下载（在浏览器中）
      const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      // 延迟删除，确保下载开始
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      }, 200);
      
      alert('数据导出成功！');
      setShowDataMenu(false);
    } catch (error) {
      alert('数据导出失败：' + (error as Error).message);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    // 只支持 .srdata 格式
    input.accept = '.srdata';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // 验证文件扩展名
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.srdata')) {
        alert('文件格式错误：请选择 .srdata 格式的数据备份文件。');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as string;
          
          // 验证是否为有效的JSON格式
          try {
            JSON.parse(data);
          } catch (jsonError) {
            alert('文件格式错误：不是有效的数据格式。\n\n请确保选择的是学习奖励数据备份文件（.srdata）。');
            return;
          }
          
          const result = importData(data);
          if (result.success) {
            let message = result.message;
            if (result.stats) {
              message += `\n\n详细统计：\n新增 ${result.stats.added} 项\n更新 ${result.stats.updated} 项\n合并 ${result.stats.merged} 项`;
            }
            alert(message);
            updatePoints();
            // 刷新页面以更新所有组件
            window.location.reload();
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

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.data-menu')) {
        setShowDataMenu(false);
      }
      if (!target.closest('.theme-selector')) {
        setShowThemeMenu(false);
      }
    };

    if (showDataMenu || showThemeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showDataMenu, showThemeMenu]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="header-icon">📚</span>
          <span className="header-label">学习奖励</span>
        </h1>
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
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDataMenu(!showDataMenu);
                }}
                title="数据管理"
              >
                ⚙️
              </button>
              {showDataMenu && (
                <div 
                  className="data-menu-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={(e) => {
                    e.stopPropagation();
                    handleExportData();
                  }}>导出数据</button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    handleImportData();
                  }}>导入数据</button>
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
        {activeTab === 'tasks' && <TaskManager />}
        {activeTab === 'shop' && <Shop />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'records' && <PointRecords />}
      </main>

      {showStyleCustomizer && (
        <StyleCustomizer onClose={() => setShowStyleCustomizer(false)} />
      )}

      {/* 数据迁移对话框 */}
      {showMigrationDialog && (
        <div className="migration-overlay">
          <div className="migration-dialog">
            <h3>📦 数据迁移</h3>
            
            {!migrationResult && !isMigrating && (
              <>
                <p>检测到本地有未同步的数据，是否迁移到服务器？</p>
                <p className="migration-info">
                  {(() => {
                    const data = getLocalDataToMigrate();
                    return `待迁移：${data.templates.length} 个任务模板，${data.products.length} 个商品`;
                  })()}
                </p>
                <div className="migration-actions">
                  <button className="btn-primary" onClick={handleMigration}>
                    立即迁移
                  </button>
                  <button className="btn-secondary" onClick={closeMigrationDialog}>
                    稍后再说
                  </button>
                </div>
              </>
            )}

            {isMigrating && migrationProgress && (
              <div className="migration-progress">
                <p>正在迁移数据...</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${((migrationProgress.completed + migrationProgress.skipped) / migrationProgress.total) * 100}%` 
                    }}
                  />
                </div>
                <p className="progress-text">
                  {migrationProgress.completed + migrationProgress.skipped} / {migrationProgress.total}
                  {migrationProgress.skipped > 0 && ` (跳过 ${migrationProgress.skipped})`}
                </p>
              </div>
            )}

            {migrationResult && (
              <div className={`migration-result ${migrationResult.success ? 'success' : 'error'}`}>
                <p>{migrationResult.message}</p>
                {migrationResult.success && <p className="reload-hint">页面即将刷新...</p>}
                {!migrationResult.success && (
                  <div className="migration-actions">
                    <button className="btn-primary" onClick={handleMigration}>
                      重试
                    </button>
                    <button className="btn-secondary" onClick={closeMigrationDialog}>
                      关闭
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
