/**
 * 商品相关API
 * 通过客户端调用，支持本地模式和HTTP模式无缝切换
 */
import {
  GetProductsResponse,
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  ApiResponse,
} from './types';
import ApiClientFactory from './client';

/**
 * 商品API
 */
export class ProductAPI {
  /**
   * POST /api/products/query
   * 获取所有商品（分页查询）
   */
  static async getProducts(): Promise<ApiResponse<GetProductsResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<GetProductsResponse>('/api/products/query', {
      page: 1,
      pageSize: 1000,
    });
  }

  /**
   * POST /api/products
   * 创建商品
   */
  static async createProduct(request: CreateProductRequest): Promise<ApiResponse<CreateProductResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<CreateProductResponse>('/api/products', request);
  }

  /**
   * POST /api/products/update
   * 更新商品（body: { id, name?, ... }）
   */
  static async updateProduct(id: string, request: UpdateProductRequest): Promise<ApiResponse<UpdateProductResponse>> {
    const client = ApiClientFactory.getClient();
    const idVal = Number.isNaN(Number(id)) ? id : Number(id);
    return client.post<UpdateProductResponse>('/api/products/update', {
      id: idVal,
      ...request,
    });
  }

  /**
   * POST /api/products/delete
   * 删除商品（body: { id }）
   */
  static async deleteProduct(id: string): Promise<ApiResponse> {
    const client = ApiClientFactory.getClient();
    const idVal = Number.isNaN(Number(id)) ? id : Number(id);
    return client.post('/api/products/delete', { id: idVal });
  }
}
