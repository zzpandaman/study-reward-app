/**
 * API层统一导出
 * 提供RESTful风格的接口抽象
 */
export * from './types';
export * from './task-api';
export * from './product-api';
export * from './user-api';

// 统一API入口（便于后续替换为HTTP请求）
export const API = {
  taskTemplate: {
    get: () => import('./task-api').then((m) => m.TaskTemplateAPI.getTaskTemplates()),
    create: (request: any) => import('./task-api').then((m) => m.TaskTemplateAPI.createTaskTemplate(request)),
    update: (id: string, request: any) => import('./task-api').then((m) => m.TaskTemplateAPI.updateTaskTemplate(id, request)),
    delete: (id: string) => import('./task-api').then((m) => m.TaskTemplateAPI.deleteTaskTemplate(id)),
  },
  taskExecution: {
    get: () => import('./task-api').then((m) => m.TaskExecutionAPI.getTaskExecutions()),
    start: (request: any) => import('./task-api').then((m) => m.TaskExecutionAPI.startTask(request)),
    pause: (id: string) => import('./task-api').then((m) => m.TaskExecutionAPI.pauseTask(id)),
    resume: (id: string) => import('./task-api').then((m) => m.TaskExecutionAPI.resumeTask(id)),
    complete: (id: string) => import('./task-api').then((m) => m.TaskExecutionAPI.completeTask(id)),
    cancel: (id: string) => import('./task-api').then((m) => m.TaskExecutionAPI.cancelTask(id)),
  },
  product: {
    get: () => import('./product-api').then((m) => m.ProductAPI.getProducts()),
    create: (request: any) => import('./product-api').then((m) => m.ProductAPI.createProduct(request)),
    update: (id: string, request: any) => import('./product-api').then((m) => m.ProductAPI.updateProduct(id, request)),
    delete: (id: string) => import('./product-api').then((m) => m.ProductAPI.deleteProduct(id)),
  },
  user: {
    getData: () => import('./user-api').then((m) => m.UserAPI.getUserData()),
    getPoints: () => import('./user-api').then((m) => m.UserAPI.getPoints()),
    getPointRecords: (type?: 'earn' | 'spend') => import('./user-api').then((m) => m.UserAPI.getPointRecords(type)),
    getInventory: () => import('./user-api').then((m) => m.UserAPI.getInventory()),
    exchange: (request: any) => import('./user-api').then((m) => m.UserAPI.exchange(request)),
    updateCustomStyle: (request: any) => import('./user-api').then((m) => m.UserAPI.updateCustomStyle(request)),
    getCustomStyle: () => import('./user-api').then((m) => m.UserAPI.getCustomStyle()),
  },
};
