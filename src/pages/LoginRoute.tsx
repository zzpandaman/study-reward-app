import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import LoginPage from '../components/LoginPage';
import { hasToken } from '../api';

const LoginRoute: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('login-full');
    return () => document.body.classList.remove('login-full');
  }, []);

  if (hasToken()) {
    return <Navigate to="/console" replace />;
  }

  return <LoginPage onSuccess={() => navigate('/console', { replace: true })} />;
};

export default LoginRoute;
