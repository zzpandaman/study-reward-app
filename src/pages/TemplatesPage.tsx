import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TaskManager from '../components/TaskManager';
import type { AppShellOutletContext } from '../layouts/shell-context';
import './PageChrome.css';

const TemplatesPage: React.FC = () => {
  const { loadPoints } = useOutletContext<AppShellOutletContext>();
  const [listTab, setListTab] = useState<'executable' | 'published'>('executable');

  return (
    <div className="page-with-chrome">
      <h1 className="page-title">积分模版</h1>
      <div className="template-mode-tabs" role="tablist" aria-label="模版列表类型">
        <button
          type="button"
          role="tab"
          aria-selected={listTab === 'executable'}
          className={`template-mode-tab ${listTab === 'executable' ? 'template-mode-tab--active' : ''}`}
          onClick={() => setListTab('executable')}
        >
          可执行模版
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={listTab === 'published'}
          className={`template-mode-tab ${listTab === 'published' ? 'template-mode-tab--active' : ''}`}
          onClick={() => setListTab('published')}
        >
          我发布的
        </button>
      </div>
      <TaskManager
        variant="full"
        hideExecutionUi
        templatesListTab={listTab}
        onPointsChange={() => loadPoints()}
      />
    </div>
  );
};

export default TemplatesPage;
