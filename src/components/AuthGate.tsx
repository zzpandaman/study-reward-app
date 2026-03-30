import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasToken } from '../api';

const AuthGate: React.FC = () => {
  const location = useLocation();
  if (!hasToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};

export default AuthGate;
