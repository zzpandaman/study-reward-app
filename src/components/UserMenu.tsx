import React, { useState, useEffect } from 'react';
import { getCurrentUser, hasToken, logout } from '../api';
import './UserMenu.css';

interface UserInfo {
  username: string;
  nickname?: string;
}

interface UserMenuProps {
  onLogout?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasToken()) {
      setLoading(true);
      getCurrentUser().then((res) => {
        if (res.success && res.data) {
          setUser({ username: res.data.username, nickname: res.data.nickname });
        }
        setLoading(false);
      });
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    setOpen(false);
    onLogout?.();
  };

  const displayName = user?.nickname || user?.username || '用户';
  const avatarText = (user?.nickname || user?.username || '?').charAt(0).toUpperCase();

  return (
    <div className="user-menu">
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen(!open)}
        title={displayName}
      >
        {loading ? (
          <span className="user-menu-avatar-placeholder">...</span>
        ) : (
          <span className="user-menu-avatar">{avatarText}</span>
        )}
      </button>
      {open && (
        <>
          <div className="user-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="user-menu-dropdown">
            <div className="user-menu-header">
              <span className="user-menu-avatar user-menu-avatar-sm">{avatarText}</span>
              <span className="user-menu-display-name">{displayName}</span>
            </div>
            <div className="user-menu-divider" />
            <button type="button" className="user-menu-item" disabled title="即将开放">
              ⚙️ 设置
            </button>
            <button type="button" className="user-menu-item user-menu-logout" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
