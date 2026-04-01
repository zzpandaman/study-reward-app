import React from 'react';
import { useOutletContext } from 'react-router-dom';
import TaskManager from '../components/TaskManager';
import type { AppShellOutletContext } from '../layouts/shell-context';
import './PageChrome.css';

const TemplatesPage: React.FC = () => {
  const { loadPoints } = useOutletContext<AppShellOutletContext>();
  return (
    <div className="page-with-chrome">
      <TaskManager variant="full" hideExecutionUi onPointsChange={() => loadPoints()} />
    </div>
  );
};

export default TemplatesPage;
