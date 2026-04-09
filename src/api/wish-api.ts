/**
 * 商品许愿 API（star-reward /api/reward/product-wishes/*）
 */
import ApiClientFactory from './client';
import type { ApiResponse } from './types';
import type { ProductWishRow } from './types';

type PagePayload = {
  data?: ProductWishRow[];
  total?: number;
  records?: ProductWishRow[];
};

function unwrapList(raw: unknown): { list: ProductWishRow[]; total: number } {
  if (!raw || typeof raw !== 'object') return { list: [], total: 0 };
  const o = raw as PagePayload;
  const list = o.data ?? o.records ?? [];
  const total = o.total ?? list.length;
  return { list: Array.isArray(list) ? list : [], total };
}

export interface SubmitWishBody {
  name: string;
  description: string;
  suggestedPrice: number;
  minQuantity: number;
  unit?: string;
}

export class ProductWishAPI {
  static async submit(body: SubmitWishBody): Promise<ApiResponse<ProductWishRow>> {
    const client = ApiClientFactory.getClient();
    return client.post<ProductWishRow>('/api/product-wishes/submit', body);
  }

  static async query(params: {
    page?: number;
    pageSize?: number;
    scope: 'MY_SUBMISSIONS' | 'PENDING_MY_APPROVAL';
    status?: string;
  }): Promise<ApiResponse<{ list: ProductWishRow[]; total: number }>> {
    const client = ApiClientFactory.getClient();
    const res = await client.post<PagePayload>('/api/product-wishes/query', {
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      scope: params.scope,
      status: params.status,
    });
    if (!res.success || res.data == null) {
      return { success: false, error: res.error, message: res.message };
    }
    const { list, total } = unwrapList(res.data);
    return { success: true, data: { list, total } };
  }

  static async approve(
    wishId: number,
    overrides?: { price?: number; minQuantity?: number; unit?: string }
  ): Promise<ApiResponse<ProductWishRow>> {
    const client = ApiClientFactory.getClient();
    return client.post<ProductWishRow>('/api/product-wishes/approve', {
      wishId,
      ...overrides,
    });
  }

  static async reject(wishId: number, reason?: string): Promise<ApiResponse<ProductWishRow>> {
    const client = ApiClientFactory.getClient();
    return client.post<ProductWishRow>('/api/product-wishes/reject', { wishId, reason });
  }
}
