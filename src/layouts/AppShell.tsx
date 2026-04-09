import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, hasToken, UserAPI } from '../api';
import { themeStorage, applyTheme } from '../utils/theme';
import { applyCustomStyle } from '../utils/style-apply';
import type { PointWalletRow } from '../api/types';
import type { AppShellOutletContext } from './shell-context';
import './AppShell.css';

const navItems = [
  { to: '/console', label: '控制台', shortLabel: '控制台', icon: '▦' },
  { to: '/templates', label: '积分模版', shortLabel: '模版', icon: '⎇' },
  { to: '/shop', label: '积分商店', shortLabel: '商店', icon: '🛒' },
  { to: '/points', label: '积分记录', shortLabel: '记录', icon: '🏅' },
  { to: '/inventory', label: '我的背包', shortLabel: '背包', icon: '🎒' },
  { to: '/settings', label: '个人设置', shortLabel: '设置', icon: '⚙' },
] as const;

const publisherIcons = ['🐼', '🦊', '🐯', '🦁', '🐨', '🐵', '🐶', '🐱'] as const;

function resolvePublisherIcon(publishById?: number, fallbackKey?: string): string {
  if (typeof publishById === 'number' && Number.isFinite(publishById)) {
    return publisherIcons[Math.abs(publishById) % publisherIcons.length];
  }
  if (fallbackKey) {
    let hash = 0;
    for (let i = 0; i < fallbackKey.length; i += 1) hash += fallbackKey.charCodeAt(i);
    return publisherIcons[hash % publisherIcons.length];
  }
  return '🐼';
}

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const [userPoints, setUserPoints] = useState(0);
  const [sidebarUser, setSidebarUser] = useState<{ nickname?: string; username: string } | null>(null);
  const [pointWallets, setPointWallets] = useState<PointWalletRow[]>([]);
  const [activeWallet, setActiveWallet] = useState<PointWalletRow | null>(null);
  const [pointsMenuOpen, setPointsMenuOpen] = useState(false);
  const pointsMenuRef = useRef<HTMLDivElement | null>(null);

  const loadPoints = async () => {
    const walletsRes = await UserAPI.getPointWallets();
    const wallets = walletsRes.success && walletsRes.data ? walletsRes.data : [];
    if (wallets.length > 0) {
      setPointWallets(wallets);
      setActiveWallet((prev) => {
        const current = prev
          ? wallets.find((w) => w.publishById === prev.publishById) ?? wallets[0]
          : wallets[0];
        setUserPoints(current.points);
        return current;
      });
      return;
    }
    const res = await UserAPI.getPoints();
    if (res.success && res.data) {
      const d = res.data as { points?: number; data?: { points?: number } };
      const points = d.points ?? d.data?.points;
      if (typeof points === 'number') setUserPoints(points);
    }
  };

  const handlePointsAreaClick = async () => {
    await loadPoints();
    setPointsMenuOpen((v) => !v);
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

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!pointsMenuRef.current) return;
      if (!pointsMenuRef.current.contains(e.target as Node)) {
        setPointsMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const displayName = sidebarUser?.nickname || sidebarUser?.username || '用户';
  const initial = displayName.charAt(0).toUpperCase();
  const formatPublisherName = (publishBy?: string) => publishBy || '发布方';
  const topPublisherIcon = resolvePublisherIcon(activeWallet?.publishById, activeWallet?.publishBy);
  const topPublisherTitle = activeWallet?.publishBy
    ? `发布方：${formatPublisherName(activeWallet.publishBy)}`
    : '点击刷新并查看各发布方积分';

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
          <button type="button" className="app-shell-topbar-brand" onClick={() => navigate('/console')}>
            <span className="app-shell-topbar-brand-icon" aria-hidden>
              🚀
            </span>
            <span className="app-shell-topbar-brand-text">积分大师</span>
          </button>
          <div className="app-shell-points-dropdown" ref={pointsMenuRef}>
            <button
              type="button"
              className="app-shell-topbar-points"
              onClick={() => void handlePointsAreaClick()}
              title={topPublisherTitle}
            >
              <span className="app-shell-publisher-icon" aria-hidden>
                {topPublisherIcon}
              </span>
              <strong>{userPoints.toFixed(2)}</strong> ▾
            </button>
            {pointsMenuOpen && pointWallets.length > 0 && (
              <div className="app-shell-points-menu" role="menu" aria-label="发布方积分钱包列表">
                {pointWallets.map((wallet) => (
                  <button
                    key={wallet.publishById}
                    type="button"
                    role="menuitem"
                    className={`app-shell-points-menu-item ${
                      activeWallet?.publishById === wallet.publishById ? 'active' : ''
                    }`}
                    onClick={() => {
                      setActiveWallet(wallet);
                      setUserPoints(wallet.points);
                      setPointsMenuOpen(false);
                    }}
                    title={`发布方：${formatPublisherName(wallet.publishBy)}`}
                  >
                    <span className="app-shell-points-menu-left">
                      <span className="app-shell-publisher-icon" aria-hidden>
                        {resolvePublisherIcon(wallet.publishById, wallet.publishBy)}
                      </span>
                      <span>{formatPublisherName(wallet.publishBy)}</span>
                    </span>
                    <strong>{wallet.points.toFixed(2)}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>
        <main className="app-shell-outlet">
          <Outlet context={{ userPoints, loadPoints } satisfies AppShellOutletContext} />
        </main>
        <nav className="app-shell-tabbar" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `app-shell-tab-link ${isActive ? 'active' : ''}`}
            >
              <span className="app-shell-tab-icon" aria-hidden>
                {item.icon}
              </span>
              <span className="app-shell-tab-label">{item.shortLabel}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AppShell;
