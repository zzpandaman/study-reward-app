import React, { useState, useEffect } from 'react';
import { PointRecord, Product } from '../types';
import { userDataStorage, productStorage } from '../utils/storage';
import { UserAPI } from '../api';
import './Shop.css';

const Shop: React.FC = () => {
  const [userPoints, setUserPoints] = useState(0);
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
    // 定期更新积分显示
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const userData = userDataStorage.get();
    // 积分支持小数显示（保留2位小数）
    setUserPoints(Math.round(userData.points * 100) / 100);
    // 只显示消耗记录
    setPointRecords(userData.pointRecords.filter((r) => r.type === 'spend'));
    // 加载商品列表
    setProducts(productStorage.get());
  };

  // 初始化数量为1
  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    products.forEach((product) => {
      if (quantities[product.id] === undefined) {
        initialQuantities[product.id] = 1;
      } else {
        initialQuantities[product.id] = quantities[product.id];
      }
    });
    setQuantities(initialQuantities);
  }, [products]);

  // 计算商品所需积分
  const calculatePrice = (product: Product, units: number): number => {
    return product.price * units;
  };

  // 计算商品实际数量
  const calculateActualQuantity = (product: Product, units: number): number => {
    return units * (product.minQuantity ?? 1);
  };

  // 格式化数量显示
  const formatQuantity = (product: Product, units: number): string => {
    const actualQuantity = calculateActualQuantity(product, units);
    const unit = product.unit || '';
    if (unit === 'g') {
      return `${actualQuantity.toFixed(2)}${unit}`;
    }
    return `${actualQuantity}${unit}`;
  };

  // 兑换商品
  const exchangeProduct = async (product: Product) => {
    const units = quantities[product.id] || 1;
    const price = calculatePrice(product, units);

    if (userPoints < price) {
      alert(`积分不足！当前积分: ${userPoints.toFixed(2)}，需要: ${price.toFixed(2)}`);
      return;
    }

    try {
      const response = await UserAPI.exchange({
        productId: product.id,
        quantity: units,
      });

      if (response.success) {
        alert(`兑换成功！您获得了 ${formatQuantity(product, units)}`);
        loadData();
        // 重置数量为1
        setQuantities({ ...quantities, [product.id]: 1 });
      } else {
        alert(response.error || '兑换失败');
      }
    } catch (error) {
      alert('兑换失败：' + (error as Error).message);
    }
  };

  return (
    <div className="shop">
      <div className="shop-header">
        <h2>积分商城</h2>
        <div className="points-display">
          <span className="points-label">当前积分:</span>
          <span className="points-value">{userPoints.toFixed(2)}</span>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="exchange-section">
      {products.map((product) => {
        const units = quantities[product.id] || 1;
        const price = calculatePrice(product, units);
        const unit = product.unit || '';

          return (
            <div key={product.id} className="exchange-card">
              <div className="exchange-header">
                <h3>{product.name}</h3>
                <div className="exchange-rate">
                  {product.minQuantity ?? 1}{unit} = {product.price}积分
                </div>
              </div>
              <div className="exchange-form">
                <div className="form-group">
                  <label>
                    兑换数量（单位数）:
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={units}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setQuantities({ ...quantities, [product.id]: 0 });
                      } else {
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num >= 0) {
                          setQuantities({ ...quantities, [product.id]: num });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val < 1) {
                        setQuantities({ ...quantities, [product.id]: 1 });
                      }
                    }}
                  />
                  <div className="input-hint">
                    输入{units}表示{formatQuantity(product, units)}
                  </div>
                </div>
                <div className="quantity-preview">
                  实际数量: {formatQuantity(product, units)}
                </div>
                <div className="price-info">
                  <span className="price-label">所需积分:</span>
                  <span className={`price-value ${userPoints < price ? 'insufficient' : ''}`}>
                    {price.toFixed(2)}
                  </span>
                </div>
                <button
                  className={`exchange-btn ${userPoints >= price ? 'enabled' : 'disabled'}`}
                  onClick={() => exchangeProduct(product)}
                  disabled={userPoints < price || units < 1}
                >
                  {userPoints >= price ? '立即兑换' : '积分不足'}
                </button>
              </div>
            </div>
          );
        })}
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
                <div className="history-amount spend">
                  -{typeof record.amount === 'number' ? record.amount.toFixed(2) : record.amount} 积分
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
