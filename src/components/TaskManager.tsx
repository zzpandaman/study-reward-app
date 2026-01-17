import React, { useState, useEffect } from 'react';
import { TaskTemplate, TaskExecution } from '../types';
import { taskTemplateStorage, taskExecutionStorage, userDataStorage, calculateReward } from '../utils/storage';
import { TaskTemplateAPI } from '../api';
import './TaskManager.css';

// Wake Lock API 类型定义
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  type: 'screen';
  release(): Promise<void>;
}

const TaskManager: React.FC = () => {
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [runningExecution, setRunningExecution] = useState<TaskExecution | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  // 分页和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'preset' | 'custom'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12); // 每页12个任务（3x4网格）

  useEffect(() => {
    loadTaskTemplates();
    loadExecutions();
    
    // 恢复正在运行的任务
    const running = executions.find((e) => e.status === 'running' || e.status === 'paused');
    if (running) {
      setRunningExecution(running);
      setIsPaused(running.status === 'paused');
      // 计算已用时间（不包括暂停时间）
      const now = Date.now();
      const pausedDuration = running.totalPausedDuration * 1000;
      const effectiveStartTime = running.startTime + pausedDuration;
      const elapsed = running.status === 'paused' 
        ? Math.floor((running.pausedTime! - effectiveStartTime) / 1000)
        : Math.floor((now - effectiveStartTime) / 1000);
      setElapsedSeconds(Math.max(0, elapsed));
    }
  }, [executions.length]);

  // 页面可见性检测：防止后台运行
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      // 如果页面隐藏且任务正在运行，自动暂停
      if (!visible && runningExecution && runningExecution.status === 'running' && !isPaused) {
        // 直接执行暂停逻辑，避免循环依赖
        const updatedExecution: TaskExecution = {
          ...runningExecution,
          status: 'paused',
          pausedTime: Date.now(),
        };
        taskExecutionStorage.update(updatedExecution);
        setRunningExecution(updatedExecution);
        setIsPaused(true);
        loadExecutions();
        alert('⚠️ 检测到页面已切换到后台，任务已自动暂停。请保持页面在前台以确保计时准确。');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsPageVisible(!document.hidden);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runningExecution, isPaused]);

  // Wake Lock API：防止锁屏（移动端）
  useEffect(() => {
    if (!runningExecution || runningExecution.status !== 'running' || isPaused) {
      // 释放 Wake Lock
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        setWakeLock(null);
      }
      return;
    }

    // 请求 Wake Lock（如果支持）
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: WakeLockSentinel) => {
        setWakeLock(lock);
        lock.addEventListener('release', () => {
          setWakeLock(null);
        });
      }).catch(() => {
        // Wake Lock 请求失败（可能用户拒绝或浏览器不支持）
        console.log('Wake Lock 不可用');
      });
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        setWakeLock(null);
      }
    };
  }, [runningExecution?.id, runningExecution?.status, isPaused]);

  useEffect(() => {
    // 计时器：只在任务运行且未暂停时计时
    if (!runningExecution || runningExecution.status !== 'running' || isPaused || !isPageVisible) {
      return;
    }

    const interval = setInterval(() => {
      // 每次从storage获取最新数据，确保使用最新的totalPausedDuration
      const currentExecutions = taskExecutionStorage.get();
      const currentExecution = currentExecutions.find((e) => e.id === runningExecution.id);
      
      if (currentExecution && currentExecution.status === 'running' && !isPaused && isPageVisible) {
        // 基于实际开始时间计算，而不是累加
        const now = Date.now();
        const pausedDuration = currentExecution.totalPausedDuration * 1000;
        const effectiveStartTime = currentExecution.startTime + pausedDuration;
        const elapsed = Math.floor((now - effectiveStartTime) / 1000);
        setElapsedSeconds(Math.max(0, elapsed));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [runningExecution?.id, runningExecution?.startTime, runningExecution?.status, isPaused, isPageVisible]);

  const loadTaskTemplates = () => {
    // 过滤掉无效的任务模板（name或description为空/undefined）
    const templates = taskTemplateStorage.get().filter(
      (template) => template.name && template.name.trim() && template.description && template.description.trim()
    );
    setTaskTemplates(templates);
  };

  const loadExecutions = () => {
    const loadedExecutions = taskExecutionStorage.get();
    setExecutions(loadedExecutions);
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim() || !newTaskDescription.trim()) {
      alert('请输入任务名称和描述');
      return;
    }

    try {
      const response = await TaskTemplateAPI.createTaskTemplate({
        name: newTaskName.trim(),
        description: newTaskDescription.trim(),
      });

      if (response.success) {
        alert('任务添加成功！');
        loadTaskTemplates();
        setNewTaskName('');
        setNewTaskDescription('');
        setShowAddTaskDialog(false);
      } else {
        alert('添加失败：' + (response.error || '未知错误'));
      }
    } catch (error) {
      alert('添加失败：' + (error as Error).message);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    try {
      const response = await TaskTemplateAPI.deleteTaskTemplate(id);
      if (response.success) {
        alert('任务删除成功！');
        loadTaskTemplates();
      } else {
        alert('删除失败：' + (response.error || '未知错误'));
      }
    } catch (error) {
      alert('删除失败：' + (error as Error).message);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTask = () => {
    if (!selectedTemplateId) {
      alert('请选择任务');
      return;
    }

    // 检查是否已有正在运行的任务
    const hasRunning = executions.some((e) => e.status === 'running' || e.status === 'paused');
    if (hasRunning) {
      alert('一次只能执行一个任务！请先完成当前任务。');
      return;
    }

    const template = taskTemplates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    const execution: TaskExecution = {
      id: Date.now().toString(),
      taskTemplateId: template.id,
      taskName: template.name,
      startTime: Date.now(),
      totalPausedDuration: 0,
      actualReward: 0,
      status: 'running',
    };

    taskExecutionStorage.add(execution);
    loadExecutions();
    setRunningExecution(execution);
    setElapsedSeconds(0);
    setIsPaused(false);
    setSelectedTemplateId('');
  };

  const pauseTask = () => {
    if (!runningExecution || runningExecution.status !== 'running') return;

    const updatedExecution: TaskExecution = {
      ...runningExecution,
      status: 'paused',
      pausedTime: Date.now(),
    };

    taskExecutionStorage.update(updatedExecution);
    setRunningExecution(updatedExecution);
    setIsPaused(true);
    loadExecutions();
  };

  const resumeTask = () => {
    if (!runningExecution || runningExecution.status !== 'paused') return;

    // 计算暂停时长
    const pausedDuration = (Date.now() - runningExecution.pausedTime!) / 1000;
    const totalPausedDuration = runningExecution.totalPausedDuration + pausedDuration;

    const updatedExecution: TaskExecution = {
      ...runningExecution,
      status: 'running',
      totalPausedDuration,
      pausedTime: undefined,
    };

    taskExecutionStorage.update(updatedExecution);
    setRunningExecution(updatedExecution);
    setIsPaused(false);
    
    // 恢复任务后重新计算已用时间
    const now = Date.now();
    const pausedDurationMs = totalPausedDuration * 1000;
    const effectiveStartTime = runningExecution.startTime + pausedDurationMs;
    const elapsed = Math.floor((now - effectiveStartTime) / 1000);
    setElapsedSeconds(Math.max(0, elapsed));
    
    loadExecutions();
  };

  const completeTask = () => {
    if (!runningExecution) return;

    const execution = executions.find((e) => e.id === runningExecution.id);
    if (!execution) return;

    // 计算纯学习时间（不包括暂停时间）
    const now = Date.now();
    const pausedDuration = execution.totalPausedDuration * 1000;
    const effectiveStartTime = execution.startTime + pausedDuration;
    const actualSeconds = Math.floor((now - effectiveStartTime) / 1000);
    const actualMinutes = Math.floor(actualSeconds / 60);
    const actualReward = calculateReward(actualMinutes);

    const updatedExecution: TaskExecution = {
      ...execution,
      endTime: now,
      actualDuration: actualMinutes,
      actualReward,
      status: 'completed',
      pausedTime: undefined,
    };

    const allExecutions = taskExecutionStorage.get();
    const updatedExecutions = allExecutions.map((e) =>
      e.id === execution.id ? updatedExecution : e
    );
    taskExecutionStorage.save(updatedExecutions);

    // 添加积分记录
    if (actualReward > 0) {
      userDataStorage.addPointRecord({
        id: Date.now().toString(),
        type: 'earn',
        amount: actualReward,
        description: `完成任务: ${execution.taskName} (${actualMinutes}分钟)`,
        timestamp: Date.now(),
        relatedId: execution.id,
      });
      alert(`任务完成！获得 ${actualReward} 积分！`);
    }

    setRunningExecution(null);
    setElapsedSeconds(0);
    setIsPaused(false);
    loadExecutions();
  };

  const cancelTask = () => {
    if (!runningExecution) return;

    if (confirm('确定要取消当前任务吗？未完成的任务不会获得积分。')) {
      const allExecutions = taskExecutionStorage.get();
      const updatedExecutions = allExecutions.map((e) =>
        e.id === runningExecution.id ? { ...e, status: 'completed' as const, endTime: Date.now(), actualReward: 0 } : e
      );
      taskExecutionStorage.save(updatedExecutions);
      setRunningExecution(null);
      setElapsedSeconds(0);
      setIsPaused(false);
      loadExecutions();
    }
  };


  const actualMinutes = Math.floor(elapsedSeconds / 60);
  const estimatedReward = calculateReward(actualMinutes);

  // 筛选和分页逻辑
  const filteredTemplates = taskTemplates.filter((template) => {
    // 搜索过滤
    const matchesSearch = !searchKeyword.trim() || 
      template.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      template.description.toLowerCase().includes(searchKeyword.toLowerCase());
    
    // 类型过滤
    const matchesFilter = filterType === 'all' || 
      (filterType === 'preset' && template.isPreset) ||
      (filterType === 'custom' && !template.isPreset);
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredTemplates.length / pageSize);
  const paginatedTemplates = filteredTemplates.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (type: 'all' | 'preset' | 'custom') => {
    setFilterType(type);
    setPage(1); // 切换筛选时重置到第一页
  };

  // 当搜索关键词或筛选类型改变时，重置到第一页
  useEffect(() => {
    setPage(1);
  }, [searchKeyword, filterType]);

  return (
    <div className="task-manager">
      <h2>学习任务</h2>

      {/* 选择任务 */}
      {!runningExecution && (
        <div className="task-selection">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>选择任务</h3>
            <button
              className="add-task-btn"
              onClick={() => setShowAddTaskDialog(true)}
              title="添加任务"
            >
              ➕ 添加任务
            </button>
          </div>
          
          {/* 搜索和筛选栏 */}
          <div className="filter-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder="搜索任务名称或描述..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="type-filter">
              <button
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                全部
              </button>
              <button
                className={`filter-btn ${filterType === 'preset' ? 'active' : ''}`}
                onClick={() => handleFilterChange('preset')}
              >
                预设
              </button>
              <button
                className={`filter-btn ${filterType === 'custom' ? 'active' : ''}`}
                onClick={() => handleFilterChange('custom')}
              >
                自定义
              </button>
            </div>
          </div>

          {/* 统计信息 */}
          {filteredTemplates.length > 0 && (
            <div className="filter-summary">
              共 {filteredTemplates.length} 个任务，当前显示 {paginatedTemplates.length} 个
            </div>
          )}

          {/* 任务列表 */}
          {paginatedTemplates.length === 0 ? (
            <div className="empty-tasks">
              <p>没有找到符合条件的任务</p>
            </div>
          ) : (
            <>
              <div className="task-templates">
                {paginatedTemplates.map((template) => (
              <div
                key={template.id}
                className={`task-template-card ${
                  selectedTemplateId === template.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
              >
                <div style={{ flex: 1 }}>
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <div className="reward-info">积分: 1/分钟</div>
                </div>
                {!template.isPreset && (
                  <button
                    className="delete-task-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(template.id);
                    }}
                    title="删除任务"
                  >
                    🗑️
                  </button>
                )}
              </div>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    上一页
                  </button>
                  <span className="pagination-info">
                    第 {page} / {totalPages} 页
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    下一页
                  </button>
                </div>
              )}

              <button
                className="start-task-btn"
                onClick={startTask}
                disabled={!selectedTemplateId}
              >
                开始任务
              </button>
            </>
          )}
        </div>
      )}

      {/* 正在执行的任务 */}
      {runningExecution && (
        <div className="running-task">
          <h3>正在执行: {runningExecution.taskName}</h3>
          {!isPageVisible && (
            <div className="timer-warning" style={{ background: 'rgba(255, 193, 7, 0.3)', marginBottom: '12px' }}>
              ⚠️ 页面已切换到后台，请保持页面在前台以确保计时准确
            </div>
          )}
          <div className="timer">
            <div className="timer-display">
              {formatTime(elapsedSeconds)}
              {isPaused && <span className="paused-indicator">（已暂停）</span>}
            </div>
            <div className="timer-info">
              学习时间: {actualMinutes} 分钟 | 预计奖励: {estimatedReward} 积分
            </div>
            {isPaused && (
              <div className="pause-notice">
                ⏸️ 任务已暂停，暂停时间不计入学习时间
              </div>
            )}
            {!isPageVisible && !isPaused && (
              <div className="pause-notice" style={{ background: 'rgba(255, 193, 7, 0.2)' }}>
                ⚠️ 请保持页面在前台，切换到后台会自动暂停计时
              </div>
            )}
          </div>
          <div className="task-actions">
            {isPaused ? (
              <button className="resume-btn" onClick={resumeTask}>
                继续任务
              </button>
            ) : (
              <button className="pause-btn" onClick={pauseTask}>
                暂停（如厕等）
              </button>
            )}
            <button className="complete-btn" onClick={completeTask}>
              完成任务
            </button>
            <button className="cancel-btn" onClick={cancelTask}>
              取消任务
            </button>
          </div>
        </div>
      )}


      {/* 添加任务对话框 */}
      {showAddTaskDialog && (
        <div className="modal-overlay" onClick={() => setShowAddTaskDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>添加任务</h3>
            <div className="form-group">
              <label>任务名称：</label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="例如：阅读"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>任务描述：</label>
              <textarea
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="例如：进行阅读学习"
                className="form-textarea"
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddTaskDialog(false)}>取消</button>
              <button className="confirm-btn" onClick={handleAddTask}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
