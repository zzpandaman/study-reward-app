import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { UserAPI, TaskExecutionAPI } from '../api';
import type { PurchaseRecordResponse } from '../api/types';
import type { PointRecord, TaskExecution } from '../types';
import './PageChrome.css';

const PointRecordDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateRecord = location.state?.record as PointRecord | undefined;

  const [record, setRecord] = useState<PointRecord | null>(stateRecord ?? null);
  const [loading, setLoading] = useState(!stateRecord);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseRecordResponse | null>(null);
  const [task, setTask] = useState<TaskExecution | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (stateRecord && String(stateRecord.id) === id) {
        setRecord(stateRecord);
        setLoading(false);
        return;
      }
      if (!id) {
        setError('无效记录');
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await UserAPI.getPointRecordById(id);
      if (cancelled) return;
      const raw = res.data as unknown;
      const item =
        raw && typeof raw === 'object' && 'id' in (raw as object)
          ? (raw as PointRecord)
          : (raw as { data?: PointRecord })?.data;
      if (res.success && item) {
        setRecord(item);
        setError(null);
      } else {
        setError(res.error || '记录不存在');
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, stateRecord]);

  useEffect(() => {
    if (!record) return;
    if (!record.relatedId?.trim()) {
      setTask(null);
      setPurchase(null);
      return;
    }
    let cancelled = false;
    const loadDetail = async () => {
      try {
        if (record.type === 'earn') {
          const res = await TaskExecutionAPI.getExecutionByNo(record.relatedId!);
          const taskData =
            (res.data as { data?: TaskExecution })?.data ?? (res.data as unknown as TaskExecution);
          if (!cancelled && res.success && taskData?.taskName) {
            setTask(taskData);
          } else if (!cancelled) {
            setTask(null);
          }
        } else {
          const res = await UserAPI.getPurchaseRecordByNo(record.relatedId!);
          if (!cancelled && res.success && res.data) {
            setPurchase(res.data);
          } else if (!cancelled) {
            setPurchase(null);
          }
        }
      } catch {
        if (!cancelled) {
          setTask(null);
          setPurchase(null);
        }
      }
    };
    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [record]);

  const formatTime = (ts?: number) => (ts != null ? new Date(ts * 1000).toLocaleString('zh-CN') : '-');

  if (loading && !record) {
    return <div className="page-with-chrome">加载中…</div>;
  }

  if (!record && error) {
    return (
      <div className="page-with-chrome">
        <button type="button" className="page-back" onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <p>{error || '记录不存在'}</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-with-chrome">
        <button type="button" className="page-back" onClick={() => navigate('/points')}>
          ← 返回积分记录
        </button>
        <p>无法加载该记录</p>
      </div>
    );
  }

  const isEarn = record.type === 'earn';

  return (
    <div className="page-with-chrome point-detail-page">
      <button type="button" className="page-back" onClick={() => navigate('/points')}>
        ← 返回积分记录
      </button>

      <div className="point-detail-card">
        <header className={`point-detail-hero ${isEarn ? 'earn' : 'spend'}`}>
          <h2>{isEarn ? '获取积分' : '支出积分'}</h2>
          <p className="point-detail-amount">
            {isEarn ? '+' : ''}
            {typeof record.amount === 'number' ? record.amount.toFixed(2) : record.amount} 积分
          </p>
          <p className="point-detail-desc-text">{record.description}</p>
        </header>

        {isEarn && task && (
          <section className="point-detail-body">
            <h3>任务信息</h3>
            <p>
              <strong>{task.taskName}</strong>
            </p>
            <ul className="point-detail-meta">
              <li>开始：{formatTime(task.startTime)}</li>
              <li>结束：{formatTime(task.endTime)}</li>
              <li>实际时长：{task.actualDuration != null ? `${task.actualDuration} 分钟` : '-'}</li>
              <li>积分：{task.actualReward}</li>
            </ul>
            {task.pointsDetails && task.pointsDetails.length > 0 && (
              <div className="points-detail-list">
                {task.pointsDetails.map((item, i) => (
                  <div key={i} className="points-detail-item">
                    {item.startTime} - {item.endTime} · {item.durationMinutes ?? 0} 分钟 × {item.multiplier ?? 1} ={' '}
                    {item.points ?? 0}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {!isEarn && purchase && (
          <section className="point-detail-body">
            <h3>交易概览</h3>
            <ul className="point-detail-meta">
              <li>商品：{purchase.name}</li>
              <li>数量：{purchase.purchaseQuantity}</li>
              <li>时间：{purchase.createTime ? new Date(purchase.createTime).toLocaleString('zh-CN') : '-'}</li>
              <li>单号：{purchase.purchaseNo}</li>
            </ul>
            {purchase.description && <p className="purchase-desc-block">{purchase.description}</p>}
            <Link to="/inventory" className="page-primary-btn point-detail-to-inventory">
              前往背包查看
            </Link>
          </section>
        )}

        {isEarn && !task && !loading && (
          <p className="point-detail-muted">未加载到关联任务详情（可能仅有流水信息）。</p>
        )}
      </div>
    </div>
  );
};

export default PointRecordDetailPage;
