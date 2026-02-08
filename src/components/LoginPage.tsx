import React, { useState } from 'react';
import { login, register } from '../api/auth-api';
import { showApiError } from '../utils/api-error';
import './LoginPage.css';

interface LoginPageProps {
  onSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
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
      } else {
        showApiError(res.error || '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showApiError('请输入用户名和密码');
      return;
    }
    if (password.length < 6 || password.length > 20) {
      showApiError('密码长度为 6-20 位');
      return;
    }
    setLoading(true);
    try {
      const req: { username: string; password: string; email?: string; nickname?: string } = {
        username: username.trim(),
        password,
      };
      if (email.trim()) req.email = email.trim();
      if (nickname.trim()) req.nickname = nickname.trim();
      const res = await register(req);
      if (res.success) {
        onSuccess();
      } else {
        showApiError(res.error || '注册失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page-card">
        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            登录
          </button>
          <button
            type="button"
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            注册
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
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
            <div className="login-form-actions">
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
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
                placeholder="6-20 位密码"
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <div className="login-form-group">
              <label>邮箱（选填）</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="login-form-group">
              <label>昵称（选填）</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                autoComplete="nickname"
                disabled={loading}
              />
            </div>
            <div className="login-form-actions">
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </button>
            </div>
          </form>
        )}

        <p className="login-switch-hint">
          {mode === 'login' ? (
            <>
              没有账号？{' '}
              <button type="button" className="login-switch-btn" onClick={() => setMode('register')}>
                去注册
              </button>
            </>
          ) : (
            <>
              已有账号？{' '}
              <button type="button" className="login-switch-btn" onClick={() => setMode('login')}>
                去登录
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
