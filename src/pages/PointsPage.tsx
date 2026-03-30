import React from 'react';
import PointRecords from '../components/PointRecords';
import './PageChrome.css';

const PointsPage: React.FC = () => {
  return (
    <div className="page-with-chrome">
      <div className="page-chrome">
        <h1 className="page-title">积分记录</h1>
        <p className="page-sub">查看获取与消耗记录，点击一行查看详情。</p>
      </div>
      <PointRecords variant="page" />
    </div>
  );
};

export default PointsPage;
