import React, { useState, useEffect } from 'react';
import { TaskTemplate, TaskExecution } from '../types';
import { taskTemplateStorage, taskExecutionStorage, userDataStorage, calculateReward } from '../utils/storage';
import './TaskManager.css';

const TaskManager: React.FC = () => {
  const [taskTemplates] = useState<TaskTemplate[]>(taskTemplateStorage.get());
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [runningExecution, setRunningExecution] = useState<TaskExecution | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    // 计时器：只在任务运行且未暂停时计时
    if (!runningExecution || runningExecution.status !== 'running' || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      if (runningExecution && runningExecution.status === 'running' && !isPaused) {
        // 基于实际开始时间计算，而不是累加
        const now = Date.now();
        const pausedDuration = runningExecution.totalPausedDuration * 1000;
        const effectiveStartTime = runningExecution.startTime + pausedDuration;
        const elapsed = Math.floor((now - effectiveStartTime) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [runningExecution?.id, runningExecution?.startTime, runningExecution?.totalPausedDuration, runningExecution?.status, isPaused]);

  const loadExecutions = () => {
    const loadedExecutions = taskExecutionStorage.get();
    setExecutions(loadedExecutions);
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

  const completedExecutions = executions
    .filter((e) => e.status === 'completed')
    .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

  const actualMinutes = Math.floor(elapsedSeconds / 60);
  const estimatedReward = calculateReward(actualMinutes);

  return (
    <div className="task-manager">
      <h2>学习任务</h2>

      {/* 选择任务 */}
      {!runningExecution && (
        <div className="task-selection">
          <h3>选择任务</h3>
          <div className="task-templates">
            {taskTemplates.map((template) => (
              <div
                key={template.id}
                className={`task-template-card ${
                  selectedTemplateId === template.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <div className="reward-info">积分: 1/分钟</div>
              </div>
            ))}
          </div>

          <button
            className="start-task-btn"
            onClick={startTask}
            disabled={!selectedTemplateId}
          >
            开始任务
          </button>
        </div>
      )}

      {/* 正在执行的任务 */}
      {runningExecution && (
        <div className="running-task">
          <h3>正在执行: {runningExecution.taskName}</h3>
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

      {/* 完成记录 */}
      {completedExecutions.length > 0 && (
        <div className="execution-history">
          <h3>任务记录</h3>
          <div className="history-list">
            {completedExecutions.slice(0, 20).map((execution) => (
              <div
                key={execution.id}
                className={`history-item ${execution.actualReward > 0 ? 'completed' : 'failed'}`}
              >
                <div className="history-info">
                  <h4>{execution.taskName}</h4>
                  <div className="history-meta">
                    {new Date(execution.startTime).toLocaleString('zh-CN')} | 学习时长:{' '}
                    {execution.actualDuration || 0}分钟
                  </div>
                </div>
                <div className="history-reward">
                  {execution.actualReward > 0 ? (
                    <span className="reward-earned">+{execution.actualReward} 积分</span>
                  ) : (
                    <span className="reward-failed">未完成，无积分</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
