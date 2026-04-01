import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Shop from '../components/Shop';
import type { AppShellOutletContext } from '../layouts/shell-context';
import './PageChrome.css';

const ShopPage: React.FC = () => {
  const { loadPoints } = useOutletContext<AppShellOutletContext>();
  return (
    <div className="page-with-chrome">
      <Shop useNewProductPage onPointsChange={() => loadPoints()} />
    </div>
  );
};

export default ShopPage;
