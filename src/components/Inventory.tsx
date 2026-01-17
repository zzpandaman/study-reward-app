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

  // 统计黄金总量（以g为单位）
  const getGoldTotal = (): number => {
    const goldItem = inventory.find((item) => item.productName === '黄金');
    return goldItem ? goldItem.quantity : 0;
  };

  // 统计玩手机时长（以分钟为单位）
  const getPhoneTime = (): number => {
    const phoneItem = inventory.find((item) => item.productName.includes('玩手机'));
    return phoneItem ? phoneItem.quantity : 0;
  };

  const goldTotal = getGoldTotal();
  const phoneTime = getPhoneTime();

  return (
    <div className="inventory">
      <h2>背包</h2>

      {/* 统计总览 */}
      <div className="inventory-summary">
        <div className="summary-item">
          <div className="summary-label">总黄金</div>
          <div className="summary-value">{goldTotal.toFixed(2)} g</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">玩手机时长</div>
          <div className="summary-value">{phoneTime} 分钟</div>
        </div>
      </div>

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

      {/* 统计信息 */}
      {filteredInventory.length > 0 && (
        <div className="filter-summary">
          共 {filteredInventory.length} 个物品，当前显示 {paginatedInventory.length} 个
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
        </>
      )}
    </div>
  );
};

export default Inventory;
