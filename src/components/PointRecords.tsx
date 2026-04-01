import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PointRecord } from '../types';
import { UserAPI } from '../api';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../utils/pagination';
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
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [recordType, setRecordType] = useState<'all' | 'earn' | 'spend'>('all');

  useEffect(() => {
    loadRecords(page, recordType);
  }, [page, recordType, pageSize]);

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

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
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
            全部记录
          </button>
          <button
            type="button"
            className={`type-btn ${recordType === 'earn' ? 'active' : ''}`}
            onClick={() => handleTypeChange('earn')}
          >
            积分获取
          </button>
          <button
            type="button"
            className={`type-btn ${recordType === 'spend' ? 'active' : ''}`}
            onClick={() => handleTypeChange('spend')}
          >
            积分消耗
          </button>
        </div>
      </div>

      {total > 0 ? (
        <>
          <div className="records-summary">
            <span>共 {total} 条记录，第 {page} / {Math.ceil(total / pageSize)} 页</span>
            <div className="pagination-controls">
              <div className="page-size-control">
                <span>每页</span>
                <select
                  className="page-size-select"
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
              {total > pageSize && (
                <div className="pagination-inline">
                  <button
                    type="button"
                    className="pagination-btn-inline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    title="上一页"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="pagination-btn-inline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                    title="下一页"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
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
