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
  GetTaskExecutionByNoResponse,
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
   * POST /api/task-templates/query
   * 获取所有任务模板（分页查询）
   */
  static async getTaskTemplates(page: number = 1, pageSize: number = 1000): Promise<ApiResponse<GetTaskTemplatesResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<GetTaskTemplatesResponse>('/api/task-templates/query', {
      page,
      pageSize,
    });
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
   * POST /api/task-templates/update
   * 更新任务模板（body: { id, name?, description? }）
   */
  static async updateTaskTemplate(id: string, request: UpdateTaskTemplateRequest): Promise<ApiResponse<UpdateTaskTemplateResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<UpdateTaskTemplateResponse>('/api/task-templates/update', {
      id: Number(id),
      ...request,
    });
  }

  /**
   * POST /api/task-templates/delete
   * 删除任务模板（body: { id }）
   */
  static async deleteTaskTemplate(id: string): Promise<ApiResponse> {
    const client = ApiClientFactory.getClient();
    return client.post('/api/task-templates/delete', { id: Number(id) });
  }

  /**
   * GET /api/task-templates/executable
   * 当前用户可执行的模版（可筛选发布人）
   */
  static async getExecutableTemplates(params: {
    page?: number;
    pageSize?: number;
    publishBy?: string;
    publishById?: number;
    keyword?: string;
    isPreset?: boolean;
  }): Promise<ApiResponse<GetTaskTemplatesResponse>> {
    const client = ApiClientFactory.getClient();
    const q = new URLSearchParams();
    if (params.page != null) q.set('page', String(params.page));
    if (params.pageSize != null) q.set('pageSize', String(params.pageSize));
    if (params.publishBy) q.set('publishBy', params.publishBy);
    if (params.publishById != null) q.set('publishById', String(params.publishById));
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.isPreset !== undefined) q.set('isPreset', String(params.isPreset));
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return client.get<GetTaskTemplatesResponse>(`/api/task-templates/executable${suffix}`);
  }

  /** POST /api/task-templates/grant */
  static async grantTemplate(templateId: number, executorUserNos: string[]): Promise<ApiResponse<boolean>> {
    const client = ApiClientFactory.getClient();
    return client.post<boolean>('/api/task-templates/grant', { templateId, executorUserNos });
  }

  /** POST /api/task-templates/revoke */
  static async revokeTemplateGrant(templateId: number, executorUserNo: string): Promise<ApiResponse<boolean>> {
    const client = ApiClientFactory.getClient();
    return client.post<boolean>('/api/task-templates/revoke', { templateId, executorUserNo });
  }
}

/**
 * 任务执行API
 * 通过客户端调用，支持本地模式和HTTP模式无缝切换
 */
export class TaskExecutionAPI {
  /**
   * GET /api/task-executions/by-no/{instanceNo}
   * 根据实例编号获取任务执行详情（HTTP 模式，list 无 totalExecutionDuration 时用于恢复 elapsed）
   */
  static async getExecutionByNo(instanceNo: string): Promise<ApiResponse<GetTaskExecutionByNoResponse>> {
    const client = ApiClientFactory.getClient();
    return client.get<GetTaskExecutionByNoResponse>(`/api/task-executions/by-no/${instanceNo}`);
  }

  /**
   * POST /api/task-executions
   * 获取进行中的任务执行记录（state=ongoing：running|paused）
   */
  static async getTaskExecutions(): Promise<ApiResponse<GetTaskExecutionsResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<GetTaskExecutionsResponse>('/api/task-executions', {
      page: 1,
      pageSize: 100,
      state: 'ongoing',
    });
  }

  /**
   * POST /api/task-executions/start
   * 开始任务（clientTime 必传）
   */
  static async startTask(request: StartTaskRequest): Promise<ApiResponse<StartTaskResponse>> {
    const client = ApiClientFactory.getClient();
    const body = {
      ...request,
      clientTime: request.clientTime ?? Math.floor(Date.now() / 1000),
    };
    return client.post<StartTaskResponse>('/api/task-executions/start', body);
  }

  /**
   * POST /api/task-executions/pause
   * 暂停任务（body: { id, clientTime }），clientTime 由调用方在操作发生时立即捕获
   */
  static async pauseTask(id: string, clientTime: number): Promise<ApiResponse<PauseTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<PauseTaskResponse>('/api/task-executions/pause', {
      id: Number(id),
      clientTime,
    });
  }

  /**
   * POST /api/task-executions/resume
   * 恢复任务（body: { id, clientTime }），clientTime 由调用方在操作发生时立即捕获
   */
  static async resumeTask(id: string, clientTime: number): Promise<ApiResponse<ResumeTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<ResumeTaskResponse>('/api/task-executions/resume', {
      id: Number(id),
      clientTime,
    });
  }

  /**
   * POST /api/task-executions/complete
   * 完成任务（body: { id, clientTime }），clientTime 由调用方在操作发生时立即捕获
   */
  static async completeTask(id: string, clientTime: number): Promise<ApiResponse<CompleteTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<CompleteTaskResponse>('/api/task-executions/complete', {
      id: Number(id),
      clientTime,
    });
  }

  /**
   * POST /api/task-executions/cancel
   * 取消任务（body: { id, clientTime }），clientTime 由调用方在操作发生时立即捕获
   */
  static async cancelTask(id: string, clientTime: number): Promise<ApiResponse<CancelTaskResponse>> {
    const client = ApiClientFactory.getClient();
    return client.post<CancelTaskResponse>('/api/task-executions/cancel', {
      id: Number(id),
      clientTime,
    });
  }
}
