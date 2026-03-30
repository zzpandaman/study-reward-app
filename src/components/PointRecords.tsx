import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PointRecord } from '../types';
import { UserAPI } from '../api';
import './PointRecords.css';

const formatRecordTime = (record: PointRecord): string => {
  if (record.createTime) return new Date(record.createTime).toLocaleString('zh-CN');
  if (record.timestamp != null) return new Date(record.timestamp * 1000).toLocaleString('zh-CN');
  return '-';
};

interface PointRecordsProps {
  variant?: 'page' | 'embedded';
}

const PointRecords: React.FC<PointRecordsProps> = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<PointRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [recordType, setRecordType] = useState<'all' | 'earn' | 'spend'>('all');

  useEffect(() => {
    loadRecords(page, recordType);
  }, [page, recordType]);

  const loadRecords = async (currentPage: number = 1, type: 'all' | 'earn' | 'spend' = 'all') => {
    try {
      const apiType = type === 'all' ? undefined : type;
      const response = await UserAPI.getPointRecords(apiType, currentPage, pageSize);
      if (response.success && response.data) {
        setRecords(response.data.data || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to load point records:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= Math.ceil(total / pageSize)) {
      setPage(newPage);
    }
  };

  const handleTypeChange = (type: 'all' | 'earn' | 'spend') => {
    setRecordType(type);
    setPage(1);
  };

  const handleRecordClick = (record: PointRecord) => {
    navigate(`/points/${encodeURIComponent(String(record.id))}`, { state: { record } });
  };

  return (
    <div className="point-records">
      <div className="point-records-header">
        <div className="type-filter">
          <button
            type="button"
            className={`type-btn ${recordType === 'all' ? 'active' : ''}`}
            onClick={() => handleTypeChange('all')}
          >
            全部
          </button>
          <button
            type="button"
            className={`type-btn ${recordType === 'earn' ? 'active' : ''}`}
            onClick={() => handleTypeChange('earn')}
          >
            获取
          </button>
          <button
            type="button"
            className={`type-btn ${recordType === 'spend' ? 'active' : ''}`}
            onClick={() => handleTypeChange('spend')}
          >
            消耗
          </button>
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="records-summary">
            共 {total} 条记录，当前显示 {records.length} 条
          </div>
          <div className="records-list">
            {records.map((record) => (
              <div
                key={record.id}
                className={`record-item ${record.type} clickable`}
                onClick={() => handleRecordClick(record)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRecordClick(record);
                  }
                }}
              >
                <div className="record-info">
                  <h4>{record.description}</h4>
                  <div className="record-meta">{formatRecordTime(record)}</div>
                </div>
                <div className={`record-amount ${record.type} ${record.amount === 0 ? 'zero' : ''}`}>
                  {record.amount === 0 ? (
                    <span className="zero-amount">未完成，无积分</span>
                  ) : (
                    <>
                      {record.type === 'earn' ? '+' : '-'}
                      {typeof record.amount === 'number' ? record.amount.toFixed(2) : record.amount} 积分
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {total > pageSize && (
            <div className="pagination">
              <button type="button" className="pagination-btn" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>
                上一页
              </button>
              <span className="pagination-info">
                第 {page} / {Math.ceil(total / pageSize)} 页
              </span>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-records">
          <p>暂无积分记录</p>
        </div>
      )}
    </div>
  );
};

export default PointRecords;
