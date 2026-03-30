import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, hasToken, UserAPI } from '../api';
import { themeStorage, applyTheme } from '../utils/theme';
import { applyCustomStyle } from '../utils/style-apply';
import type { AppShellOutletContext } from './shell-context';
import './AppShell.css';

const navItems = [
  { to: '/console', label: '控制台', icon: '▦' },
  { to: '/templates', label: '积分模版', icon: '⎇' },
  { to: '/shop', label: '商店', icon: '🛒' },
  { to: '/points', label: '积分', icon: '🏅' },
  { to: '/inventory', label: '背包', icon: '🎒' },
  { to: '/settings', label: '设置', icon: '⚙' },
];

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(0);
  const [sidebarUser, setSidebarUser] = useState<{ nickname?: string; username: string } | null>(null);

  const loadPoints = async () => {
    const res = await UserAPI.getPoints();
    if (res.success && res.data) {
      const d = res.data as { points?: number; data?: { points?: number } };
      const points = d.points ?? d.data?.points;
      if (typeof points === 'number') setUserPoints(points);
    }
  };

  useEffect(() => {
    if (!hasToken()) return;
    loadPoints();
    getCurrentUser().then((res) => {
      if (res.success && res.data) {
        setSidebarUser({
          username: res.data.username,
          nickname: res.data.nickname,
        });
      }
    });
  }, []);

  useEffect(() => {
    applyTheme(themeStorage.get());
    try {
      const stored = localStorage.getItem('study_reward_custom_style');
      if (stored) applyCustomStyle(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onInv = () => loadPoints();
    window.addEventListener('app:points-refresh', onInv);
    return () => window.removeEventListener('app:points-refresh', onInv);
  }, []);

  const displayName = sidebarUser?.nickname || sidebarUser?.username || '用户';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="app-shell-sidebar" aria-label="主导航">
        <button type="button" className="app-shell-brand" onClick={() => navigate('/console')}>
          <span className="app-shell-brand-icon" aria-hidden>
            🚀
          </span>
          <span className="app-shell-brand-text">积分大师</span>
        </button>
        <nav className="app-shell-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-shell-nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="app-shell-nav-icon" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-shell-sidebar-footer">
          <NavLink to="/settings" className="app-shell-user-card">
            <span className="app-shell-user-avatar">{initial}</span>
            <div className="app-shell-user-meta">
              <span className="app-shell-user-name">{displayName}</span>
            </div>
          </NavLink>
        </div>
      </aside>
      <div className="app-shell-main">
        <header className="app-shell-topbar">
          <div className="app-shell-topbar-points">
            💰 <strong>{userPoints.toFixed(2)}</strong> 积分
            <button type="button" className="app-shell-refresh" onClick={loadPoints} title="刷新积分">
              ↻
            </button>
          </div>
        </header>
        <main className="app-shell-outlet">
          <Outlet context={{ userPoints, loadPoints } satisfies AppShellOutletContext} />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
