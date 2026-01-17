/**
 * 任务相关API
 * 通过客户端调用，支持本地模式和HTTP模式无缝切换
 */
import {
  GetTaskTemplatesResponse,
  CreateTaskTemplateRequest,
  CreateTaskTemplateResponse,
  UpdateTaskTemplateRequest,
  UpdateTaskTemplateResponse,
  GetTaskExecutionsResponse,
  StartTaskRequest,
  StartTaskResponse,
  PauseTaskResponse,
  ResumeTaskResponse,
  CompleteTaskResponse,
  CancelTaskResponse,
  ApiResponse,
} from './types';
import ApiClientFactory from './client';

/**
 * 任务模板API
 * 通过客户端调用，支持本地模式和HTTP模式无缝切换
 */
export class TaskTemplateAPI {
  /**
   * GET /api/task-templates
   * 获取所有任务模板
   */
  static async getTaskTemplates(): Promise<ApiResponse<GetTaskTemplatesResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<GetTaskTemplatesResponse>('/api/task-templates');
  }

  /**
   * POST /api/task-templates
   * 创建任务模板
   */
  static async createTaskTemplate(request: CreateTaskTemplateRequest): Promise<ApiResponse<CreateTaskTemplateResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<CreateTaskTemplateResponse>('/api/task-templates', request);
  }

  /**
   * PUT /api/task-templates/:id
   * 更新任务模板
   */
  static async updateTaskTemplate(id: string, request: UpdateTaskTemplateRequest): Promise<ApiResponse<UpdateTaskTemplateResponse>> {
    const client = ApiClientFactory.getClient();
    return client.put<UpdateTaskTemplateResponse>(`/api/task-templates/${id}`, request);
  }

  /**
   * DELETE /api/task-templates/:id
   * 删除任务模板
   */
  static async deleteTaskTemplate(id: string): Promise<ApiResponse> {
    const client = ApiClientFactory.getClient();
    return client.delete(`/api/task-templates/${id}`);
  }
}

/**
 * 任务执行API
 * 通过客户端调用，支持本地模式和HTTP模式无缝切换
 */
export class TaskExecutionAPI {
  /**
   * GET /api/task-executions
   * 获取所有任务执行记录
   */
  static async getTaskExecutions(): Promise<ApiResponse<GetTaskExecutionsResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<GetTaskExecutionsResponse>('/api/task-executions');
  }

  /**
   * POST /api/task-executions/start
   * 开始任务
   */
  static async startTask(request: StartTaskRequest): Promise<ApiResponse<StartTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<StartTaskResponse>('/api/task-executions/start', request);
  }

  /**
   * POST /api/task-executions/:id/pause
   * 暂停任务
   */
  static async pauseTask(id: string): Promise<ApiResponse<PauseTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<PauseTaskResponse>(`/api/task-executions/${id}/pause`);
  }

  /**
   * POST /api/task-executions/:id/resume
   * 恢复任务
   */
  static async resumeTask(id: string): Promise<ApiResponse<ResumeTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<ResumeTaskResponse>(`/api/task-executions/${id}/resume`);
  }

  /**
   * POST /api/task-executions/:id/complete
   * 完成任务
   */
  static async completeTask(id: string): Promise<ApiResponse<CompleteTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<CompleteTaskResponse>(`/api/task-executions/${id}/complete`);
  }

  /**
   * POST /api/task-executions/:id/cancel
   * 取消任务
   */
  static async cancelTask(id: string): Promise<ApiResponse<CancelTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<CancelTaskResponse>(`/api/task-executions/${id}/cancel`);
  }
}
