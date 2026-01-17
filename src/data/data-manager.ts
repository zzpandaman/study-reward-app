/**
 * 数据管理器
 * 负责数据版本管理、迁移、验证
 */
import { AppData, TaskTemplate, TaskExecution, Product, UserData } from '../types';
import { StorageAdapterFactory, LocalStorageAdapter } from './storage-adapter';

const CURRENT_SCHEMA_VERSION = 2;
const CURRENT_VERSION = '1.1.0';

// 预设数据
export const PRESET_TASK_TEMPLATES: TaskTemplate[] = [
  { id: '1', name: '结构化', description: '进行结构化学习', isPreset: true, createdAt: Date.now() },
  { id: '2', name: '试讲', description: '进行试讲练习', isPreset: true, createdAt: Date.now() },
  { id: '3', name: '刷题', description: '进行题目练习', isPreset: true, createdAt: Date.now() },
];

export const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: '黄金1g', description: '兑换1克黄金', price: 480, unit: 'g', isPreset: true, createdAt: Date.now() },
  { id: '2', name: '黄金0.1g', description: '兑换0.1克黄金', price: 48, unit: 'g', isPreset: true, createdAt: Date.now() },
  { id: '3', name: '黄金0.01g', description: '兑换0.01克黄金', price: 5, unit: 'g', isPreset: true, createdAt: Date.now() },
  { id: '4', name: '玩手机60分钟', description: '60分钟学习 = 60分钟玩手机（比例1:1）', price: 60, unit: '分钟', isPreset: true, createdAt: Date.now() },
];

export class DataManager {
  private adapter = StorageAdapterFactory.getAdapter();

  /**
   * 获取应用数据（带自动迁移）
   */
  getAppData(): AppData {
    // 1. 尝试读取新格式数据
    const existingData = this.adapter.read();
    if (existingData) {
      // 检查版本，需要迁移则迁移
      if (existingData.version.schemaVersion < CURRENT_SCHEMA_VERSION) {
        return this.migrateToCurrentVersion(existingData);
      }
      return existingData;
    }

    // 2. 尝试从旧版本迁移
    if (this.adapter instanceof LocalStorageAdapter && this.adapter.hasLegacyData()) {
      const migrated = this.migrateFromLegacy();
      if (migrated) {
        return migrated;
      }
    }

    // 3. 返回默认数据
    return this.getDefaultAppData();
  }

  /**
   * 保存应用数据
   */
  saveAppData(data: AppData): void {
    // 更新版本信息
    data.version = {
      version: CURRENT_VERSION,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      createdAt: data.version?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    // 验证数据完整性
    this.validateData(data);

    // 写入存储
    this.adapter.write(data);
  }

  /**
   * 从旧版本数据迁移
   */
  private migrateFromLegacy(): AppData | null {
    try {
      const adapter = this.adapter as LocalStorageAdapter;
      const legacy = adapter.readLegacyData();

      if (!legacy.userData && !legacy.executions) {
        return null;
      }

      // 构建新格式数据
      const userData: UserData = legacy.userData || {
        points: 0,
        pointRecords: [],
        inventory: [],
        customStyle: {},
      };

      const taskExecutions: TaskExecution[] = legacy.executions || [];

      // 合并任务模板
      let taskTemplates = [...PRESET_TASK_TEMPLATES];
      if (legacy.tasks) {
        // 保留自定义任务
        const customTasks = legacy.tasks.filter((t: TaskTemplate) => !t.isPreset);
        taskTemplates = [...taskTemplates, ...customTasks];
      }

      // 合并商品
      let products = [...DEFAULT_PRODUCTS];
      if (legacy.products) {
        const customProducts = legacy.products.filter((p: Product) => !p.isPreset);
        products = [...products, ...customProducts];
      }

      const appData: AppData = {
        version: {
          version: CURRENT_VERSION,
          schemaVersion: CURRENT_SCHEMA_VERSION,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        userData,
        taskTemplates,
        products,
        taskExecutions,
      };

      // 保存新格式数据
      this.saveAppData(appData);

      // 验证新数据保存成功后再清理旧数据
      if (this.adapter.exists()) {
        // 清理旧版本数据
        if (adapter instanceof LocalStorageAdapter) {
          adapter.cleanupLegacyData();
        }
      }

      return appData;
    } catch (error) {
      console.error('Legacy data migration failed:', error);
      return null;
    }
  }

  /**
   * 迁移到当前版本
   */
  private migrateToCurrentVersion(data: AppData): AppData {
    // Schema v1 -> v2 迁移
    if (data.version.schemaVersion < 2) {
      // 确保customStyle存在
      if (!data.userData.customStyle) {
        data.userData.customStyle = {};
      }

      // 确保isPreset字段存在
      data.taskTemplates = data.taskTemplates.map((t) => ({
        ...t,
        isPreset: t.isPreset ?? PRESET_TASK_TEMPLATES.some((pt) => pt.id === t.id),
        createdAt: t.createdAt || Date.now(),
      }));

      data.products = data.products.map((p) => ({
        ...p,
        isPreset: p.isPreset ?? DEFAULT_PRODUCTS.some((dp) => dp.id === p.id),
        createdAt: p.createdAt || Date.now(),
      }));
    }

    // 保存迁移后的数据
    this.saveAppData(data);
    return data;
  }

  /**
   * 获取默认应用数据
   */
  private getDefaultAppData(): AppData {
    return {
      version: {
        version: CURRENT_VERSION,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      userData: {
        points: 0,
        pointRecords: [],
        inventory: [],
        customStyle: {},
      },
      taskTemplates: [...PRESET_TASK_TEMPLATES],
      products: [...DEFAULT_PRODUCTS],
      taskExecutions: [],
    };
  }

  /**
   * 验证数据完整性
   */
  private validateData(data: AppData): void {
    if (!data.version) {
      throw new Error('Data version is required');
    }
    if (!data.userData) {
      throw new Error('User data is required');
    }
    if (!Array.isArray(data.taskTemplates)) {
      throw new Error('Task templates must be an array');
    }
    if (!Array.isArray(data.products)) {
      throw new Error('Products must be an array');
    }
    if (!Array.isArray(data.taskExecutions)) {
      throw new Error('Task executions must be an array');
    }
  }

  /**
   * 导出数据
   */
  exportData(): string {
    const appData = this.getAppData();
    return JSON.stringify(
      {
        version: CURRENT_VERSION,
        exportTime: Date.now(),
        data: appData,
      },
      null,
      2
    );
  }

  /**
   * 导入数据
   */
  importData(jsonData: string): { success: boolean; message: string } {
    try {
      const imported = JSON.parse(jsonData);

      if (!imported.data || !imported.data.userData) {
        return { success: false, message: '数据格式不正确' };
      }

      // 验证并导入数据
      const appData: AppData = {
        ...imported.data,
        version: {
          version: CURRENT_VERSION,
          schemaVersion: CURRENT_SCHEMA_VERSION,
          createdAt: imported.data.version?.createdAt || Date.now(),
          updatedAt: Date.now(),
        },
      };

      this.validateData(appData);
      this.saveAppData(appData);

      return { success: true, message: '数据导入成功！' };
    } catch (error) {
      return { success: false, message: '数据导入失败：' + (error as Error).message };
    }
  }
}

// 单例实例
export const dataManager = new DataManager();
