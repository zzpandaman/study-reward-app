import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Inventory from '../components/Inventory';
import type { AppShellOutletContext } from '../layouts/shell-context';
import './PageChrome.css';

const InventoryPage: React.FC = () => {
  const { userPoints } = useOutletContext<AppShellOutletContext>();
  return (
    <div className="page-with-chrome">
      <div className="page-chrome">
        <h1 className="page-title">背包</h1>
        <p className="page-sub">
          当前积分：<strong>{userPoints.toFixed(2)}</strong>
        </p>
      </div>
      <Inventory />
    </div>
  );
};

export default InventoryPage;
