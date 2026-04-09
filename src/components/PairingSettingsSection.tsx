import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, PairAPI } from '../api';
import type { CurrentPairData, PairRelationRow } from '../api/types';
import './PairingSettingsSection.css';

const relationTypeLabelMap: Record<string, string> = {
  COUPLE: '情侣',
  PARENT_CHILD: '亲子',
};

function relationTypeLabel(type?: string): string {
  if (!type) return '未设置';
  return relationTypeLabelMap[type] ?? type;
}

const PairingSettingsSection: React.FC = () => {
  const navigate = useNavigate();
  const [userNo, setUserNo] = useState<string | null>(null);
  const [current, setCurrent] = useState<CurrentPairData | null | undefined>(undefined);
  const [pendingInbound, setPendingInbound] = useState<PairRelationRow | null>(null);
  const [pendingOutbound, setPendingOutbound] = useState<PairRelationRow | null>(null);
  const [inviteeUserNo, setInviteeUserNo] = useState('');
  const [relationType, setRelationType] = useState<'COUPLE' | 'PARENT_CHILD'>('COUPLE');
  const [busy, setBusy] = useState(false);

  const isInviteExpired = (inviteExpireTime?: number) => {
    if (!inviteExpireTime) return false;
    return inviteExpireTime <= Math.floor(Date.now() / 1000);
  };

  const refresh = useCallback(async () => {
    const u = await getCurrentUser();
    const no = u.success && u.data?.userNo ? u.data.userNo : null;
    setUserNo(no);

    const cur = await PairAPI.getCurrent();
    if (cur.success) {
      setCurrent(cur.data ?? null);
    } else {
      setCurrent(null);
    }

    const q = await PairAPI.query(1, 30, 'PENDING');
    if (q.success && q.data && no) {
      const pend = q.data.list.filter((r) => r.status === 'PENDING' && !isInviteExpired(r.inviteExpireTime));
      const inbound = pend.find((r) => r.inviteeNo === no || r.inviteeNo === u.data?.username);
      const outbound = pend.find(
        (r) =>
          (r.initiatorNo === no || r.initiatorNo === u.data?.username) && r.relationNo !== inbound?.relationNo
      );
      setPendingInbound(inbound ?? null);
      setPendingOutbound(inbound ? null : outbound ?? null);
    } else {
      setPendingInbound(null);
      setPendingOutbound(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const doInvite = async () => {
    if (!inviteeUserNo.trim()) {
      alert('请输入对方账号');
      return;
    }
    setBusy(true);
    try {
      const res = await PairAPI.invite(inviteeUserNo.trim(), relationType);
      if (res.success) {
        alert('邀请已发送');
        setInviteeUserNo('');
        void refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const doUnbind = async (relationNo: string) => {
    if (!confirm('确定解除结对？')) return;
    setBusy(true);
    try {
      const res = await PairAPI.unbind(relationNo);
      if (res.success) {
        void refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  if (current === undefined) {
    return (
      <section className="pairing-section">
        <h3 className="pairing-section__title">结对学习</h3>
        <p className="pairing-section__muted">加载中…</p>
      </section>
    );
  }

  const isActive = current?.status === 'ACTIVE';
  const isPendingFromCurrent = current?.status === 'PENDING';
  const hasPending = !!pendingInbound || !!pendingOutbound || isPendingFromCurrent;
  const pendingDisplayName =
    pendingInbound?.initiatorNo ??
    pendingOutbound?.inviteeNo ??
    current?.partnerUserNo ??
    '对方';
  const activeDisplayName = current?.partnerUserNo ?? '伙伴';

  return (
    <section className="pairing-section">
      <div className="pairing-section__head">
        <h3 className="pairing-section__title">结对学习</h3>
        <button type="button" className="pairing-section__refresh" onClick={() => void refresh()} disabled={busy}>
          刷新
        </button>
      </div>

      {isActive && (
        <div className="pairing-section__card pairing-section__card--active">
          <div className="pairing-section__status">
            <span className="pairing-section__status-pill pairing-section__status-pill--active">已结对</span>
          </div>
          <p>
            已与 <strong>{activeDisplayName}</strong> 绑定
            {current.relationType ? ` · ${relationTypeLabel(current.relationType)}` : ''}
          </p>
          <button
            type="button"
            className="pairing-section__btn-danger"
            onClick={() => current.relationNo && void doUnbind(current.relationNo)}
            disabled={busy || !current.relationNo}
          >
            解除结对
          </button>
        </div>
      )}

      {!isActive && hasPending && (
        <div className="pairing-section__card pairing-section__card--pending">
          <div className="pairing-section__status">
            <span className="pairing-section__status-pill pairing-section__status-pill--pending">进行中</span>
          </div>
          <p>
            {pendingInbound ? '你收到来自' : '你与'} <strong>{pendingDisplayName}</strong>{' '}
            {pendingInbound ? '的结对邀请，等待你审批。' : '的结对流程仍在进行中。'}
          </p>
          <div className="pairing-section__row">
            <button type="button" className="pairing-section__btn-primary" onClick={() => navigate('/console')}>
              去控制台待办
            </button>
          </div>
        </div>
      )}

      {!isActive && !hasPending && (
        <div className="pairing-section__card">
          <p className="pairing-section__muted">当前为单人模式。存在进行中的邀请或已绑定结对时，不可重复发起。</p>
          <label className="pairing-field">
            对方账号
            <input
              value={inviteeUserNo}
              onChange={(e) => setInviteeUserNo(e.target.value)}
              placeholder="userNo"
              className="pairing-input"
            />
          </label>
          <label className="pairing-field">
            关系类型
            <select
              value={relationType}
              onChange={(e) => setRelationType(e.target.value as 'COUPLE' | 'PARENT_CHILD')}
              className="pairing-input"
            >
              <option value="COUPLE">情侣</option>
              <option value="PARENT_CHILD">亲子</option>
            </select>
          </label>
          <button type="button" className="pairing-section__btn-primary" onClick={() => void doInvite()} disabled={busy}>
            发送邀请
          </button>
        </div>
      )}

      {userNo && (
        <p className="pairing-section__foot">当前账号：{userNo}</p>
      )}
    </section>
  );
};

export default PairingSettingsSection;
