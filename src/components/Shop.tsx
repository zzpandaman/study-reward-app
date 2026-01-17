import React, { useState, useEffect } from 'react';
import { PointRecord } from '../types';
import { userDataStorage } from '../utils/storage';
import './Shop.css';

const Shop: React.FC = () => {
  const [userPoints, setUserPoints] = useState(0);
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([]);
  
  // 玩手机兑换（整数分钟）
  const [phoneUnits, setPhoneUnits] = useState<number>(1);
  const [phonePrice, setPhonePrice] = useState<number>(1);
  
  // 黄金兑换（整数个0.01g）
  const [goldUnits, setGoldUnits] = useState<number>(1);
  const [goldPrice, setGoldPrice] = useState<number>(5);

  useEffect(() => {
    loadData();
    // 定期更新积分显示
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 计算玩手机所需积分（1积分/分钟）
    const units = Math.max(1, Math.floor(phoneUnits) || 1);
    setPhonePrice(units);
  }, [phoneUnits]);

  useEffect(() => {
    // 计算黄金所需积分（1个0.01g = 4.8积分，四舍五入为5积分）
    // 实际上：1g = 480积分，所以0.01g = 4.8积分
    const units = Math.max(1, Math.floor(goldUnits) || 1);
    const price = Math.round(units * 4.8); // 每个0.01g单位 = 4.8积分，四舍五入
    setGoldPrice(price);
  }, [goldUnits]);

  const loadData = () => {
    const userData = userDataStorage.get();
    setUserPoints(userData.points);
    // 只显示消耗记录
    setPointRecords(userData.pointRecords.filter((r) => r.type === 'spend'));
  };

  const exchangePhone = () => {
    const units = Math.max(1, Math.floor(phoneUnits) || 1);
    const price = units;

    if (userPoints < price) {
      alert(`积分不足！当前积分: ${userPoints}，需要: ${price}`);
      return;
    }

    // 添加到背包
    userDataStorage.addInventoryItem('phone', '玩手机', units, '分钟');

    // 添加积分消耗记录
    userDataStorage.addPointRecord({
      id: Date.now().toString(),
      type: 'spend',
      amount: price,
      description: `兑换玩手机: ${units}分钟`,
      timestamp: Date.now(),
      relatedId: 'phone',
    });

    loadData();
    setPhoneUnits(1);
    alert(`兑换成功！您获得了 ${units} 分钟玩手机时长`);
  };

  const exchangeGold = () => {
    const units = Math.max(1, Math.floor(goldUnits) || 1);
    const grams = units * 0.01; // 转换为克数
    const price = Math.round(units * 4.8);

    if (userPoints < price) {
      alert(`积分不足！当前积分: ${userPoints}，需要: ${price}`);
      return;
    }

    // 添加到背包
    userDataStorage.addInventoryItem('gold', '黄金', grams, 'g');

    // 添加积分消耗记录
    userDataStorage.addPointRecord({
      id: Date.now().toString(),
      type: 'spend',
      amount: price,
      description: `兑换黄金: ${grams.toFixed(2)}g`,
      timestamp: Date.now(),
      relatedId: 'gold',
    });

    loadData();
    setGoldUnits(1);
    alert(`兑换成功！您获得了 ${grams.toFixed(2)}g 黄金`);
  };

  return (
    <div className="shop">
      <div className="shop-header">
        <h2>积分商城</h2>
        <div className="points-display">
          <span className="points-label">当前积分:</span>
          <span className="points-value">{userPoints}</span>
        </div>
      </div>

      {/* 自由兑换区域 */}
      <div className="exchange-section">
        {/* 玩手机兑换 */}
        <div className="exchange-card">
          <div className="exchange-header">
            <h3>📱 兑换玩手机时长</h3>
            <div className="exchange-rate">1分钟学习 = 1分钟玩手机（比例1:1）</div>
          </div>
          <div className="exchange-form">
            <div className="form-group">
              <label>
                兑换时长（分钟）:
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={phoneUnits}
                onChange={(e) => setPhoneUnits(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="price-info">
              <span className="price-label">所需积分:</span>
              <span className={`price-value ${userPoints < phonePrice ? 'insufficient' : ''}`}>
                {phonePrice}
              </span>
            </div>
            <button
              className={`exchange-btn ${userPoints >= phonePrice ? 'enabled' : 'disabled'}`}
              onClick={exchangePhone}
              disabled={userPoints < phonePrice || phoneUnits < 1}
            >
              {userPoints >= phonePrice ? '立即兑换' : '积分不足'}
            </button>
          </div>
        </div>

        {/* 黄金兑换 */}
        <div className="exchange-card">
          <div className="exchange-header">
            <h3>🥇 兑换黄金</h3>
            <div className="exchange-rate">1g黄金 = 480积分（8小时学习）</div>
          </div>
          <div className="exchange-form">
            <div className="form-group">
              <label>
                兑换数量（个0.01g）:
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={goldUnits}
                onChange={(e) => setGoldUnits(parseInt(e.target.value) || 1)}
              />
              <div className="input-hint">
                输入1表示0.01g，输入100表示1g
              </div>
            </div>
            <div className="gold-preview">
              实际重量: {(goldUnits * 0.01).toFixed(2)}g
            </div>
            <div className="price-info">
              <span className="price-label">所需积分:</span>
              <span className={`price-value ${userPoints < goldPrice ? 'insufficient' : ''}`}>
                {goldPrice}
              </span>
            </div>
            <button
              className={`exchange-btn ${userPoints >= goldPrice ? 'enabled' : 'disabled'}`}
              onClick={exchangeGold}
              disabled={userPoints < goldPrice || goldUnits < 1}
            >
              {userPoints >= goldPrice ? '立即兑换' : '积分不足'}
            </button>
          </div>
        </div>
      </div>

      {/* 积分消耗记录 */}
      {pointRecords.length > 0 && (
        <div className="purchase-history">
          <h3>兑换记录</h3>
          <div className="history-list">
            {pointRecords.slice(0, 20).map((record) => (
              <div key={record.id} className="history-item">
                <div className="history-info">
                  <h4>{record.description}</h4>
                  <div className="history-meta">
                    {new Date(record.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="history-amount spend">-{record.amount} 积分</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
