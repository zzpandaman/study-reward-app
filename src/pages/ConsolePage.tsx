import React from 'react';
import { useOutletContext } from 'react-router-dom';
import TaskManager from '../components/TaskManager';
import type { AppShellOutletContext } from '../layouts/shell-context';

const ConsolePage: React.FC = () => {
  const { loadPoints } = useOutletContext<AppShellOutletContext>();
  return (
    <TaskManager
      variant="console"
      onPointsChange={() => {
        loadPoints();
      }}
    />
  );
};

export default ConsolePage;
