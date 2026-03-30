import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import TaskManager from '../components/TaskManager';
import type { AppShellOutletContext } from '../layouts/shell-context';
import './PageChrome.css';

const TemplatesPage: React.FC = () => {
  const { loadPoints } = useOutletContext<AppShellOutletContext>();
  return (
    <div className="page-with-chrome">
      <div className="page-chrome">
        <Link to="/console" className="page-back">
          ← 返回控制台
        </Link>
        <div className="page-chrome-title-row">
          <div>
            <h1 className="page-title">积分模版</h1>
            <p className="page-sub">选择一个模版，或通过下方列表管理任务模板。</p>
          </div>
          <Link to="/templates/new" className="page-primary-btn">
            + 新增模版
          </Link>
        </div>
      </div>
      <TaskManager variant="full" suppressAddButton hideExecutionUi onPointsChange={() => loadPoints()} />
    </div>
  );
};

export default TemplatesPage;
