import React from 'react';
import { Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import Shop from '../components/Shop';
import type { AppShellOutletContext } from '../layouts/shell-context';
import './PageChrome.css';

const ShopPage: React.FC = () => {
  const { loadPoints } = useOutletContext<AppShellOutletContext>();
  return (
    <div className="page-with-chrome">
      <div className="page-chrome">
        <Link to="/console" className="page-back">
          ← 返回主页
        </Link>
        <h1 className="page-title">积分商店</h1>
        <p className="page-sub">使用积分兑换商品。</p>
      </div>
      <Shop useNewProductPage onPointsChange={() => loadPoints()} />
    </div>
  );
};

export default ShopPage;
