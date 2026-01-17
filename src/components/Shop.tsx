import React, { useState, useEffect } from 'react';
import { PointRecord, Product } from '../types';
import { userDataStorage, productStorage } from '../utils/storage';
import { UserAPI, ProductAPI } from '../api';
import './Shop.css';

const Shop: React.FC = () => {
  const [userPoints, setUserPoints] = useState(0);
  const [pointRecords, setPointRecords] = useState<PointRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number>(1);
  const [newProductMinQuantity, setNewProductMinQuantity] = useState<number>(1);
  const [newProductUnit, setNewProductUnit] = useState<string>('');

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

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductDescription.trim()) {
      alert('请输入商品名称和描述');
      return;
    }

    if (newProductPrice <= 0) {
      alert('价格必须大于0');
      return;
    }

    if (newProductMinQuantity <= 0) {
      alert('最小数量必须大于0');
      return;
    }

    try {
      const response = await ProductAPI.createProduct({
        name: newProductName.trim(),
        description: newProductDescription.trim(),
        price: newProductPrice,
        minQuantity: newProductMinQuantity,
        unit: newProductUnit.trim() || undefined,
      });

      if (response.success) {
        alert('商品添加成功！');
        loadData();
        setNewProductName('');
        setNewProductDescription('');
        setNewProductPrice(1);
        setNewProductMinQuantity(1);
        setNewProductUnit('');
        setShowAddProductDialog(false);
      } else {
        alert('添加失败：' + (response.error || '未知错误'));
      }
    } catch (error) {
      alert('添加失败：' + (error as Error).message);
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="add-product-btn"
            onClick={() => setShowAddProductDialog(true)}
            title="添加商品"
          >
            ➕ 添加商品
          </button>
          <div className="points-display">
            <span className="points-label">当前积分:</span>
            <span className="points-value">{userPoints.toFixed(2)}</span>
          </div>
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

      {/* 添加商品对话框 */}
      {showAddProductDialog && (
        <div className="modal-overlay" onClick={() => setShowAddProductDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>添加商品</h3>
            <div className="form-group">
              <label>商品名称：</label>
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="例如：黄金"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>商品描述：</label>
              <textarea
                value={newProductDescription}
                onChange={(e) => setNewProductDescription(e.target.value)}
                placeholder="例如：兑换黄金"
                className="form-textarea"
                rows={2}
              />
            </div>
            <div className="form-group">
              <label>单价（积分）：</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || 0)}
                className="form-input"
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>每minQuantity单位的价格</small>
            </div>
            <div className="form-group">
              <label>最小数量单位：</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={newProductMinQuantity}
                onChange={(e) => setNewProductMinQuantity(parseFloat(e.target.value) || 0)}
                className="form-input"
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>例如：0.1（表示0.1g）</small>
            </div>
            <div className="form-group">
              <label>单位（可选）：</label>
              <input
                type="text"
                value={newProductUnit}
                onChange={(e) => setNewProductUnit(e.target.value)}
                placeholder="例如：g、分钟"
                className="form-input"
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddProductDialog(false)}>取消</button>
              <button className="confirm-btn" onClick={handleAddProduct}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
