import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TaskTemplateAPI } from '../api';
import './PageChrome.css';

const TemplatesNewPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      alert('请填写模版名称与描述');
      return;
    }
    setSaving(true);
    try {
      const res = await TaskTemplateAPI.createTaskTemplate({
        name: name.trim(),
        description: description.trim(),
      });
      if (res.success) {
        navigate('/templates', { replace: true });
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
        <Link to="/templates" className="page-back">
          ← 返回积分模版列表
        </Link>
        <h1 className="page-title">新增积分模版</h1>
        <p className="page-sub">创建一个任务模板（名称与描述将用于列表展示）。</p>
      </div>
      <div className="page-form-card">
        <label className="page-form-label">
          模版名称
          <input value={name} onChange={(e) => setName(e.target.value)} className="page-form-input" placeholder="例如：深度思考时间" />
        </label>
        <label className="page-form-label">
          模版描述
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="page-form-textarea" rows={5} placeholder="使用场景与说明…" />
        </label>
        <div className="page-form-actions">
          <button type="button" className="page-secondary-btn" onClick={() => navigate(-1)}>
            取消
          </button>
          <button type="button" className="page-primary-btn" disabled={saving} onClick={handleSave}>
            {saving ? '保存中…' : '保存模版'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesNewPage;
