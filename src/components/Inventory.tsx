import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { userDataStorage } from '../utils/storage';
import './Inventory.css';

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  // 分页和搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12); // 每页12个物品

  useEffect(() => {
    loadInventory();
    // 定期更新背包显示
    const interval = setInterval(loadInventory, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadInventory = () => {
    const userData = userDataStorage.get();
    setInventory(userData.inventory);
  };

  // 筛选和分页逻辑
  const filteredInventory = inventory.filter((item) => {
    // 搜索过滤
    return !searchKeyword.trim() || 
      item.productName.toLowerCase().includes(searchKeyword.toLowerCase());
  });

  const totalPages = Math.ceil(filteredInventory.length / pageSize);
  const paginatedInventory = filteredInventory.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // 当搜索关键词改变时，重置到第一页
  useEffect(() => {
    setPage(1);
  }, [searchKeyword]);

  return (
    <div className="inventory">
      {/* 搜索栏 */}
      {inventory.length > 0 && (
        <div className="filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索物品名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      )}

      {/* 统计信息和分页 */}
      {filteredInventory.length > 0 && (
        <div className="filter-summary">
          <span>共 {filteredInventory.length} 个物品，第 {page} / {totalPages} 页</span>
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
      )}

      {/* 物品列表 */}
      {inventory.length === 0 ? (
        <div className="empty-inventory">
          <p>背包为空</p>
          <p className="hint">在积分商城兑换商品后，物品会显示在这里</p>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="empty-inventory">
          <p>没有找到符合条件的物品</p>
        </div>
      ) : (
        <>
        <div className="inventory-items">
            {paginatedInventory.map((item) => (
            <div key={item.productId} className="inventory-item">
              <div className="item-info">
                <h4>{item.productName}</h4>
                <div className="item-meta">
                  {item.unit && `单位: ${item.unit}`}
                </div>
              </div>
              <div className="item-quantity">
                数量: {item.quantity}
                {item.unit && ` ${item.unit}`}
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
};

export default Inventory;
