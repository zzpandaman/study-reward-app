/**
 * 本地服务层
 * 实现所有API的业务逻辑（本地模式）
 * 直接调用数据层，不通过API类，避免循环依赖
 */
import { TaskTemplate, TaskExecution, Product, PointRecord } from '../types';
import { dataManager } from '../data/data-manager';
import { ApiResponse } from './types';

const POINTS_PER_MINUTE = 1;

const calculateReward = (minutes: number): number => {
  return Math.round(POINTS_PER_MINUTE * minutes);
};

/**
 * 本地服务：实现所有API的业务逻辑
 */
export class LocalService {
  // ============ 任务模板相关 ============
  static getTaskTemplates(): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      return {
        success: true,
        data: {
          data: appData.taskTemplates,
          total: appData.taskTemplates.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  static createTaskTemplate(request: any): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const template: TaskTemplate = {
        id: Date.now().toString(),
        name: request.name,
        description: request.description,
        isPreset: false,
        createdAt: Date.now(),
      };
      appData.taskTemplates.push(template);
      dataManager.saveAppData(appData);
      return {
        success: true,
        data: { data: template },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static updateTaskTemplate(id: string, request: any): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const index = appData.taskTemplates.findIndex((t) => t.id === id);
      if (index === -1) {
        return { success: false, error: 'Task template not found' };
      }
      const template = appData.taskTemplates[index];
      if (template.isPreset) {
        return { success: false, error: 'Cannot update preset task template' };
      }
      appData.taskTemplates[index] = { ...template, ...request };
      dataManager.saveAppData(appData);
      return {
        success: true,
        data: { data: appData.taskTemplates[index] },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static deleteTaskTemplate(id: string): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const template = appData.taskTemplates.find((t) => t.id === id);
      if (!template) {
        return { success: false, error: 'Task template not found' };
      }
      if (template.isPreset) {
        return { success: false, error: 'Cannot delete preset task template' };
      }
      
      // 检查是否有任务执行记录使用此模板
      const hasExecutions = appData.taskExecutions.some((e) => e.taskTemplateId === id);
      if (hasExecutions) {
        return { success: false, error: 'Cannot delete task template that has execution records' };
      }
      
      appData.taskTemplates = appData.taskTemplates.filter((t) => t.id !== id);
      dataManager.saveAppData(appData);
      return { success: true, message: 'Task template deleted' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ============ 任务执行相关 ============
  static getTaskExecutions(): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      return {
        success: true,
        data: {
          data: appData.taskExecutions,
          total: appData.taskExecutions.length,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static startTask(request: any): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const hasRunning = appData.taskExecutions.some(
        (e) => e.status === 'running' || e.status === 'paused'
      );
      if (hasRunning) {
        return { success: false, error: '一次只能执行一个任务！请先完成当前任务。' };
      }
      const template = appData.taskTemplates.find((t) => t.id === request.taskTemplateId);
      if (!template) {
        return { success: false, error: 'Task template not found' };
      }
      const execution: TaskExecution = {
        id: Date.now().toString(),
        taskTemplateId: template.id,
        taskName: template.name,
        startTime: Date.now(),
        totalPausedDuration: 0,
        actualReward: 0,
        status: 'running',
      };
      appData.taskExecutions.push(execution);
      dataManager.saveAppData(appData);
      return { success: true, data: { data: execution } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static pauseTask(id: string): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const execution = appData.taskExecutions.find((e) => e.id === id);
      if (!execution) {
        return { success: false, error: 'Task execution not found' };
      }
      if (execution.status !== 'running') {
        return { success: false, error: 'Task is not running' };
      }
      execution.status = 'paused';
      execution.pausedTime = Date.now();
      dataManager.saveAppData(appData);
      return { success: true, data: { data: execution } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static resumeTask(id: string): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const execution = appData.taskExecutions.find((e) => e.id === id);
      if (!execution) {
        return { success: false, error: 'Task execution not found' };
      }
      if (execution.status !== 'paused') {
        return { success: false, error: 'Task is not paused' };
      }
      const pausedDuration = (Date.now() - execution.pausedTime!) / 1000;
      execution.totalPausedDuration = execution.totalPausedDuration + pausedDuration;
      execution.status = 'running';
      execution.pausedTime = undefined;
      dataManager.saveAppData(appData);
      return { success: true, data: { data: execution } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static completeTask(id: string): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const execution = appData.taskExecutions.find((e) => e.id === id);
      if (!execution) {
        return { success: false, error: 'Task execution not found' };
      }
      const now = Date.now();
      const pausedDuration = execution.totalPausedDuration * 1000;
      const effectiveStartTime = execution.startTime + pausedDuration;
      const actualSeconds = Math.floor((now - effectiveStartTime) / 1000);
      const actualMinutes = Math.floor(actualSeconds / 60);
      const actualReward = calculateReward(actualMinutes);

      execution.endTime = now;
      execution.actualDuration = actualMinutes;
      execution.actualReward = actualReward;
      execution.status = 'completed';
      execution.pausedTime = undefined;

      if (actualReward > 0) {
        appData.userData.points += actualReward;
        appData.userData.pointRecords.unshift({
          id: Date.now().toString(),
          type: 'earn',
          amount: actualReward,
          description: `完成任务: ${execution.taskName} (${actualMinutes}分钟)`,
          timestamp: Date.now(),
          relatedId: execution.id,
        });
        if (appData.userData.pointRecords.length > 1000) {
          appData.userData.pointRecords = appData.userData.pointRecords.slice(0, 1000);
        }
      }
      dataManager.saveAppData(appData);
      return {
        success: true,
        data: {
          data: execution,
          reward: actualReward,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static cancelTask(id: string): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const execution = appData.taskExecutions.find((e) => e.id === id);
      if (!execution) {
        return { success: false, error: 'Task execution not found' };
      }
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.actualReward = 0;
      dataManager.saveAppData(appData);
      return { success: true, data: { data: execution } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ============ 商品相关 ============
  static getProducts(): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      return {
        success: true,
        data: {
          data: appData.products,
          total: appData.products.length,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static createProduct(request: any): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const product: Product = {
        id: Date.now().toString(),
        name: request.name,
        description: request.description,
        price: request.price,
        minQuantity: request.minQuantity ?? 1,
        unit: request.unit,
        isPreset: false,
        createdAt: Date.now(),
      };
      appData.products.push(product);
      dataManager.saveAppData(appData);
      return { success: true, data: { data: product } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static updateProduct(id: string, request: any): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const index = appData.products.findIndex((p) => p.id === id);
      if (index === -1) {
        return { success: false, error: 'Product not found' };
      }
      const product = appData.products[index];
      if (product.isPreset) {
        return { success: false, error: 'Cannot update preset product' };
      }
      appData.products[index] = { ...product, ...request };
      dataManager.saveAppData(appData);
      return { success: true, data: { data: appData.products[index] } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static deleteProduct(id: string): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      const product = appData.products.find((p) => p.id === id);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      if (product.isPreset) {
        return { success: false, error: 'Cannot delete preset product' };
      }
      
      // 检查是否有兑换记录（积分消耗记录）
      const hasSpendRecords = appData.userData.pointRecords.some(
        (r) => r.type === 'spend' && r.relatedId === id
      );
      if (hasSpendRecords) {
        return { success: false, error: 'Cannot delete product that has exchange records' };
      }
      
      // 检查背包中是否有该商品
      const hasInventory = appData.userData.inventory.some((item) => item.productId === id);
      if (hasInventory) {
        return { success: false, error: 'Cannot delete product that exists in inventory' };
      }
      
      appData.products = appData.products.filter((p) => p.id !== id);
      dataManager.saveAppData(appData);
      return { success: true, message: 'Product deleted' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // ============ 用户数据相关 ============
  static getUserData(): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      return { success: true, data: { data: appData.userData } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static getPoints(): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      return {
        success: true,
        data: {
          data: {
            points: appData.userData.points,
          },
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static getPointRecords(type?: 'earn' | 'spend', page: number = 1, pageSize: number = 10): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      let records = [...appData.userData.pointRecords];
      
      // 如果是"全部"类型（type === undefined），需要包含"未完成，无积分"的任务记录
      if (!type) {
        // 查找所有已完成但无积分的任务执行记录
        const failedTasks = appData.taskExecutions
          .filter((e) => e.status === 'completed' && e.actualReward === 0 && e.endTime)
          .map((e) => ({
            id: `task-${e.id}`,
            type: 'earn' as const,
            amount: 0,
            description: `未完成，无积分: ${e.taskName}${e.actualDuration ? ` (${e.actualDuration}分钟)` : ''}`,
            timestamp: e.endTime!,
            relatedId: e.id,
          }));
        records = [...records, ...failedTasks];
      }
      
      // 按类型过滤（在添加失败任务之后）
      if (type) {
        records = records.filter((r) => r.type === type);
      }
      
      // 按时间戳倒序排列（最新的在前）
      records = records.sort((a, b) => b.timestamp - a.timestamp);
      
      // 计算分页
      const total = records.length;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRecords = records.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          data: paginatedRecords,
          total,
          page,
          pageSize,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static getInventory(): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      return {
        success: true,
        data: {
          data: appData.userData.inventory,
          total: appData.userData.inventory.length,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static exchange(request: any): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      let product: Product | null = null;

      // 从商品列表查找商品
      product = appData.products.find((p) => p.id === request.productId) || null;
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // 用户输入的整数数量（单位数）
      const units = request.quantity || 1;
      
      // 计算实际数量（用户输入 * minQuantity）
      const actualQuantity = units * (product.minQuantity ?? 1);
      
      // 计算所需积分（每minQuantity单位的积分 * 单位数）
      const pointsSpent = product.price * units;
      
      const productName = product.name;
      const productUnit = product.unit || '';

      if (appData.userData.points < pointsSpent) {
        return {
          success: false,
          error: `积分不足！当前积分: ${appData.userData.points}，需要: ${pointsSpent}`,
        };
      }

      appData.userData.points -= pointsSpent;
      const record: PointRecord = {
        id: Date.now().toString(),
        type: 'spend',
        amount: pointsSpent,
        description: `兑换${productName}: ${actualQuantity}${productUnit}`,
        timestamp: Date.now(),
        relatedId: request.productId,
      };
      appData.userData.pointRecords.unshift(record);

      // 精度处理函数
      const roundToPrecision = (num: number, decimals: number = 2): number => {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
      };
      
      // 根据商品单位确定精度位数
      const getPrecisionByUnit = (unit: string): number => {
        if (unit === 'g' || unit === '克') {
          return 2;
        }
        return 1;
      };
      
      const precision = getPrecisionByUnit(productUnit);
      const existingItem = appData.userData.inventory.find((item) => item.productId === request.productId);
      if (existingItem) {
        existingItem.quantity = roundToPrecision(existingItem.quantity + actualQuantity, precision);
      } else {
        appData.userData.inventory.push({
          productId: request.productId,
          productName,
          quantity: roundToPrecision(actualQuantity, precision),
          unit: productUnit,
        });
      }

      if (appData.userData.pointRecords.length > 1000) {
        appData.userData.pointRecords = appData.userData.pointRecords.slice(0, 1000);
      }

      dataManager.saveAppData(appData);

      return {
        success: true,
        data: {
          data: {
            product: {
              id: request.productId,
              name: productName,
              description: product.description || '',
              price: product.price,
              minQuantity: product.minQuantity ?? 1,
              unit: productUnit,
              isPreset: product.isPreset,
            },
            quantity: actualQuantity,
            pointsSpent,
            remainingPoints: appData.userData.points,
          },
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static updateCustomStyle(request: any): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      appData.userData.customStyle = {
        ...appData.userData.customStyle,
        ...request,
      };
      dataManager.saveAppData(appData);
      return { success: true, data: { data: appData.userData.customStyle || {} } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  static getCustomStyle(): ApiResponse {
    try {
      const appData = dataManager.getAppData();
      return { success: true, data: { data: appData.userData.customStyle || {} } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
