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
  UpdateCustomStyleRequest,
  UpdateCustomStyleResponse,
  ApiResponse,
} from './types';
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
   * GET /api/user/points
   * 获取用户积分
   */
  static async getPoints(): Promise<ApiResponse<GetPointsResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<GetPointsResponse>('/api/user/points');
  }

  /**
   * GET /api/user/point-records
   * 获取积分记录（支持分页）
   */
  static async getPointRecords(type?: 'earn' | 'spend', page: number = 1, pageSize: number = 10): Promise<ApiResponse<GetPointRecordsResponse>> {
    const client = ApiClientFactory.getClient();
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    const path = `/api/user/point-records?${params.toString()}`;
    return client.get<GetPointRecordsResponse>(path);
  }

  /**
   * GET /api/user/inventory
   * 获取背包物品
   */
  static async getInventory(): Promise<ApiResponse<GetInventoryResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<GetInventoryResponse>('/api/user/inventory');
  }

  /**
   * POST /api/user/exchange
   * 兑换商品
   */
  static async exchange(request: ExchangeRequest): Promise<ApiResponse<ExchangeResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<ExchangeResponse>('/api/user/exchange', request);
  }

  /**
   * PUT /api/user/custom-style
   * 更新自定义样式
   */
  static async updateCustomStyle(request: UpdateCustomStyleRequest): Promise<ApiResponse<UpdateCustomStyleResponse>> {
    const client = ApiClientFactory.getClient();
    return client.put<UpdateCustomStyleResponse>('/api/user/custom-style', request);
  }

  /**
   * GET /api/user/custom-style
   * 获取自定义样式
   */
  static async getCustomStyle(): Promise<ApiResponse<UpdateCustomStyleResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<UpdateCustomStyleResponse>('/api/user/custom-style');
  }
}
