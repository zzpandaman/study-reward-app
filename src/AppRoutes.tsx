import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AuthGate from './components/AuthGate';
import AppShell from './layouts/AppShell';
import LoginRoute from './pages/LoginRoute';
import ConsolePage from './pages/ConsolePage';
import TemplatesPage from './pages/TemplatesPage';
import TemplatesNewPage from './pages/TemplatesNewPage';
import ShopPage from './pages/ShopPage';
import ShopNewPage from './pages/ShopNewPage';
import PointsPage from './pages/PointsPage';
import PointRecordDetailPage from './pages/PointRecordDetailPage';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<AuthGate />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/console" replace />} />
          <Route path="/console" element={<ConsolePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/new" element={<TemplatesNewPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/new" element={<ShopNewPage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/points/:id" element={<PointRecordDetailPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/console" replace />} />
    </Routes>
  );
};

export default AppRoutes;
