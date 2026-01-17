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
   * GET /api/products
   * 获取所有商品
   */
  static async getProducts(): Promise<ApiResponse<GetProductsResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<GetProductsResponse>('/api/products');
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
   * PUT /api/products/:id
   * 更新商品
   */
  static async updateProduct(id: string, request: UpdateProductRequest): Promise<ApiResponse<UpdateProductResponse>> {
    const client = ApiClientFactory.getClient();
    return client.put<UpdateProductResponse>(`/api/products/${id}`, request);
  }

  /**
   * DELETE /api/products/:id
   * 删除商品
   */
  static async deleteProduct(id: string): Promise<ApiResponse> {
    const client = ApiClientFactory.getClient();
    return client.delete(`/api/products/${id}`);
  }
}
