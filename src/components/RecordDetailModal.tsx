import React, { useState, useEffect } from 'react';
import { PointRecord } from '../types';
import { UserAPI, TaskExecutionAPI } from '../api';
import type { PurchaseRecordResponse } from '../api/types';
import type { TaskExecution } from '../types';
import './RecordDetailModal.css';

interface RecordDetailModalProps {
  record: PointRecord;
  onClose: () => void;
}

const RecordDetailModal: React.FC<RecordDetailModalProps> = ({ record, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseRecordResponse | null>(null);
  const [task, setTask] = useState<TaskExecution | null>(null);

  useEffect(() => {
    if (!record.relatedId?.trim()) {
      setError('无关联详情');
      setLoading(false);
      return;
    }
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      setPurchase(null);
      setTask(null);
      try {
        if (record.type === 'earn') {
          const res = await TaskExecutionAPI.getExecutionByNo(record.relatedId!);
          const taskData = (res.data as { data?: TaskExecution })?.data ?? (res.data as unknown as TaskExecution);
          if (res.success && taskData?.taskName) {
            setTask(taskData);
          } else {
            setError('记录不存在或已删除');
          }
        } else {
          const res = await UserAPI.getPurchaseRecordByNo(record.relatedId!);
          if (res.success && res.data) {
            setPurchase(res.data);
          } else {
            setError('记录不存在或已删除');
          }
        }
      } catch {
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [record.relatedId, record.type]);

  const formatTime = (ts?: number) =>
    ts != null ? new Date(ts * 1000).toLocaleString('zh-CN') : '-';

  return (
    <div className="record-detail-overlay" onClick={onClose}>
      <div className="record-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="record-detail-header">
          <h3>积分记录详情</h3>
          <button type="button" className="record-detail-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="record-detail-body">
          {loading && <div className="record-detail-loading">加载中...</div>}
          {error && <div className="record-detail-error">{error}</div>}
          {!loading && !error && task && (
            <div className="record-detail-task">
              <div className="detail-section">
                <h4>{task.taskName}</h4>
                <div className="detail-row">
                  <span>状态</span>
                  <span>{task.status === 'completed' ? '已完成' : task.status === 'paused' ? '已暂停' : '进行中'}</span>
                </div>
                <div className="detail-row">
                  <span>开始时间</span>
                  <span>{formatTime(task.startTime)}</span>
                </div>
                <div className="detail-row">
                  <span>结束时间</span>
                  <span>{formatTime(task.endTime)}</span>
                </div>
                <div className="detail-row">
                  <span>实际时长</span>
                  <span>{task.actualDuration != null ? `${task.actualDuration} 分钟` : '-'}</span>
                </div>
              </div>
              <div className="detail-section">
                <h4>积分计算</h4>
                {task.pointsDetails && task.pointsDetails.length > 0 ? (
                  <>
                    {task.pointsDetails.map((item, i) => (
                      <div key={i} className="points-detail-item">
                        {item.startTime} - {item.endTime} 持续 {item.durationMinutes ?? 0} 分钟
                        × 倍数 {item.multiplier ?? 1} = {item.points ?? 0} 积分
                      </div>
                    ))}
                    <div className="points-summary">
                      合计 = {task.actualReward} 积分
                    </div>
                  </>
                ) : (
                  <div className="points-summary">积分已汇总：{task.actualReward} 积分</div>
                )}
              </div>
            </div>
          )}
          {!loading && !error && purchase && (
            <div className="record-detail-purchase">
              <div className="detail-section">
                <h4>{purchase.name}</h4>
                {purchase.description && (
                  <p className="detail-desc">{purchase.description}</p>
                )}
                <div className="detail-row">
                  <span>购买数量</span>
                  <span>{purchase.purchaseQuantity} {purchase.minUnit || '单位'}</span>
                </div>
                <div className="detail-row">
                  <span>购买时间</span>
                  <span>{purchase.createTime ? new Date(purchase.createTime).toLocaleString('zh-CN') : '-'}</span>
                </div>
              </div>
              <div className="detail-section">
                <h4>积分计算</h4>
                <div className="points-formula">
                  单价 {purchase.price} 积分/{purchase.minQuantity}{purchase.minUnit || ''}
                  {' × '}
                  购买 {purchase.purchaseQuantity}{purchase.minUnit || ''}
                  {' = '}
                  {purchase.price * (purchase.purchaseQuantity / purchase.minQuantity)} 积分
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordDetailModal;
