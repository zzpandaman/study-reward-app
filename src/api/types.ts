/**
 * API层类型定义
 * 定义RESTful接口的请求和响应类型
 */
import { TaskTemplate, TaskExecution, Product, UserData, PointRecord, InventoryItem, CustomStyle } from '../types';

// ============ 任务模板相关 ============
export interface GetTaskTemplatesResponse {
  data: TaskTemplate[];
  total: number;
}

export interface CreateTaskTemplateRequest {
  name: string;
  description: string;
}

export interface CreateTaskTemplateResponse {
  data: TaskTemplate;
}

export interface UpdateTaskTemplateRequest {
  name?: string;
  description?: string;
}

export interface UpdateTaskTemplateResponse {
  data: TaskTemplate;
}

// ============ 任务执行相关 ============
export interface GetTaskExecutionsResponse {
  data: TaskExecution[];
  total: number;
}

export interface StartTaskRequest {
  taskTemplateId: string;
}

export interface StartTaskResponse {
  data: TaskExecution;
}

export interface PauseTaskResponse {
  data: TaskExecution;
}

export interface ResumeTaskResponse {
  data: TaskExecution;
}

export interface CompleteTaskResponse {
  data: TaskExecution;
  reward: number;
}

export interface CancelTaskResponse {
  data: TaskExecution;
}

// ============ 商品相关 ============
export interface GetProductsResponse {
  data: Product[];
  total: number;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  minQuantity: number;
  unit?: string;
}

export interface CreateProductResponse {
  data: Product;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  minQuantity?: number;
  unit?: string;
}

export interface UpdateProductResponse {
  data: Product;
}

// ============ 用户数据相关 ============
export interface GetUserDataResponse {
  data: UserData;
}

export interface GetPointsResponse {
  data: {
    points: number;
  };
}

export interface GetPointRecordsResponse {
  data: PointRecord[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface GetInventoryResponse {
  data: InventoryItem[];
  total: number;
}

// ============ 积分相关 ============
export interface ExchangeRequest {
  productId: string;
  quantity?: number; // 可选，用于自定义数量
}

export interface ExchangeResponse {
  data: {
    product: Product;
    quantity: number;
    pointsSpent: number;
    remainingPoints: number;
  };
}

// ============ 样式相关 ============
export interface UpdateCustomStyleRequest {
  borderImage?: string;
  cursorImage?: string;
  backgroundImage?: string;
  borderStyle?: string;
  cursorStyle?: string;
  backgroundStyle?: string;
}

export interface UpdateCustomStyleResponse {
  data: CustomStyle;
}

// ============ 通用响应 ============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
