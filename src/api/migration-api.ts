/**
 * 数据迁移 API
 * 将本地 localStorage 数据迁移到服务器
 * 保证：不丢（完整性）、不多（幂等性）
 */
import { TaskTemplate, Product } from '../types';
import { dataManager } from '../data/data-manager';
import { TaskTemplateAPI } from './task-api';
import { ProductAPI } from './product-api';
import { isHttpMode } from './config';

// 迁移状态存储 key
const MIGRATION_STATUS_KEY = 'study_reward_migration_status';
const MIGRATION_BACKUP_KEY = 'study_reward_migration_backup';

// 最大重试次数
const MAX_RETRY = 3;

/**
 * 迁移项状态
 */
export interface MigrationItem {
  localId: string;
  name: string;
  status: 'pending' | 'success' | 'skipped' | 'failed';
  serverId?: string;
  error?: string;
  retryCount?: number;
}

/**
 * 迁移进度
 */
export interface MigrationProgress {
  templates: MigrationItem[];
  products: MigrationItem[];
  total: number;
  completed: number;
  skipped: number;
  failed: number;
}

/**
 * 迁移状态
 */
export interface MigrationStatus {
  migrated: boolean;
  migratedAt?: number;
  serverUserNo?: string;
  progress?: MigrationProgress;
  localDataHash?: string;
}

/**
 * 迁移结果
 */
export interface MigrationResult {
  success: boolean;
  progress: MigrationProgress;
  verified: boolean;
  message: string;
}

/**
 * 计算本地数据哈希（用于检测数据变更）
 */
function computeLocalDataHash(): string {
  const appData = dataManager.getAppData();
  const customTemplates = appData.taskTemplates.filter(t => !t.isPreset);
  const customProducts = appData.products.filter(p => !p.isPreset);
  
  const hashData = {
    templates: customTemplates.map(t => t.name).sort(),
    products: customProducts.map(p => p.name).sort(),
  };
  
  return JSON.stringify(hashData);
}

/**
 * 获取迁移状态
 */
export function getMigrationStatus(): MigrationStatus {
  const stored = localStorage.getItem(MIGRATION_STATUS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { migrated: false };
    }
  }
  return { migrated: false };
}

/**
 * 保存迁移状态
 */
function saveMigrationStatus(status: MigrationStatus): void {
  localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(status));
}

/**
 * 检查是否需要迁移
 * 条件：HTTP模式 + 本地有数据 + 未迁移或数据有变更
 */
export function checkMigrationNeeded(): boolean {
  // 非 HTTP 模式不需要迁移
  if (!isHttpMode()) {
    return false;
  }

  const status = getMigrationStatus();
  
  // 已迁移且数据无变更
  if (status.migrated) {
    const currentHash = computeLocalDataHash();
    if (status.localDataHash === currentHash) {
      return false;
    }
  }

  // 检查是否有本地数据
  const appData = dataManager.getAppData();
  const customTemplates = appData.taskTemplates.filter(t => !t.isPreset);
  const customProducts = appData.products.filter(p => !p.isPreset);
  
  return customTemplates.length > 0 || customProducts.length > 0;
}

/**
 * 获取待迁移的本地数据
 */
export function getLocalDataToMigrate(): { templates: TaskTemplate[]; products: Product[] } {
  const appData = dataManager.getAppData();
  return {
    templates: appData.taskTemplates.filter(t => !t.isPreset),
    products: appData.products.filter(p => !p.isPreset),
  };
}

/**
 * 查询服务器已有数据
 */
async function getServerData(): Promise<{ 
  templates: Map<string, string>;  // name -> serverId
  products: Map<string, string>;   // name -> serverId
}> {
  const templates = new Map<string, string>();
  const products = new Map<string, string>();

  // 获取服务器任务模板
  const templatesRes = await TaskTemplateAPI.getTaskTemplates();
  if (templatesRes.success && templatesRes.data?.data) {
    templatesRes.data.data.forEach(t => {
      templates.set(t.name, t.id?.toString() || t.templateNo);
    });
  }

  // 获取服务器商品
  const productsRes = await ProductAPI.getProducts();
  if (productsRes.success && productsRes.data?.data) {
    productsRes.data.data.forEach(p => {
      products.set(p.name, p.id?.toString() || p.productNo);
    });
  }

  return { templates, products };
}

/**
 * 初始化迁移进度
 */
function initMigrationProgress(
  localTemplates: TaskTemplate[],
  localProducts: Product[],
  serverData: { templates: Map<string, string>; products: Map<string, string> }
): MigrationProgress {
  const templates: MigrationItem[] = localTemplates.map(t => {
    const serverId = serverData.templates.get(t.name);
    return {
      localId: t.id,
      name: t.name,
      status: serverId ? 'skipped' : 'pending',
      serverId,
    };
  });

  const products: MigrationItem[] = localProducts.map(p => {
    const serverId = serverData.products.get(p.name);
    return {
      localId: p.id,
      name: p.name,
      status: serverId ? 'skipped' : 'pending',
      serverId,
    };
  });

  const skipped = templates.filter(t => t.status === 'skipped').length +
                  products.filter(p => p.status === 'skipped').length;

  return {
    templates,
    products,
    total: templates.length + products.length,
    completed: 0,
    skipped,
    failed: 0,
  };
}

/**
 * 迁移单个任务模板
 */
async function migrateTemplate(
  template: TaskTemplate,
  item: MigrationItem
): Promise<MigrationItem> {
  if (item.status === 'skipped') {
    return item;
  }

  for (let retry = 0; retry <= MAX_RETRY; retry++) {
    try {
      const res = await TaskTemplateAPI.createTaskTemplate({
        name: template.name,
        description: template.description,
      });

      if (res.success && res.data) {
        return {
          ...item,
          status: 'success',
          serverId: res.data.id?.toString() || res.data.templateNo,
          retryCount: retry,
        };
      }

      // 如果是重复错误，标记为 skipped
      if (res.error?.includes('已存在') || res.error?.includes('duplicate')) {
        return {
          ...item,
          status: 'skipped',
          error: res.error,
        };
      }

      item.error = res.error;
    } catch (e) {
      item.error = (e as Error).message;
    }

    item.retryCount = retry + 1;
  }

  return {
    ...item,
    status: 'failed',
  };
}

/**
 * 迁移单个商品
 */
async function migrateProduct(
  product: Product,
  item: MigrationItem
): Promise<MigrationItem> {
  if (item.status === 'skipped') {
    return item;
  }

  for (let retry = 0; retry <= MAX_RETRY; retry++) {
    try {
      const res = await ProductAPI.createProduct({
        name: product.name,
        description: product.description,
        price: product.price,
        minQuantity: product.minQuantity,
        unit: product.unit,
      });

      if (res.success && res.data) {
        return {
          ...item,
          status: 'success',
          serverId: res.data.id?.toString() || res.data.productNo,
          retryCount: retry,
        };
      }

      // 如果是重复错误，标记为 skipped
      if (res.error?.includes('已存在') || res.error?.includes('duplicate')) {
        return {
          ...item,
          status: 'skipped',
          error: res.error,
        };
      }

      item.error = res.error;
    } catch (e) {
      item.error = (e as Error).message;
    }

    item.retryCount = retry + 1;
  }

  return {
    ...item,
    status: 'failed',
  };
}

/**
 * 执行数据迁移
 * @param onProgress 进度回调
 */
export async function migrateLocalDataToServer(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  // 1. 获取本地数据
  const localData = getLocalDataToMigrate();
  
  // 2. 备份本地数据
  const appData = dataManager.getAppData();
  localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify(appData));

  // 3. 查询服务器已有数据
  const serverData = await getServerData();

  // 4. 初始化迁移进度
  const progress = initMigrationProgress(
    localData.templates,
    localData.products,
    serverData
  );

  // 保存初始进度
  const status = getMigrationStatus();
  status.progress = progress;
  saveMigrationStatus(status);
  onProgress?.(progress);

  // 5. 迁移任务模板
  for (let i = 0; i < progress.templates.length; i++) {
    const item = progress.templates[i];
    if (item.status === 'pending') {
      const template = localData.templates.find(t => t.id === item.localId);
      if (template) {
        progress.templates[i] = await migrateTemplate(template, item);
        
        if (progress.templates[i].status === 'success') {
          progress.completed++;
        } else if (progress.templates[i].status === 'skipped') {
          progress.skipped++;
        } else if (progress.templates[i].status === 'failed') {
          progress.failed++;
        }

        // 保存进度
        status.progress = progress;
        saveMigrationStatus(status);
        onProgress?.(progress);
      }
    }
  }

  // 6. 迁移商品
  for (let i = 0; i < progress.products.length; i++) {
    const item = progress.products[i];
    if (item.status === 'pending') {
      const product = localData.products.find(p => p.id === item.localId);
      if (product) {
        progress.products[i] = await migrateProduct(product, item);
        
        if (progress.products[i].status === 'success') {
          progress.completed++;
        } else if (progress.products[i].status === 'skipped') {
          progress.skipped++;
        } else if (progress.products[i].status === 'failed') {
          progress.failed++;
        }

        // 保存进度
        status.progress = progress;
        saveMigrationStatus(status);
        onProgress?.(progress);
      }
    }
  }

  // 7. 数据校验
  const verified = progress.failed === 0 &&
    progress.total === progress.completed + progress.skipped;

  // 8. 如果校验通过，标记迁移完成
  if (verified) {
    status.migrated = true;
    status.migratedAt = Date.now();
    status.localDataHash = computeLocalDataHash();
    saveMigrationStatus(status);
  }

  const message = verified
    ? `迁移完成：成功 ${progress.completed} 项，跳过 ${progress.skipped} 项`
    : `迁移未完成：失败 ${progress.failed} 项，请重试`;

  return {
    success: verified,
    progress,
    verified,
    message,
  };
}

/**
 * 重置迁移状态（用于重新迁移）
 */
export function resetMigrationStatus(): void {
  localStorage.removeItem(MIGRATION_STATUS_KEY);
}

/**
 * 获取本地备份数据
 */
export function getMigrationBackup(): string | null {
  return localStorage.getItem(MIGRATION_BACKUP_KEY);
}

/**
 * 清除本地备份
 */
export function clearMigrationBackup(): void {
  localStorage.removeItem(MIGRATION_BACKUP_KEY);
}
