import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskTemplate, TaskExecution } from '../types';
import { calculateReward } from '../utils/reward';
import { TaskTemplateAPI, TaskExecutionAPI } from '../api';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../utils/pagination';
import {
  readBackgroundTimerCheckEnabled,
  BACKGROUND_TIMER_PREF_EVENT,
} from '../utils/background-timer-pref';
import './TaskManager.css';

// Wake Lock API 类型定义
interface WakeLockSentinel extends EventTarget {
  released: boolean;
  type: 'screen';
  release(): Promise<void>;
}

interface TaskManagerProps {
  onPointsChange?: () => void;
  onRunningTaskChange?: (task: TaskExecution | null) => void;
  /** full：积分模版列表页；console：控制台双栏 + 专注区铺满 */
  variant?: 'full' | 'console';
  /** 由页面「新增模版」承担时使用 */
  suppressAddButton?: boolean;
  /** true：仅模版列表与管理，不展示进行中任务与计时设置（用于积分模版页；执行与计时应在控制台） */
  hideExecutionUi?: boolean;
}

const TaskManager: React.FC<TaskManagerProps> = ({
  onPointsChange,
  onRunningTaskChange,
  variant = 'full',
  suppressAddButton = false,
  hideExecutionUi = false,
}) => {
  const navigate = useNavigate();
  const [focusExpanded, setFocusExpanded] = useState(false);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [taskTemplatesTotal, setTaskTemplatesTotal] = useState(0);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [runningExecution, setRunningExecution] = useState<TaskExecution | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [enableBackgroundCheck, setEnableBackgroundCheck] = useState(readBackgroundTimerCheckEnabled);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  // 分页和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'preset' | 'custom'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const pauseRequestedRef = useRef(false); // 解决暂停时 interval 读到旧闭包的问题
  const elapsedSecondsRef = useRef(0);

  // 后端返回秒级时间戳，转为 ms 与 Date.now() 配合
  const toMs = (sec: number | undefined) => (sec ?? 0) * 1000;

  // Effect A: 挂载时加载数据
  useEffect(() => {
    loadExecutions();
  }, []);

  useEffect(() => {
    loadTaskTemplates(page);
  }, [page]);

  useEffect(() => {
    const sync = () => setEnableBackgroundCheck(readBackgroundTimerCheckEnabled());
    window.addEventListener(BACKGROUND_TIMER_PREF_EVENT, sync);
    return () => window.removeEventListener(BACKGROUND_TIMER_PREF_EVENT, sync);
  }, []);

  // 从 execution 计算 elapsed（总执行秒数）
  const computeElapsed = (exec: TaskExecution): number => {
    const elapsed =
      exec.totalExecutionDuration ?? exec.accumulatedExecutionSeconds ?? (() => {
        const now = Date.now();
        const pausedDurationMs = (exec.totalPausedDuration ?? 0) * 1000;
        const effectiveStartTime = toMs(exec.startTime) + pausedDurationMs;
        return exec.status === 'paused' && exec.pausedTime
          ? Math.floor((toMs(exec.pausedTime) - effectiveStartTime) / 1000)
          : Math.floor((now - effectiveStartTime) / 1000);
      })();
    return Math.max(0, elapsed);
  };

  // Effect B: 当 executions 更新后恢复进行中任务
  // 同一会话内不覆盖 elapsed（前端为数据源，避免 loadExecutions 覆盖本地计时）
  useEffect(() => {
    const running = executions.find((e) => e.status === 'running' || e.status === 'paused');
    if (running) {
      setRunningExecution(running);
      setIsPaused(running.status === 'paused');
      const isSameSession = runningExecution && String(runningExecution.id) === String(running.id);
      if (!isSameSession) {
        const needByNo =
          running.executionNo &&
          running.totalExecutionDuration == null &&
          running.accumulatedExecutionSeconds == null;
        if (needByNo && running.executionNo) {
          TaskExecutionAPI.getExecutionByNo(running.executionNo).then((res) => {
            const raw = (res.data as { data?: TaskExecution })?.data ?? res.data;
            const full = raw ? { ...raw, id: String((raw as TaskExecution).id) } as TaskExecution : running;
            setRunningExecution(full);
            setIsPaused(full.status === 'paused');
            setElapsedSeconds(computeElapsed(full));
          }).catch(() => {
            setElapsedSeconds(computeElapsed(running));
          });
        } else {
          setElapsedSeconds(computeElapsed(running));
        }
      }
    } else {
      setRunningExecution(null);
      setElapsedSeconds(0);
    }
  }, [executions, runningExecution]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  // 向 App 上报进行中任务状态
  useEffect(() => {
    onRunningTaskChange?.(runningExecution);
  }, [runningExecution, onRunningTaskChange]);

  // 页面可见性检测：仅在启用后台检测时执行
  useEffect(() => {
    // 如果未启用后台检测，不执行任何检测逻辑（允许后台计时）
    if (!enableBackgroundCheck) {
      setIsPageVisible(true);
      return;
    }

    // 启用后台检测：使用页面可见性API检测
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsPageVisible(visible);
      
      // 如果页面隐藏且启用后台检测，暂停计时
      if (!visible && runningExecution && runningExecution.status === 'running' && !isPaused) {
        const clientTime =
          (runningExecution.startTime ?? 0) +
          (runningExecution.totalPausedDuration ?? 0) +
          elapsedSecondsRef.current;
        setIsPaused(true);
        setRunningExecution((e) => (e ? { ...e, status: 'paused' as const } : null));
        TaskExecutionAPI.pauseTask(String(runningExecution.id), clientTime).then((res) => {
          const pauseData = (res.data as { data?: TaskExecution })?.data ?? res.data;
          if (res.success && pauseData) {
            const data = pauseData as TaskExecution;
            setRunningExecution({ ...data, id: String(data.id) } as TaskExecution);
            // 以前端时间为准：不更新 elapsed
          } else {
            setIsPaused(false);
            setRunningExecution((e) => (e ? { ...e, status: 'running' as const } : null));
          }
          loadExecutions();
        });
        alert('⚠️ 检测到页面已切换到后台，任务已自动暂停。请保持页面在前台以确保计时准确。');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsPageVisible(!document.hidden);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runningExecution, isPaused, enableBackgroundCheck]);

  // Wake Lock API：防止锁屏（仅在启用后台检测时使用）
  useEffect(() => {
    // 如果未启用后台检测，不使用 Wake Lock（允许锁屏）
    if (!enableBackgroundCheck) {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        setWakeLock(null);
      }
      return;
    }

    // 启用后台检测时，强制使用 Wake Lock 防止锁屏
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
        console.log('Wake Lock 不可用，可能无法防止自动锁屏');
      });
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        setWakeLock(null);
      }
    };
  }, [runningExecution?.id, runningExecution?.status, isPaused, enableBackgroundCheck]);

  useEffect(() => {
    // 计时器逻辑：
    // - 如果禁用后台检测：只要任务运行且未手动暂停就一直计时（不检查isPageVisible）
    // - 如果启用后台检测：只在任务运行且未暂停且页面可见时计时
    const shouldCount = enableBackgroundCheck ? isPageVisible : true;

    if (!runningExecution || runningExecution.status !== 'running' || isPaused || !shouldCount) {
      return;
    }

    const interval = setInterval(() => {
      if (pauseRequestedRef.current) return;
      const shouldCountNow = enableBackgroundCheck ? isPageVisible : true;
      if (runningExecution?.status === 'running' && !isPaused && shouldCountNow) {
        // 以前端时间为准：纯递增，计时器只会向前跑
        setElapsedSeconds((s) => s + 1);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [runningExecution?.id, runningExecution?.status, isPaused, isPageVisible, enableBackgroundCheck]);

  const loadTaskTemplates = async (currentPage: number = page) => {
    const res = await TaskTemplateAPI.getTaskTemplates(currentPage, pageSize);
    if (res.success && res.data?.data) {
      const templates = (res.data.data as TaskTemplate[]).filter(
        (t) => t.name?.trim() && t.description?.trim()
      );
      setTaskTemplates(templates);
      setTaskTemplatesTotal(res.data.total ?? templates.length);
    }
  };

  const loadExecutions = async () => {
    const res = await TaskExecutionAPI.getTaskExecutions();
    if (!res.success || !res.data) return;
    const raw = (res.data as { data?: TaskExecution[] })?.data ?? res.data;
    if (Array.isArray(raw)) {
      setExecutions(raw.map((e) => ({ ...e, id: String(e.id) })));
    }
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
        loadTaskTemplates(page);
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
        loadTaskTemplates(page);
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

  const startTask = async (templateId?: string) => {
    const startId = templateId ?? selectedTemplateId;
    if (!startId) {
      alert('请选择任务');
      return;
    }

    const hasRunning = executions.some((e) => e.status === 'running' || e.status === 'paused');
    if (hasRunning) {
      alert('一次只能执行一个任务！请先完成当前任务。');
      return;
    }

    const template = taskTemplates.find((t) => t.id === startId);
    if (!template) return;

    const res = await TaskExecutionAPI.startTask({
      taskTemplateId: String(template.id),
      clientTime: Math.floor(Date.now() / 1000),
    });
    const execData = (res.data as { data?: TaskExecution })?.data ?? res.data;
    if (res.success && execData) {
      const data = execData as TaskExecution;
      const execution = { ...data, id: String(data.id) } as TaskExecution;
      await loadExecutions();
      setRunningExecution(execution);
      setElapsedSeconds(0);
      setIsPaused(false);
      setSelectedTemplateId('');
    }
  };

  const pauseTask = async () => {
    if (!runningExecution || runningExecution.status !== 'running') return;
    const clientTime =
      (runningExecution.startTime ?? 0) + (runningExecution.totalPausedDuration ?? 0) + elapsedSeconds;

    const prevExecution = runningExecution;
    pauseRequestedRef.current = true; // 同步设置，避免 interval 继续累加
    setIsPaused(true);
    setRunningExecution((e) => (e ? { ...e, status: 'paused' as const } : null));

    const res = await TaskExecutionAPI.pauseTask(String(prevExecution.id), clientTime);
    pauseRequestedRef.current = false;
    const pauseData = (res.data as { data?: TaskExecution })?.data ?? res.data;
    if (res.success && pauseData) {
      const data = pauseData as TaskExecution;
      const updated = { ...data, id: String(data.id) } as TaskExecution;
      setRunningExecution(updated);
      // 以前端时间为准：不更新 elapsed，计时器停瞬间的值即最终值
      loadExecutions();
    } else {
      setIsPaused(false);
      setRunningExecution(prevExecution);
    }
  };

  const resumeTask = async () => {
    if (!runningExecution || runningExecution.status !== 'paused') return;
    const clientTime = Math.floor(Date.now() / 1000);

    const res = await TaskExecutionAPI.resumeTask(String(runningExecution.id), clientTime);
    const resumeData = (res.data as { data?: TaskExecution })?.data ?? res.data;
    if (res.success && resumeData) {
      const data = resumeData as TaskExecution;
      const updated = { ...data, id: String(data.id) } as TaskExecution;
      setRunningExecution(updated);
      setIsPaused(false);
      // 不依赖 API 返回的 elapsed（resume 瞬间为 0），由 interval 基于 totalPausedDuration 正确计算
      loadExecutions();
    }
  };

  const completeTask = async () => {
    if (!runningExecution) return;
    const clientTime =
      (runningExecution.startTime ?? 0) + (runningExecution.totalPausedDuration ?? 0) + elapsedSeconds;

    const res = await TaskExecutionAPI.completeTask(String(runningExecution.id), clientTime);
    if (res.success) {
      const reward = (res.data as { reward?: number })?.reward ?? 0;
      if (reward > 0) alert(`任务完成！获得 ${reward} 积分！`);
      setRunningExecution(null);
      setElapsedSeconds(0);
      setIsPaused(false);
      loadExecutions();
      onPointsChange?.();
      window.dispatchEvent(new CustomEvent('app:points-refresh'));
    }
  };

  const cancelTask = async () => {
    if (!runningExecution) return;

    if (!confirm('确定要取消当前任务吗？未完成的任务不会获得积分。')) return;
    const clientTime =
      (runningExecution.startTime ?? 0) + (runningExecution.totalPausedDuration ?? 0) + elapsedSeconds;

    const res = await TaskExecutionAPI.cancelTask(String(runningExecution.id), clientTime);
    if (res.success) {
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

  const totalPages = Math.max(1, Math.ceil(taskTemplatesTotal / pageSize));
  const paginatedTemplates = filteredTemplates;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (type: 'all' | 'preset' | 'custom') => {
    setFilterType(type);
    setPage(1); // 切换筛选时重置到第一页
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  // 当搜索关键词或筛选类型改变时，重置到第一页
  useEffect(() => {
    setPage(1);
  }, [searchKeyword, filterType]);

  useEffect(() => {
    if (!runningExecution) {
      setFocusExpanded(false);
    }
  }, [runningExecution]);

  const runningTaskSection = runningExecution ? (
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
          <div className="pause-notice">任务已暂停，暂停时间不计入学习时间</div>
        )}
      </div>
      <div className="task-actions">
        {isPaused ? (
          <button type="button" className="resume-btn" onClick={resumeTask}>
            继续任务
          </button>
        ) : (
          <button type="button" className="pause-btn" onClick={pauseTask}>
            暂停
          </button>
        )}
        <button type="button" className="complete-btn" onClick={completeTask}>
          完成任务
        </button>
        <button type="button" className="cancel-btn" onClick={cancelTask}>
          取消任务
        </button>
      </div>
    </div>
  ) : null;

  if (variant === 'console') {
    return (
      <div className={`task-manager task-manager--console ${focusExpanded ? 'task-manager--focus-expanded' : ''}`}>
        <div className="tm-console-layout">
          {!runningExecution ? (
            <div className="tm-console-main">
              <header className="tm-console-page-header">
                <p className="tm-console-sub">持续专注，实时结算奖励</p>
              </header>
              {(() => {
                const running = executions.find((e) => e.status === 'running' || e.status === 'paused');
                if (!running) return null;
                return (
                  <button
                    type="button"
                    className="running-task-banner"
                    onClick={() => {
                      setRunningExecution(running);
                      setIsPaused(running.status === 'paused');
                      const elapsed =
                        running.totalExecutionDuration ??
                        running.accumulatedExecutionSeconds ??
                        (() => {
                          const now = Date.now();
                          const pausedDurationMs = (running.totalPausedDuration ?? 0) * 1000;
                          const effectiveStartTime = toMs(running.startTime) + pausedDurationMs;
                          return running.status === 'paused' && running.pausedTime
                            ? Math.floor((toMs(running.pausedTime) - effectiveStartTime) / 1000)
                            : Math.floor((now - effectiveStartTime) / 1000);
                        })();
                      setElapsedSeconds(Math.max(0, elapsed));
                    }}
                  >
                    你有进行中的任务：{running.taskName}，点击进入
                  </button>
                );
              })()}
              <section className="tm-console-favorites" aria-label="我的常用">
                <div className="tm-console-favorites-head">
                  <h2>我的常用</h2>
                  <button type="button" className="tm-console-link-all" onClick={() => navigate('/templates')}>
                    查看全部
                  </button>
                </div>
                <div className="tm-console-favorites-placeholder" />
              </section>
            </div>
          ) : (
            <div className="tm-console-main tm-console-main--spacer" aria-hidden />
          )}
          <aside className={`tm-console-focus ${focusExpanded ? 'is-expanded' : ''}`} aria-label="专注计时">
            <div className="tm-console-focus-toolbar">
              <button
                type="button"
                className="tm-console-focus-expand-btn"
                onClick={() => setFocusExpanded((v) => !v)}
              >
                {focusExpanded ? '退出铺满' : '铺满专注区'}
              </button>
            </div>
            {runningExecution ? (
              runningTaskSection
            ) : (
              <div className="tm-console-focus-placeholder">在左侧从「积分模版」开始任务后在此专注</div>
            )}
          </aside>
        </div>
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
                <button type="button" onClick={() => setShowAddTaskDialog(false)}>
                  取消
                </button>
                <button type="button" className="confirm-btn" onClick={handleAddTask}>
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const hasOngoingElsewhere = executions.some((e) => e.status === 'running' || e.status === 'paused');

  return (
    <div className={`task-manager ${variant === 'full' ? 'task-manager--full' : ''}`}>
      {/* 选择任务：积分模版页在存在进行中任务时仍展示列表，但不展示进行中面板 */}
      {(!runningExecution || hideExecutionUi) && (
        <div className="task-selection">
          {hideExecutionUi && hasOngoingElsewhere && (
            <div className="templates-console-hint" role="status">
              当前有任务进行中，请到
              <button type="button" className="templates-console-hint-link" onClick={() => navigate('/console')}>
                控制台
              </button>
              查看计时与操作。
            </div>
          )}
          {/* 进行中任务入口 banner（仅非积分模版页展示） */}
          {!hideExecutionUi &&
            (() => {
              const running = executions.find((e) => e.status === 'running' || e.status === 'paused');
              if (!running) return null;
              return (
                <button
                  type="button"
                  className="running-task-banner"
                  onClick={() => {
                    setRunningExecution(running);
                    setIsPaused(running.status === 'paused');
                    const elapsed =
                      running.totalExecutionDuration ??
                      running.accumulatedExecutionSeconds ??
                      (() => {
                        const now = Date.now();
                        const pausedDurationMs = (running.totalPausedDuration ?? 0) * 1000;
                        const effectiveStartTime = toMs(running.startTime) + pausedDurationMs;
                        return running.status === 'paused' && running.pausedTime
                          ? Math.floor((toMs(running.pausedTime) - effectiveStartTime) / 1000)
                          : Math.floor((now - effectiveStartTime) / 1000);
                      })();
                    setElapsedSeconds(Math.max(0, elapsed));
                  }}
                >
                  你有进行中的任务：{running.taskName}，点击进入
                </button>
              );
            })()}
          {/* 搜索和筛选栏 */}
          <div className="filter-bar">
            <div className="search-box">
              <input
                type="text"
                placeholder={hideExecutionUi ? '搜索模版名称或描述...' : '搜索任务名称或描述...'}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-actions">
              <div className="type-filter">
                <select
                  className="filter-select"
                  value={filterType}
                  onChange={(e) => handleFilterChange(e.target.value as 'all' | 'preset' | 'custom')}
                >
                  <option value="all">全部</option>
                  <option value="preset">预设</option>
                  <option value="custom">自定义</option>
                </select>
              </div>
            {!suppressAddButton && (
              <button
                className="add-task-btn"
                onClick={() => {
                  // 在 /templates 列表页中，保持原有“新增模版”跳转到列表新增页面的行为
                  if (variant === 'full' && hideExecutionUi) {
                    navigate('/templates/new');
                    return;
                  }
                  setShowAddTaskDialog(true);
                }}
                title="新增模版"
              >
                ➕ 新增模版
              </button>
            )}
          </div>
          </div>

          {/* 统计信息和分页 */}
          {filteredTemplates.length > 0 && (
            <div className="filter-summary">
              <span>共 {taskTemplatesTotal} 个任务，第 {page} / {totalPages} 页</span>
              <div className="pagination-controls">
                <div className="page-size-control">
                  <span>每页</span>
                  <select
                    className="filter-select page-size-select"
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                {totalPages > 1 && (
                  <div className="pagination-inline">
                    <button
                      className="pagination-btn-inline"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      title="上一页"
                    >
                      ‹
                    </button>
                    <button
                      className="pagination-btn-inline"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      title="下一页"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
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
              >
                <div style={{ flex: 1 }}>
                <h4>{template.name}</h4>
                <p>{template.description}</p>
                <div className="reward-info">积分: 1/分钟</div>
                </div>
                <button
                  type="button"
                  className="task-template-start-btn"
                  disabled={hideExecutionUi && hasOngoingElsewhere}
                  onClick={(e) => {
                    e.stopPropagation();
                    startTask(template.id);
                  }}
                  title="开始任务"
                >
                  开始
                </button>
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

          {!hideExecutionUi && (
            <button
              className="start-task-btn"
              onClick={() => startTask()}
              disabled={!selectedTemplateId || (hideExecutionUi && hasOngoingElsewhere)}
              title={hideExecutionUi && hasOngoingElsewhere ? '请先在控制台完成或取消进行中的任务' : undefined}
            >
              开始任务
            </button>
          )}
            </>
          )}
        </div>
      )}

      {!hideExecutionUi && runningTaskSection}

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
