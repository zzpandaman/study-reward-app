/**
 * 结对关系 API（star-reward /api/reward/pairs/*）
 */
import ApiClientFactory from './client';
import type { ApiResponse, CurrentPairData, PairRelationRow } from './types';

type PagePayload = {
  data?: PairRelationRow[];
  total?: number;
  records?: PairRelationRow[];
};

function unwrapList(raw: unknown): { list: PairRelationRow[]; total: number } {
  if (!raw || typeof raw !== 'object') return { list: [], total: 0 };
  const o = raw as PagePayload;
  const list = o.data ?? o.records ?? [];
  const total = o.total ?? list.length;
  return { list: Array.isArray(list) ? list : [], total };
}

export class PairAPI {
  static async getCurrent(): Promise<ApiResponse<CurrentPairData | null>> {
    const client = ApiClientFactory.getClient();
    const res = await client.get<CurrentPairData | null>('/api/pairs/current');
    if (!res.success) return res;
    const d = res.data as CurrentPairData | null | undefined;
    return { ...res, data: d ?? null };
  }

  static async query(
    page: number = 1,
    pageSize: number = 20,
    status: string = 'ALL'
  ): Promise<ApiResponse<{ list: PairRelationRow[]; total: number }>> {
    const client = ApiClientFactory.getClient();
    const res = await client.post<PagePayload>('/api/pairs/query', { page, pageSize, status });
    if (!res.success || res.data == null) {
      return { success: false, error: res.error, message: res.message };
    }
    const { list, total } = unwrapList(res.data);
    return { success: true, data: { list, total } };
  }

  static async invite(inviteeUserNo: string, relationType: string): Promise<ApiResponse<CurrentPairData>> {
    const client = ApiClientFactory.getClient();
    return client.post<CurrentPairData>('/api/pairs/invite', { inviteeUserNo, relationType });
  }

  static async accept(relationNo: string): Promise<ApiResponse<CurrentPairData>> {
    const client = ApiClientFactory.getClient();
    return client.post<CurrentPairData>('/api/pairs/accept', { relationNo });
  }

  static async reject(relationNo: string): Promise<ApiResponse<CurrentPairData>> {
    const client = ApiClientFactory.getClient();
    return client.post<CurrentPairData>('/api/pairs/reject', { relationNo });
  }

  static async unbind(relationNo: string): Promise<ApiResponse<CurrentPairData>> {
    const client = ApiClientFactory.getClient();
    return client.post<CurrentPairData>('/api/pairs/unbind', { relationNo });
  }
}
