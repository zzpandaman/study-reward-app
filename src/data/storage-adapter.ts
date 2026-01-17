/**
 * 数据存储适配器
 * 负责底层数据存储的抽象，支持从localStorage平滑迁移到MySQL
 */
import { AppData } from '../types';

export interface IStorageAdapter {
  /**
   * 读取应用数据
   */
  read(): AppData | null;

  /**
   * 写入应用数据
   */
  write(data: AppData): void;

  /**
   * 检查数据是否存在
   */
  exists(): boolean;

  /**
   * 备份数据
   */
  backup(): void;

  /**
   * 恢复备份
   */
  restore(): AppData | null;
}

/**
 * LocalStorage存储适配器（当前实现）
 * 后续可以添加MySQL适配器实现相同接口
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly STORAGE_KEY = 'study_reward_app_data';
  private readonly BACKUP_KEY = 'study_reward_app_data_backup';
  private readonly LEGACY_KEYS = {
    USER_DATA: 'study_reward_user_data',
    TASKS: 'study_reward_tasks',
    EXECUTIONS: 'study_reward_task_executions',
    PRODUCTS: 'study_reward_products',
  };

  read(): AppData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Failed to read data from localStorage:', error);
      return null;
    }
  }

  write(data: AppData): void {
    try {
      // 写入前先备份
      this.backup();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to write data to localStorage:', error);
      throw error;
    }
  }

  exists(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  backup(): void {
    try {
      const current = localStorage.getItem(this.STORAGE_KEY);
      if (current) {
        localStorage.setItem(this.BACKUP_KEY, current);
      }
    } catch (error) {
      console.error('Failed to backup data:', error);
    }
  }

  restore(): AppData | null {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      if (backup) {
        const data = JSON.parse(backup);
        this.write(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Failed to restore data:', error);
      return null;
    }
  }

  /**
   * 检查是否存在旧版本数据
   */
  hasLegacyData(): boolean {
    return (
      localStorage.getItem(this.LEGACY_KEYS.USER_DATA) !== null ||
      localStorage.getItem(this.LEGACY_KEYS.EXECUTIONS) !== null ||
      localStorage.getItem(this.LEGACY_KEYS.PRODUCTS) !== null ||
      localStorage.getItem(this.LEGACY_KEYS.TASKS) !== null
    );
  }

  /**
   * 读取旧版本数据（用于迁移）
   */
  readLegacyData(): {
    userData?: any;
    executions?: any;
    products?: any;
    tasks?: any;
  } {
    const result: any = {};
    try {
      const userData = localStorage.getItem(this.LEGACY_KEYS.USER_DATA);
      if (userData) result.userData = JSON.parse(userData);

      const executions = localStorage.getItem(this.LEGACY_KEYS.EXECUTIONS);
      if (executions) result.executions = JSON.parse(executions);

      const products = localStorage.getItem(this.LEGACY_KEYS.PRODUCTS);
      if (products) result.products = JSON.parse(products);

      const tasks = localStorage.getItem(this.LEGACY_KEYS.TASKS);
      if (tasks) result.tasks = JSON.parse(tasks);
    } catch (error) {
      console.error('Failed to read legacy data:', error);
    }
    return result;
  }

  /**
   * 清理旧版本数据
   * 在迁移成功后调用，删除旧的localStorage键
   */
  cleanupLegacyData(): void {
    try {
      // 验证新格式数据已存在，避免误删
      if (!this.exists()) {
        console.warn('Cannot cleanup legacy data: new format data does not exist');
        return;
      }

      // 删除旧版本存储键
      Object.values(this.LEGACY_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log('Legacy data cleaned up successfully');
    } catch (error) {
      console.error('Failed to cleanup legacy data:', error);
      // 清理失败不影响应用运行，只记录错误
    }
  }
}

/**
 * 存储适配器工厂
 * 根据配置选择使用localStorage或MySQL
 */
export class StorageAdapterFactory {
  private static adapter: IStorageAdapter | null = null;

  static getAdapter(): IStorageAdapter {
    if (!this.adapter) {
      // 当前使用localStorage，后续可以通过配置切换到MySQL
      this.adapter = new LocalStorageAdapter();
    }
    return this.adapter;
  }

  static setAdapter(adapter: IStorageAdapter): void {
    this.adapter = adapter;
  }
}
