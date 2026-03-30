import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductAPI } from '../api';
import './PageChrome.css';

const ShopNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(1);
  const [minQuantity, setMinQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      alert('请填写商品名称与描述');
      return;
    }
    if (price <= 0 || minQuantity <= 0) {
      alert('价格与最小数量须大于 0');
      return;
    }
    setSaving(true);
    try {
      const res = await ProductAPI.createProduct({
        name: name.trim(),
        description: description.trim(),
        price,
        minQuantity,
        unit: unit.trim() || undefined,
      });
      if (res.success) {
        navigate('/shop', { replace: true });
      } else {
        alert(res.error || '保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-with-chrome">
      <div className="page-chrome">
        <Link to="/shop" className="page-back">
          ← 返回商品列表
        </Link>
        <h1 className="page-title">新增商品</h1>
        <p className="page-sub">创建可兑换商品。</p>
      </div>
      <div className="page-form-card">
        <label className="page-form-label">
          商品名称
          <input value={name} onChange={(e) => setName(e.target.value)} className="page-form-input" placeholder="例如：体验卡" />
        </label>
        <label className="page-form-label">
          描述
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="page-form-textarea" rows={4} />
        </label>
        <div className="page-form-row">
          <label className="page-form-label">
            单价（积分）
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="page-form-input"
            />
          </label>
          <label className="page-form-label">
            最小数量
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={minQuantity}
              onChange={(e) => setMinQuantity(parseFloat(e.target.value) || 0)}
              className="page-form-input"
            />
          </label>
          <label className="page-form-label">
            单位（可选）
            <input value={unit} onChange={(e) => setUnit(e.target.value)} className="page-form-input" placeholder="件、g…" />
          </label>
        </div>
        <div className="page-form-actions">
          <button type="button" className="page-secondary-btn" onClick={() => navigate(-1)}>
            取消
          </button>
          <button type="button" className="page-primary-btn" disabled={saving} onClick={handleSave}>
            {saving ? '保存中…' : '保存商品'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopNewPage;
