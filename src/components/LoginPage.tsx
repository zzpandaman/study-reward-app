import React, { useMemo, useState } from 'react';
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const rightTitle = useMemo(() => (mode === 'login' ? '欢迎回来' : '开启云端之旅'), [mode]);
  const rightSubtitle = useMemo(
    () => (mode === 'login' ? '准备好赢取今天的积分了吗？' : '注册账号，开始你的积分成长之路。'),
    [mode],
  );

  const handleSwitchMode = (next: 'login' | 'register') => {
    setMode(next);
    setPassword('');
    setShowPassword(false);
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      showApiError('请输入邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      // 后端字段名为 username，这里用邮箱/用户名均可作为标识
      const res = await login({ username: email.trim(), password });
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
    if (password !== confirmPassword) {
      showApiError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6 || password.length > 20) {
      showApiError('密码长度为 6-20 位');
      return;
    }
    setLoading(true);
    try {
      const req: { username: string; password: string; email?: string } = {
        username: username.trim(),
        password,
      };
      if (email.trim()) req.email = email.trim();
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
      <div className="login-page-blob login-page-blob--left" aria-hidden="true" />
      <div className="login-page-blob login-page-blob--right" aria-hidden="true" />

      <div className="login-page-shell">
        <div className="login-page-card">
          <div className="login-page-left">
            <div className="login-page-left-inner">
              <div className="login-page-badge">游戏化学习</div>
              <div className="login-page-left-title">让你的目标化为积分。</div>
              <div className="login-page-left-desc">
                <div>加入 50,000+ 名学习者的行列，在提升技能的同时，于</div>
                <div>云端商店赢取专属道具。</div>
              </div>

              <div className="login-page-features">
                <div className="login-page-feature">
                  <div className="login-page-feature-icon" aria-hidden="true">
                    ✓
                  </div>
                  <div className="login-page-feature-body">
                    <div className="login-page-feature-title">每日任务</div>
                    <div className="login-page-feature-desc">完成任务即可赚取云币积分。</div>
                  </div>
                </div>
                <div className="login-page-feature">
                  <div className="login-page-feature-icon" aria-hidden="true">
                    🛍
                  </div>
                  <div className="login-page-feature-body">
                    <div className="login-page-feature-title">宝库中心</div>
                    <div className="login-page-feature-desc">解锁稀有道具和强力增益。</div>
                  </div>
                </div>
              </div>

              <div className="login-page-testimonial">
                <div className="login-page-avatars" aria-hidden="true">
                  <span className="login-page-avatar login-page-avatar--a">A</span>
                  <span className="login-page-avatar login-page-avatar--b">B</span>
                  <span className="login-page-avatar login-page-avatar--c">C</span>
                  <span className="login-page-avatar login-page-avatar--more">+12</span>
                </div>
                <div className="login-page-quote">“这是保持学习动力的最佳方式！”</div>
              </div>
            </div>
          </div>

          <div className="login-page-right">
            <div className="login-page-right-inner">
              <div className="login-page-right-header">
                <div className="login-page-right-title">{rightTitle}</div>
                <div className="login-page-right-subtitle">{rightSubtitle}</div>
              </div>

              <div className="login-page-tabs" role="tablist" aria-label="登录与注册">
                <span className={`login-page-tab-indicator ${mode}`} aria-hidden="true" />
                <button
                  type="button"
                  className={`login-page-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => handleSwitchMode('login')}
                  disabled={loading}
                  role="tab"
                  aria-selected={mode === 'login'}
                >
                  登录
                </button>
                <button
                  type="button"
                  className={`login-page-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => handleSwitchMode('register')}
                  disabled={loading}
                  role="tab"
                  aria-selected={mode === 'register'}
                >
                  注册
                </button>
              </div>

              {mode === 'login' ? (
                <form className="login-page-form" onSubmit={handleLogin}>
                  <div className="login-page-form-group">
                    <label htmlFor="login-email">电子邮箱</label>
                    <input
                      id="login-email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>

                  <div className="login-page-form-group">
                    <div className="login-page-form-row">
                      <label htmlFor="login-password">密码</label>
                      <button
                        type="button"
                        className="login-page-link"
                        onClick={() => showApiError('忘记密码暂未实现')}
                        disabled={loading}
                      >
                        忘记密码？
                      </button>
                    </div>
                    <div className="login-page-password">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="login-page-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        disabled={loading}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                          <path
                            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <label className="login-page-check">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                    <span>保持登录状态（30天）</span>
                  </label>

                  <button type="submit" className="login-page-primary" disabled={loading}>
                    {loading ? '登录中...' : '登录 CloudLearn'}
                  </button>
                </form>
              ) : (
                <form className="login-page-form" onSubmit={handleRegister}>
                  <div className="login-page-form-group">
                    <label htmlFor="register-username">用户名</label>
                    <input
                      id="register-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="你的个性称呼"
                      autoComplete="username"
                      disabled={loading}
                    />
                  </div>

                  <div className="login-page-form-group">
                    <label htmlFor="register-email">电子邮箱</label>
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  <div className="login-page-form-group">
                    <label htmlFor="register-password">密码</label>
                    <div className="login-page-password">
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="设置你的密码"
                        autoComplete="new-password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="login-page-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                        disabled={loading}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                          <path
                            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="login-page-form-group">
                    <label htmlFor="register-confirm">确认密码</label>
                    <input
                      id="register-confirm"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>

                  <button type="submit" className="login-page-primary" disabled={loading}>
                    {loading ? '创建中...' : '创建账户'}
                  </button>
                </form>
              )}

              <div className="login-page-footnote">
                继续操作即表示您同意 CloudLearn 的 <a href="#" onClick={(e) => e.preventDefault()}>服务条款</a> 和{' '}
                <a href="#" onClick={(e) => e.preventDefault()}>隐私政策</a>。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
