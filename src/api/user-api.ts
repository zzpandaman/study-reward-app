/**
 * 用户数据相关API
 * 通过客户端调用，支持本地模式和HTTP模式无缝切换
 */
import {
  GetUserDataResponse,
  GetPointsResponse,
  GetPointRecordsResponse,
  GetInventoryResponse,
  ExchangeRequest,
  ExchangeResponse,
  PurchaseRecordResponse,
  ApiResponse,
  PointWalletRow,
} from './types';
import type { PointRecord } from '../types';
import ApiClientFactory from './client';

/**
 * 用户数据API
 */
export class UserAPI {
  /**
   * GET /api/user/data
   * 获取用户数据
   */
  static async getUserData(): Promise<ApiResponse<GetUserDataResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<GetUserDataResponse>('/api/user/data');
  }

  /**
   * POST /api/user/points
   * 获取用户积分（body: {}）
   */
  static async getPoints(): Promise<ApiResponse<GetPointsResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<GetPointsResponse>('/api/user/points', {});
  }

  /**
   * GET /api/reward/point-records/{id}
   * 单条积分记录（详情页）
   */
  static async getPointRecordById(id: string | number): Promise<ApiResponse<PointRecord>> {
    const client = ApiClientFactory.getClient();
    return client.get<PointRecord>(`/api/point-records/${encodeURIComponent(String(id))}`);
  }

  /**
   * POST /api/reward/point-records/query
   * 获取积分记录（支持分页）
   */
  static async getPointRecords(type?: 'earn' | 'spend', page: number = 1, pageSize: number = 10): Promise<ApiResponse<GetPointRecordsResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<GetPointRecordsResponse>('/api/point-records/query', {
      type,
      page,
      pageSize,
    });
  }

  /**
   * POST /api/user/inventory
   * 获取背包物品（body: {}）
   */
  static async getInventory(): Promise<ApiResponse<GetInventoryResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<GetInventoryResponse>('/api/user/inventory', {});
  }

  /**
   * GET /api/reward/purchase-record/by-no/{purchaseNo}
   * 根据购买编号获取购买记录详情
   */
  static async getPurchaseRecordByNo(purchaseNo: string): Promise<ApiResponse<PurchaseRecordResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<PurchaseRecordResponse>(`/api/purchase-record/by-no/${purchaseNo}`);
  }

  /**
   * POST /api/reward/purchase-record/exchange
   * 兑换商品
   */
  static async exchange(request: ExchangeRequest): Promise<ApiResponse<ExchangeResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<ExchangeResponse>('/api/purchase-record/exchange', request);
  }

  /**
   * GET /api/users/point-wallets
   * 按发布人维度的积分钱包列表
   */
  static async getPointWallets(): Promise<ApiResponse<PointWalletRow[]>> {
    const client = ApiClientFactory.getClient();
    const res = await client.get<PointWalletRow[] | { data?: PointWalletRow[] }>('/api/users/point-wallets');
    if (!res.success) return res as ApiResponse<PointWalletRow[]>;
    const raw = res.data as PointWalletRow[] | { data?: PointWalletRow[] } | undefined;
    const list = Array.isArray(raw) ? raw : raw?.data;
    return { ...res, data: Array.isArray(list) ? list : [] };
  }
}
