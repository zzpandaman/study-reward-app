import React, { useCallback, useEffect, useState } from 'react';
import { getCurrentUser, PairAPI, ProductWishAPI } from '../api';
import type { PairRelationRow, ProductWishRow } from '../api/types';
import './ConsoleTodoPanel.css';

const relationTypeLabelMap: Record<string, string> = {
  COUPLE: '情侣',
  PARENT_CHILD: '亲子',
};

function relationTypeLabel(type?: string): string {
  if (!type) return '未设置';
  return relationTypeLabelMap[type] ?? type;
}

function isInviteExpired(inviteExpireTime?: number): boolean {
  if (!inviteExpireTime) return false;
  return inviteExpireTime <= Math.floor(Date.now() / 1000);
}

function formatInviteRemain(inviteExpireTime?: number): string {
  if (!inviteExpireTime) return '未返回过期时间';
  const remain = inviteExpireTime - Math.floor(Date.now() / 1000);
  if (remain <= 0) return '已过期';
  const h = Math.floor(remain / 3600);
  const m = Math.floor((remain % 3600) / 60);
  const s = remain % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} 后过期`;
}

const ConsoleTodoPanel: React.FC = () => {
  const [pendingInvite, setPendingInvite] = useState<PairRelationRow | null>(null);
  const [outboundInvite, setOutboundInvite] = useState<PairRelationRow | null>(null);
  const [wishPending, setWishPending] = useState<ProductWishRow[]>([]);
  const [wishMine, setWishMine] = useState<ProductWishRow[]>([]);
  const [wishTotal, setWishTotal] = useState(0);
  const [wishMineTotal, setWishMineTotal] = useState(0);
  const [wishModalOpen, setWishModalOpen] = useState(false);
  const [wishModalTab, setWishModalTab] = useState<'pending' | 'mine'>('pending');
  const [wishSubmitOpen, setWishSubmitOpen] = useState(false);
  const [wishForm, setWishForm] = useState({
    name: '',
    description: '',
    suggestedPrice: '10',
    minQuantity: '1',
    unit: '件',
  });

  const refresh = useCallback(async () => {
    const u = await getCurrentUser();
    const no = u.success && u.data?.userNo ? u.data.userNo : null;

    const q = await PairAPI.query(1, 30, 'PENDING');
    if (q.success && q.data) {
      const pendingList = q.data.list.filter((r) => r.status === 'PENDING' && !isInviteExpired(r.inviteExpireTime));
      const inboundByInvitee = no
        ? pendingList.find((r) => r.inviteeNo === no || r.inviteeNo === u.data?.username)
        : null;
      const outboundByInitiator = no
        ? pendingList.find((r) => r.initiatorNo === no || r.initiatorNo === u.data?.username)
        : null;

      // 兜底：后端若不返回 inviteeNo/initiatorNo，默认按“接收侧待办”展示，避免丢单
      setPendingInvite(inboundByInvitee ?? (outboundByInitiator ? null : pendingList[0] ?? null));
      setOutboundInvite(outboundByInitiator ?? null);
    } else {
      setPendingInvite(null);
      setOutboundInvite(null);
    }

    const w = await ProductWishAPI.query({
      page: 1,
      pageSize: 20,
      scope: 'PENDING_MY_APPROVAL',
      status: 'PENDING',
    });
    if (w.success && w.data) {
      setWishPending(w.data.list);
      setWishTotal(w.data.total);
    } else {
      setWishPending([]);
      setWishTotal(0);
    }

    const my = await ProductWishAPI.query({
      page: 1,
      pageSize: 20,
      scope: 'MY_SUBMISSIONS',
    });
    if (my.success && my.data) {
      setWishMine(my.data.list);
      setWishMineTotal(my.data.total);
    } else {
      setWishMine([]);
      setWishMineTotal(0);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitWish = async () => {
    const price = Number(wishForm.suggestedPrice);
    const minQty = Number(wishForm.minQuantity);
    if (!wishForm.name.trim() || !wishForm.description.trim() || Number.isNaN(price) || Number.isNaN(minQty)) {
      alert('请填写名称、描述与有效数字');
      return;
    }
    const res = await ProductWishAPI.submit({
      name: wishForm.name.trim(),
      description: wishForm.description.trim(),
      suggestedPrice: price,
      minQuantity: minQty,
      unit: wishForm.unit.trim() || undefined,
    });
    if (res.success) {
      alert('许愿已提交');
      setWishSubmitOpen(false);
      setWishForm({ name: '', description: '', suggestedPrice: '10', minQuantity: '1', unit: '件' });
      void refresh();
    }
  };

  const approveWish = async (id: number) => {
    const res = await ProductWishAPI.approve(id);
    if (res.success) {
      void refresh();
    }
  };

  const rejectWish = async (id: number) => {
    const reason = window.prompt('拒绝原因（可选）') ?? '';
    const res = await ProductWishAPI.reject(id, reason || undefined);
    if (res.success) {
      void refresh();
    }
  };

  const showPairTodo = !!pendingInvite || !!outboundInvite;
  const showWishTodo = wishTotal > 0;

  if (!showPairTodo && !showWishTodo) {
    return (
      <div className="console-todo console-todo--empty">
        <div className="console-todo__head">
          <h2 className="console-todo__title">待办</h2>
        </div>
        <p className="console-todo__muted">暂无待处理的结对邀请或许愿审批</p>
        <div className="console-todo__wish-quick">
          <div>
            <div className="console-todo__wish-label">许愿</div>
            <p className="console-todo__wish-hint">向结对伙伴发起商品许愿（需先在个人设置完成结对）</p>
          </div>
          <button type="button" className="console-todo__btn-primary" onClick={() => setWishSubmitOpen(true)}>
            提交许愿
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="console-todo">
        <div className="console-todo__head">
          <h2 className="console-todo__title">待办</h2>
        </div>
        <div className="console-todo__card">
          {pendingInvite && (
            <div className="console-todo__row">
              <div>
                <div className="console-todo__row-title">收到的结对邀请</div>
                <div className="console-todo__row-sub">
                  {pendingInvite?.initiatorNo ?? '对方'} 邀请你结对 · {relationTypeLabel(pendingInvite?.relationType)} ·{' '}
                  {formatInviteRemain(pendingInvite?.inviteExpireTime)}
                </div>
              </div>
              <div className="console-todo-wish-actions">
                <button
                  type="button"
                  className="console-todo__btn-ok"
                  onClick={async () => {
                    if (!pendingInvite?.relationNo) return;
                    const res = await PairAPI.accept(pendingInvite.relationNo);
                    if (res.success) void refresh();
                  }}
                >
                  接受
                </button>
                <button
                  type="button"
                  className="console-todo__btn-no"
                  onClick={async () => {
                    if (!pendingInvite?.relationNo) return;
                    const res = await PairAPI.reject(pendingInvite.relationNo);
                    if (res.success) void refresh();
                  }}
                >
                  拒绝
                </button>
              </div>
            </div>
          )}
          {outboundInvite && (
            <div className={`console-todo__row ${pendingInvite ? 'console-todo__row--border' : ''}`}>
              <div>
                <div className="console-todo__row-title">我发起的结对邀请</div>
                <div className="console-todo__row-sub">
                  等待 {outboundInvite.inviteeNo ?? outboundInvite.partnerUserNo ?? '对方'} 处理 ·{' '}
                  {relationTypeLabel(outboundInvite.relationType)} · {formatInviteRemain(outboundInvite.inviteExpireTime)}
                </div>
              </div>
            </div>
          )}
          {showWishTodo && (
            <div className={`console-todo__row ${(pendingInvite || outboundInvite) ? 'console-todo__row--border' : ''}`}>
              <div>
                <div className="console-todo__row-title">商品许愿待审批</div>
                <div className="console-todo__row-sub">共 {wishTotal} 条</div>
              </div>
              <button
                type="button"
                className="console-todo__link"
                onClick={() => {
                  setWishModalTab('pending');
                  setWishModalOpen(true);
                }}
              >
                去审批
              </button>
            </div>
          )}
        </div>
        <div className="console-todo__wish-quick console-todo__wish-quick--border">
          <div>
            <div className="console-todo__wish-label">许愿</div>
            <p className="console-todo__wish-hint">向结对伙伴发起商品许愿（需先完成结对）；我发起的状态可在弹窗查看</p>
          </div>
          <button type="button" className="console-todo__btn-primary" onClick={() => setWishSubmitOpen(true)}>
            提交许愿
          </button>
        </div>
      </div>

      {wishModalOpen && (
        <div
          className="console-todo-modal-overlay"
          role="presentation"
          onClick={() => setWishModalOpen(false)}
        >
          <div
            className="console-todo-modal"
            role="dialog"
            aria-label="许愿待审批"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="console-todo-modal__hd">
              <h3>待审批许愿</h3>
              <button type="button" className="console-todo-modal__x" onClick={() => setWishModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="console-todo-modal-tabs" role="tablist" aria-label="许愿列表">
              <button
                type="button"
                role="tab"
                aria-selected={wishModalTab === 'pending'}
                className={`console-todo-modal-tab ${wishModalTab === 'pending' ? 'active' : ''}`}
                onClick={() => setWishModalTab('pending')}
              >
                待我审批（{wishTotal}）
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={wishModalTab === 'mine'}
                className={`console-todo-modal-tab ${wishModalTab === 'mine' ? 'active' : ''}`}
                onClick={() => setWishModalTab('mine')}
              >
                我发起的（{wishMineTotal}）
              </button>
            </div>
            {wishModalTab === 'pending' ? (
              <ul className="console-todo-wish-list">
                {wishPending.map((w) => (
                  <li key={w.id} className="console-todo-wish-item">
                    <div>
                      <strong>{w.name}</strong>
                      <div className="console-todo-wish-meta">
                        建议价 {w.suggestedPrice ?? '—'} · 发起人 {w.wisherNo ?? '—'}
                      </div>
                    </div>
                    <div className="console-todo-wish-actions">
                      <button type="button" className="console-todo__btn-ok" onClick={() => approveWish(w.id)}>
                        通过
                      </button>
                      <button type="button" className="console-todo__btn-no" onClick={() => rejectWish(w.id)}>
                        拒绝
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="console-todo-wish-list">
                {wishMine.map((w) => (
                  <li key={w.id} className="console-todo-wish-item">
                    <div>
                      <strong>{w.name}</strong>
                      <div className="console-todo-wish-meta">
                        状态 {w.status} · 审批人 {w.approverNo ?? '—'}
                        {w.status === 'PENDING' ? ' · 当前接口未提供发起方撤回' : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {wishSubmitOpen && (
        <div
          className="console-todo-modal-overlay"
          role="presentation"
          onClick={() => setWishSubmitOpen(false)}
        >
          <div
            className="console-todo-modal console-todo-modal--form"
            role="dialog"
            aria-label="提交许愿"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="console-todo-modal__hd">
              <h3>提交许愿</h3>
              <button type="button" className="console-todo-modal__x" onClick={() => setWishSubmitOpen(false)}>
                ✕
              </button>
            </div>
            <label className="console-todo-field">
              名称
              <input
                value={wishForm.name}
                onChange={(e) => setWishForm((f) => ({ ...f, name: e.target.value }))}
                className="console-todo-input"
              />
            </label>
            <label className="console-todo-field">
              描述
              <textarea
                value={wishForm.description}
                onChange={(e) => setWishForm((f) => ({ ...f, description: e.target.value }))}
                className="console-todo-textarea"
                rows={3}
              />
            </label>
            <div className="console-todo-field-row">
              <label className="console-todo-field">
                建议单价
                <input
                  value={wishForm.suggestedPrice}
                  onChange={(e) => setWishForm((f) => ({ ...f, suggestedPrice: e.target.value }))}
                  className="console-todo-input"
                />
              </label>
              <label className="console-todo-field">
                起订量
                <input
                  value={wishForm.minQuantity}
                  onChange={(e) => setWishForm((f) => ({ ...f, minQuantity: e.target.value }))}
                  className="console-todo-input"
                />
              </label>
              <label className="console-todo-field">
                单位
                <input
                  value={wishForm.unit}
                  onChange={(e) => setWishForm((f) => ({ ...f, unit: e.target.value }))}
                  className="console-todo-input"
                />
              </label>
            </div>
            <div className="console-todo-modal__actions">
              <button type="button" onClick={() => setWishSubmitOpen(false)}>
                取消
              </button>
              <button type="button" className="console-todo__btn-primary" onClick={() => void submitWish()}>
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsoleTodoPanel;
