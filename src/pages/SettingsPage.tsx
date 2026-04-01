import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../api';
import StyleCustomizer from '../components/StyleCustomizer';
import { themeStorage, applyTheme, themes, Theme } from '../utils/theme';
import {
  readBackgroundTimerCheckEnabled,
  writeBackgroundTimerCheckEnabled,
  BACKGROUND_TIMER_PREF_EVENT,
} from '../utils/background-timer-pref';
import './PageChrome.css';
import './SettingsPage.css';

const PREFS_KEYS = {
  sound: 'study_reward_pref_sound',
  notify: 'study_reward_pref_notify',
} as const;

type SettingsTab = 'theme' | 'account' | 'timer' | 'pref';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ username: string; nickname?: string } | null>(null);
  const [theme, setTheme] = useState<Theme>(themeStorage.get());
  const [sound, setSound] = useState(true);
  const [notify, setNotify] = useState(true);
  const [showStyleCustomizer, setShowStyleCustomizer] = useState(false);
  const [backgroundTimerCheck, setBackgroundTimerCheck] = useState(readBackgroundTimerCheckEnabled);
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');

  useEffect(() => {
    getCurrentUser().then((res) => {
      if (res.success && res.data) {
        setUser({ username: res.data.username, nickname: res.data.nickname });
      }
    });
    setSound(localStorage.getItem(PREFS_KEYS.sound) !== 'false');
    setNotify(localStorage.getItem(PREFS_KEYS.notify) !== 'false');
  }, []);

  useEffect(() => {
    const sync = () => setBackgroundTimerCheck(readBackgroundTimerCheckEnabled());
    window.addEventListener(BACKGROUND_TIMER_PREF_EVENT, sync);
    return () => window.removeEventListener(BACKGROUND_TIMER_PREF_EVENT, sync);
  }, []);

  const pickTheme = (t: Theme) => {
    setTheme(t);
    themeStorage.save(t);
    applyTheme(t);
  };

  const toggleSound = (v: boolean) => {
    setSound(v);
    localStorage.setItem(PREFS_KEYS.sound, String(v));
  };

  const toggleNotify = (v: boolean) => {
    setNotify(v);
    localStorage.setItem(PREFS_KEYS.notify, String(v));
  };

  const displayName = user?.nickname || user?.username || '—';

  return (
    <div className="page-with-chrome settings-page">
      <div className="settings-toolbar">
        <div className="settings-tabs" role="tablist" aria-label="设置分类">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'theme'}
            className={`settings-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            主题设置
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'account'}
            className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            账户设置
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timer'}
            className={`settings-tab-btn ${activeTab === 'timer' ? 'active' : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            计时设置
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'pref'}
            className={`settings-tab-btn ${activeTab === 'pref' ? 'active' : ''}`}
            onClick={() => setActiveTab('pref')}
          >
            偏好
          </button>
        </div>
        <button
          type="button"
          className="settings-logout-btn settings-logout-btn--top"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          退出登录
        </button>
      </div>

      {activeTab === 'theme' && (
        <section className="settings-card">
          <h2>主题设置</h2>
          <p className="settings-inline-actions">
            <button type="button" className="settings-link-btn" onClick={() => setShowStyleCustomizer(true)}>
              样式定制…
            </button>
          </p>
          <div className="settings-theme-grid">
            {(Object.keys(themes) as Theme[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`settings-theme-option ${theme === key ? 'active' : ''}`}
                style={{ background: themes[key].gradient }}
                onClick={() => pickTheme(key)}
              >
                {themes[key].name}
              </button>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'account' && (
        <section className="settings-card">
          <h2>账户设置</h2>
          <p className="settings-readonly">
            <span className="label">昵称 / 用户名</span>
            {displayName}
          </p>
          <p className="settings-hint">资料修改以 SSO 能力为准；当前仅展示。</p>
        </section>
      )}

      {activeTab === 'timer' && (
        <section className="settings-card settings-timer-card">
          <h2 className="settings-timer-title">计时设置</h2>
          <label className="settings-timer-row">
            <input
              type="checkbox"
              checked={backgroundTimerCheck}
              onChange={(e) => {
                const v = e.target.checked;
                setBackgroundTimerCheck(v);
                writeBackgroundTimerCheckEnabled(v);
              }}
            />
            <span className="settings-timer-label">启用后台检测（切换应用或黑屏时自动暂停）</span>
          </label>
          <p className="settings-timer-hint">
            {backgroundTimerCheck
              ? '已启用：切换到后台会自动暂停计时，并尽量使用 Wake Lock 防止锁屏'
              : '未启用：不手动暂停时，后台/锁屏也会继续计时'}
          </p>
        </section>
      )}

      {activeTab === 'pref' && (
        <section className="settings-card">
          <h2>偏好</h2>
          <label className="settings-toggle-row">
            <span>完成任务时音效（前端占位，实际播放需后续接入）</span>
            <input type="checkbox" checked={sound} onChange={(e) => toggleSound(e.target.checked)} />
          </label>
          <label className="settings-toggle-row">
            <span>系统通知提醒（前端占位）</span>
            <input type="checkbox" checked={notify} onChange={(e) => toggleNotify(e.target.checked)} />
          </label>
        </section>
      )}

      {showStyleCustomizer && <StyleCustomizer onClose={() => setShowStyleCustomizer(false)} />}
    </div>
  );
};

export default SettingsPage;
