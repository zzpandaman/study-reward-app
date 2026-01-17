import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { userDataStorage } from '../utils/storage';
import './Inventory.css';

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

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

      {/* 物品列表 */}
      {inventory.length === 0 ? (
        <div className="empty-inventory">
          <p>背包为空</p>
          <p className="hint">在积分商城兑换商品后，物品会显示在这里</p>
        </div>
      ) : (
        <div className="inventory-items">
          {inventory.map((item) => (
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
      )}
    </div>
  );
};

export default Inventory;
