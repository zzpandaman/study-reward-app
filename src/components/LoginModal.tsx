import React, { useState } from 'react';
import { login } from '../api/auth-api';
import { showApiError } from '../utils/api-error';
import './LoginModal.css';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showApiError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const res = await login({ username: username.trim(), password });
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        showApiError(res.error || '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <h3>登录</h3>
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
              disabled={loading}
            />
          </div>
          <div className="login-form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <div className="login-modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              取消
            </button>
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
