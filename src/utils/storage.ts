/**
 * 存储工具兼容层
 * 为了保持向后兼容，保留原有接口，内部使用新的数据层和API层
 */
import { TaskTemplate, TaskExecution, Product, UserData, PointRecord, AppData, CustomStyle } from '../types';
import { dataManager, PRESET_TASK_TEMPLATES, DEFAULT_PRODUCTS } from '../data/data-manager';
import { TaskTemplateAPI, TaskExecutionAPI, ProductAPI, UserAPI } from '../api';

// 导出预设数据（保持向后兼容）
export { PRESET_TASK_TEMPLATES, DEFAULT_PRODUCTS };

// 计算奖励积分
export const calculateReward = (minutes: number): number => {
  return Math.round(1 * minutes); // 每分钟1积分
};

// 计算黄金兑换积分
export const calculateGoldPrice = (grams: number): number => {
  return Math.round(grams * 480 * 100) / 100;
};

// 兼容层：任务模板存储
// 注意：为了保持同步接口，本地模式下直接调用dataManager，HTTP模式下才使用API
export const taskTemplateStorage = {
  get(): TaskTemplate[] {
    // 本地模式下直接调用数据层（同步），保持向后兼容
    const appData = dataManager.getAppData();
    return appData.taskTemplates;
  },
  save(templates: TaskTemplate[]): void {
    // 注意：此方法会替换所有模板，包括预设模板
    // 建议使用API层的create/update/delete方法
    const appData = dataManager.getAppData();
    appData.taskTemplates = templates;
    dataManager.saveAppData(appData);
  },
  add(template: TaskTemplate): void {
    TaskTemplateAPI.createTaskTemplate({
      name: template.name,
      description: template.description,
    });
  },
  remove(id: string): void {
    TaskTemplateAPI.deleteTaskTemplate(id);
  },
};

// 兼容层：任务执行记录存储
export const taskExecutionStorage = {
  get(): TaskExecution[] {
    // 本地模式下直接调用数据层（同步），保持向后兼容
    const appData = dataManager.getAppData();
    return appData.taskExecutions;
  },
  save(executions: TaskExecution[]): void {
    const appData = dataManager.getAppData();
    appData.taskExecutions = executions;
    dataManager.saveAppData(appData);
  },
  add(execution: TaskExecution): void {
    // 通过API层添加
    const appData = dataManager.getAppData();
    appData.taskExecutions.push(execution);
    dataManager.saveAppData(appData);
  },
  update(execution: TaskExecution): void {
    // 根据状态调用相应的API
    if (execution.status === 'paused') {
      TaskExecutionAPI.pauseTask(execution.id);
    } else if (execution.status === 'running' && execution.pausedTime) {
      TaskExecutionAPI.resumeTask(execution.id);
    } else {
      // 直接更新
      const appData = dataManager.getAppData();
      const index = appData.taskExecutions.findIndex((e) => e.id === execution.id);
      if (index !== -1) {
        appData.taskExecutions[index] = execution;
        dataManager.saveAppData(appData);
      }
    }
  },
};

// 兼容层：商品存储
export const productStorage = {
  get(): Product[] {
    // 本地模式下直接调用数据层（同步），保持向后兼容
    const appData = dataManager.getAppData();
    return appData.products;
  },
  save(products: Product[]): void {
    const appData = dataManager.getAppData();
    appData.products = products;
    dataManager.saveAppData(appData);
  },
  add(product: Product): void {
    ProductAPI.createProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      minQuantity: product.minQuantity ?? 1,
      unit: product.unit,
    });
  },
  remove(id: string): void {
    ProductAPI.deleteProduct(id);
  },
};

// 兼容层：用户数据存储
export const userDataStorage = {
  get(): UserData {
    // 本地模式下直接调用数据层（同步），保持向后兼容
    const appData = dataManager.getAppData();
    return appData.userData;
  },
  save(userData: UserData): void {
    const appData = dataManager.getAppData();
    appData.userData = userData;
    dataManager.saveAppData(appData);
  },
  addPointRecord(record: PointRecord): void {
    const appData = dataManager.getAppData();
    const userData = appData.userData;
    userData.points += record.type === 'earn' ? record.amount : -record.amount;
    userData.pointRecords.unshift(record);
    if (userData.pointRecords.length > 1000) {
      userData.pointRecords = userData.pointRecords.slice(0, 1000);
    }
    appData.userData = userData;
    dataManager.saveAppData(appData);
  },
  addInventoryItem(productId: string, productName: string, quantity: number, unit?: string): void {
    // 精度处理函数
    const roundToPrecision = (num: number, decimals: number = 2): number => {
      return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    };
    
    // 根据商品单位确定精度位数
    const getPrecisionByUnit = (unit: string | undefined): number => {
      if (unit === 'g' || unit === '克') {
        return 2;
      }
      return 1;
    };
    
    const appData = dataManager.getAppData();
    const userData = appData.userData;
    const precision = getPrecisionByUnit(unit);
    const existingItem = userData.inventory.find((item) => item.productId === productId);
    if (existingItem) {
      existingItem.quantity = roundToPrecision(existingItem.quantity + quantity, precision);
    } else {
      userData.inventory.push({ 
        productId, 
        productName, 
        quantity: roundToPrecision(quantity, precision), 
        unit 
      });
    }
    appData.userData = userData;
    dataManager.saveAppData(appData);
  },
  updateCustomStyle(style: CustomStyle): void {
    UserAPI.updateCustomStyle(style);
  },
};

// 数据导出导入（使用数据层）
export const exportData = (): string => {
  return dataManager.exportData();
};

export const importData = (jsonData: string): { success: boolean; message: string; stats?: { added: number; updated: number; merged: number } } => {
  return dataManager.importData(jsonData);
};

// 获取应用数据（兼容方法）
export const getAppData = (): AppData => {
  return dataManager.getAppData();
};

export const saveAppData = (appData: AppData): void => {
  dataManager.saveAppData(appData);
};
