import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { userDataStorage, productStorage } from '../utils/storage';
import { ProductAPI, UserAPI } from '../api';
import './Shop.css';

const Shop: React.FC = () => {
  const [userPoints, setUserPoints] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number>(1);
  const [newProductMinQuantity, setNewProductMinQuantity] = useState<number>(1);
  const [newProductUnit, setNewProductUnit] = useState<string>('');
  // 分页和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'preset' | 'custom'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12); // 每页12个商品

  const loadData = () => {
    const userData = userDataStorage.get();
    // 积分支持小数显示（保留2位小数）
    setUserPoints(Math.round(userData.points * 100) / 100);
    // 加载商品列表
    setProducts(productStorage.get());
  };

  useEffect(() => {
    loadData();
    // 定期更新积分显示
    const interval = setInterval(() => {
      loadData();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？')) {
      return;
    }

    try {
      const response = await ProductAPI.deleteProduct(id);
      if (response.success) {
        alert('商品删除成功！');
        loadData();
      } else {
        alert('删除失败：' + (response.error || '未知错误'));
      }
    } catch (error) {
      alert('删除失败：' + (error as Error).message);
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

  // 筛选和分页逻辑
  const filteredProducts = products.filter((product) => {
    // 搜索过滤
    const matchesSearch = !searchKeyword.trim() || 
      product.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      product.description.toLowerCase().includes(searchKeyword.toLowerCase());
    
    // 类型过滤
    const matchesFilter = filterType === 'all' || 
      (filterType === 'preset' && product.isPreset) ||
      (filterType === 'custom' && !product.isPreset);
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleFilterChange = (type: 'all' | 'preset' | 'custom') => {
    setFilterType(type);
    setPage(1); // 切换筛选时重置到第一页
  };

  // 当搜索关键词或筛选类型改变时，重置到第一页
  useEffect(() => {
    setPage(1);
  }, [searchKeyword, filterType]);

  return (
    <div className="shop">
      {/* 搜索和筛选栏 */}
      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索商品名称或描述..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-actions">
          <div className="type-filter">
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value as 'all' | 'preset' | 'custom')}
            >
              <option value="all">全部</option>
              <option value="preset">预设</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <button
            className="add-product-btn"
            onClick={() => setShowAddProductDialog(true)}
            title="添加商品"
          >
            ➕ 添加商品
          </button>
        </div>
      </div>

      {/* 统计信息和分页 */}
      {filteredProducts.length > 0 && (
        <div className="filter-summary">
          <span>共 {filteredProducts.length} 个商品，第 {page} / {totalPages} 页</span>
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

      {/* 商品列表 */}
      {paginatedProducts.length === 0 ? (
        <div className="empty-products">
          <p>没有找到符合条件的商品</p>
        </div>
      ) : (
        <>
      <div className="exchange-section">
            {paginatedProducts.map((product) => {
        const units = quantities[product.id] || 1;
        const price = calculatePrice(product, units);
        const unit = product.unit || '';

          return (
            <div key={product.id} className="exchange-card">
              <div className="exchange-header">
                <h3>{product.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="exchange-rate">
                  {product.minQuantity ?? 1}{unit} = {product.price}积分
                  </div>
                  {!product.isPreset && (
                    <button
                      className="delete-product-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product.id);
                      }}
                      title="删除商品"
                    >
                      🗑️
                    </button>
                  )}
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
        </>
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
              <label>每次最少买：</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newProductMinQuantity}
                  onChange={(e) => setNewProductMinQuantity(parseFloat(e.target.value) || 0)}
                  className="form-input"
                  style={{ flex: '1' }}
                  placeholder="数量"
                />
                <input
                  type="text"
                  value={newProductUnit}
                  onChange={(e) => setNewProductUnit(e.target.value)}
                  placeholder="单位（如：g、分钟）"
                  className="form-input"
                  style={{ flex: '1', maxWidth: '120px' }}
                />
              </div>
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                例如：输入 1 和 g，表示每次最少买 1g
              </small>
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
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                每次最少买的数量对应的积分价格
              </small>
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
