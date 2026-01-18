/**
 * 数据管理器
 * 负责数据版本管理、迁移、验证
 */
import { AppData, TaskTemplate, TaskExecution, Product, UserData, PointRecord, InventoryItem } from '../types';
import { StorageAdapterFactory, LocalStorageAdapter } from './storage-adapter';

const CURRENT_SCHEMA_VERSION = 3;
const CURRENT_VERSION = '1.1.0';

// 预设数据
export const PRESET_TASK_TEMPLATES: TaskTemplate[] = [
  { id: '1', name: '结构化', description: '进行结构化学习', isPreset: true, createdAt: Date.now() },
  { id: '2', name: '试讲', description: '进行试讲练习', isPreset: true, createdAt: Date.now() },
  { id: '3', name: '刷题', description: '进行题目练习', isPreset: true, createdAt: Date.now() },
];

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'gold', name: '黄金', description: '兑换黄金', price: 4.8, minQuantity: 0.01, unit: 'g', isPreset: true, createdAt: Date.now() },
  { id: 'phone', name: '玩手机', description: '兑换玩手机时长', price: 1, minQuantity: 1, unit: '分钟', isPreset: true, createdAt: Date.now() },
];

export class DataManager {
  private adapter = StorageAdapterFactory.getAdapter()
  
  /**
   * 浮点数精度处理：四舍五入到指定小数位
   * @param num 要处理的数字
   * @param decimals 保留的小数位数
   */
  private roundToPrecision(num: number, decimals: number = 2): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
  
  /**
   * 根据商品单位确定精度位数
   * @param unit 商品单位
   */
  private getPrecisionByUnit(unit: string): number {
    // 黄金等以 g 为单位的商品，最小单位是 0.01g，需要保留 2 位小数
    if (unit === 'g' || unit === '克') {
      return 2;
    }
    // 其他商品通常保留整数或 1 位小数
    return 1;
  }
  
  /**
   * 修复库存数量的精度问题
   * @param inventory 库存列表
   */
  private fixInventoryPrecision(inventory: InventoryItem[]): InventoryItem[] {
    return inventory.map(item => {
      const precision = this.getPrecisionByUnit(item.unit || '');
      return {
        ...item,
        quantity: this.roundToPrecision(item.quantity, precision),
      };
    });
  };

  /**
   * 获取应用数据（带自动迁移）
   */
  getAppData(): AppData {
    // 1. 尝试读取新格式数据
    const existingData = this.adapter.read();
    if (existingData) {
      // 检查版本，需要迁移则迁移
      let data = existingData;
      if (existingData.version.schemaVersion < CURRENT_SCHEMA_VERSION) {
        data = this.migrateToCurrentVersion(existingData);
      }
      // 修复库存数量的精度问题
      data.userData.inventory = this.fixInventoryPrecision(data.userData.inventory);
      // 确保预设商品使用最新配置（不影响用户数据）
      return this.updatePresetProducts(data);
    }

    // 2. 尝试从旧版本迁移
    if (this.adapter instanceof LocalStorageAdapter && this.adapter.hasLegacyData()) {
      const migrated = this.migrateFromLegacy();
      if (migrated) {
        // 确保预设商品使用最新配置
        return this.updatePresetProducts(migrated);
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
        minQuantity: (p as any).minQuantity ?? 1, // 兼容旧数据，默认minQuantity为1
        createdAt: p.createdAt || Date.now(),
      }));
    }

    // Schema v2 -> v3 迁移：添加minQuantity字段
    if (data.version.schemaVersion < 3) {
      data.products = data.products.map((p) => {
        // 如果已有minQuantity，保持不变；否则根据商品类型设置默认值
        if ((p as any).minQuantity !== undefined) {
          return p;
        }
        
        // 根据商品ID或名称推断minQuantity
        if (p.id === 'gold' || p.name.includes('黄金')) {
          return { ...p, minQuantity: 0.01, price: 4.8 };
        } else if (p.id === 'phone' || p.name.includes('玩手机')) {
          return { ...p, minQuantity: 1 };
        } else {
          return { ...p, minQuantity: 1 };
        }
      });
    }

    // 保存迁移后的数据
    this.saveAppData(data);
    return data;
  }

  /**
   * 更新预设商品为最新配置（不影响用户自定义商品）
   * 确保只保留真正的预设商品（来自DEFAULT_PRODUCTS）和用户自定义商品
   * 同类商品（相同名称）只保留最小单位的一个
   */
  private updatePresetProducts(data: AppData): AppData {
    // 分离自定义商品：只保留 isPreset 为 false 的商品（确保是用户自己添加的）
    // 根据 isPreset 字段判断，所有 isPreset: false 的商品都是用户自定义的，应该保留
    const customProducts = data.products.filter(p => !p.isPreset);
    
    // 去重自定义商品：同类商品（相同名称）只保留 minQuantity 最小的一个
    const customProductsByName = new Map<string, Product>();
    customProducts.forEach(product => {
      const existing = customProductsByName.get(product.name);
      if (!existing) {
        customProductsByName.set(product.name, product);
      } else {
        const currentMinQty = product.minQuantity ?? 1;
        const existingMinQty = existing.minQuantity ?? 1;
        if (currentMinQty < existingMinQty) {
          customProductsByName.set(product.name, product);
        }
      }
    });

    // 构建新的商品列表：预设商品（使用最新配置）+ 去重后的自定义商品
    const updatedProducts: Product[] = [];
    
    // 先添加所有预设商品（使用最新配置）
    DEFAULT_PRODUCTS.forEach(presetProduct => {
      updatedProducts.push(presetProduct);
    });
    
    // 再添加去重后的自定义商品，确保 isPreset 为 false
    customProductsByName.forEach(customProduct => {
      // 检查是否与预设商品重名，如果重名且预设商品已存在，跳过自定义商品（预设商品优先）
      const hasPresetWithSameName = DEFAULT_PRODUCTS.some(
        preset => preset.name === customProduct.name
      );
      
      // 如果自定义商品与预设商品同名，且预设商品已在列表中，则不添加自定义商品
      // 否则添加自定义商品
      if (!hasPresetWithSameName) {
        updatedProducts.push({
          ...customProduct,
          isPreset: false,
        });
      } else {
        // 如果自定义商品与预设商品同名，检查是否需要更新预设商品
        // 如果自定义商品的 minQuantity 更小，说明预设商品应该使用更小的值（但这种情况不应该发生）
        // 默认情况下，预设商品优先
      }
    });

    // 最后再次去重：确保没有重复（虽然理论上不应该有，但双重保险）
    const finalProducts = new Map<string, Product>();
    updatedProducts.forEach(product => {
      const existing = finalProducts.get(product.name);
      if (!existing) {
        finalProducts.set(product.name, product);
      } else {
        const currentMinQty = product.minQuantity ?? 1;
        const existingMinQty = existing.minQuantity ?? 1;
        if (currentMinQty < existingMinQty) {
          finalProducts.set(product.name, product);
        }
      }
    });

    data.products = Array.from(finalProducts.values());

    // 保存更新后的数据
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

    // 过滤掉无效的任务模板（name或description为空）
    if (data.taskTemplates) {
      data.taskTemplates = data.taskTemplates.filter(
        (template) => template.name && template.name.trim() && template.description && template.description.trim()
      );
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
   * 检测字段差异
   */
  private detectFieldDifferences<T extends Record<string, any>>(
    local: T,
    imported: T,
    fields: Array<keyof T>,
    fieldNames: Record<string, string>
  ): string[] {
    const differences: string[] = [];
    for (const field of fields) {
      if (local[field] !== imported[field]) {
        const fieldName = fieldNames[String(field)] || String(field);
        const localValue = local[field];
        const importedValue = imported[field];
        differences.push(`- ${fieldName}：本地${localValue} vs 导入${importedValue}`);
      }
    }
    return differences;
  }

  /**
   * 导入数据（智能合并模式）
   * 基于业务唯一键（name）自动判断：name相同的项目如果其他字段不同则报错
   * @param jsonData JSON格式的导入数据
   */
  importData(jsonData: string): { success: boolean; message: string; stats?: { added: number; updated: number; merged: number } } {
    try {
      const imported = JSON.parse(jsonData);

      if (!imported.data || !imported.data.userData) {
        return { success: false, message: '数据格式不正确' };
      }

      const localData = this.getAppData();
      const stats = { added: 0, updated: 0, merged: 0 };
      
      // ========== 第一步：合并任务模板（使用name作为唯一键） ==========
      const localTemplates = localData.taskTemplates.filter((t: TaskTemplate) => !t.isPreset);
      const importedTemplates: TaskTemplate[] = imported.data.taskTemplates || [];
      const importedCustomTemplates = importedTemplates.filter((t: TaskTemplate) => !t.isPreset);
      
      const templateMap = new Map<string, TaskTemplate>(); // name -> Template
      
      // 先添加本地自定义任务
      localTemplates.forEach((t: TaskTemplate) => {
        templateMap.set(t.name, t);
      });
      
      // 再添加导入的自定义任务，检查冲突
      for (const t of importedCustomTemplates) {
        const existing = templateMap.get(t.name);
        if (!existing) {
          // 新任务，添加（使用导入的ID）
          templateMap.set(t.name, t);
          stats.added++;
        } else {
          // 已存在，检查所有字段差异
          const differences = this.detectFieldDifferences(
            existing,
            t,
            ['description', 'isPreset'],
            { description: '描述', isPreset: '预设标识' }
          );
          if (differences.length > 0) {
            return { 
              success: false, 
              message: `任务"${t.name}"存在冲突：本地和导入的字段不同。\n${differences.join('\n')}\n请先删除冲突项，再重新导出导入。` 
            };
          }
          // 字段相同，比较时间戳，保留更新的
          const existingTime = existing.createdAt || 0;
          const importedTime = t.createdAt || 0;
          if (importedTime > existingTime) {
            // 使用导入的任务，但保留本地ID（确保ID稳定性）
            const updatedTemplate = { ...t, id: existing.id };
            templateMap.set(t.name, updatedTemplate);
            stats.updated++;
          } else {
            // 保留本地任务
            stats.merged++;
          }
        }
      }
      
      // 添加预设任务（从本地获取最新版本）
      const localPresetTemplates = localData.taskTemplates.filter((t: TaskTemplate) => t.isPreset);
      localPresetTemplates.forEach((t: TaskTemplate) => {
        templateMap.set(t.name, t);
      });
      
      // ========== 第二步：合并商品（使用name作为唯一键） ==========
      const localProducts = localData.products.filter((p: Product) => !p.isPreset);
      const importedProducts: Product[] = imported.data.products || [];
      const importedCustomProducts = importedProducts.filter((p: Product) => !p.isPreset);
      
      const productMap = new Map<string, Product>(); // name -> Product
      
      localProducts.forEach((p: Product) => {
        productMap.set(p.name, p);
      });
      
      for (const p of importedCustomProducts) {
        const existing = productMap.get(p.name);
        if (!existing) {
          productMap.set(p.name, p);
          stats.added++;
        } else {
          // 已存在，检查所有字段差异
          const differences = this.detectFieldDifferences(
            existing,
            p,
            ['description', 'price', 'minQuantity', 'unit', 'isPreset'],
            { 
              description: '描述', 
              price: '价格', 
              minQuantity: '最小数量', 
              unit: '单位',
              isPreset: '预设标识'
            }
          );
          if (differences.length > 0) {
            return { 
              success: false, 
              message: `商品"${p.name}"存在冲突：本地和导入的字段不同。\n${differences.join('\n')}\n请先删除冲突项，再重新导出导入。` 
            };
          }
          // 字段相同，比较时间戳，保留更新的
          const existingTime = existing.createdAt || 0;
          const importedTime = p.createdAt || 0;
          if (importedTime > existingTime) {
            // 使用导入的商品，但保留本地ID（确保ID稳定性）
            const updatedProduct = { ...p, id: existing.id };
            productMap.set(p.name, updatedProduct);
            stats.updated++;
          } else {
            // 保留本地商品
            stats.merged++;
          }
        }
      }
      
      // 添加预设商品（从本地获取最新版本）
      const localPresetProducts = localData.products.filter((p: Product) => p.isPreset);
      localPresetProducts.forEach((p: Product) => {
        productMap.set(p.name, p);
      });
      
      // ========== 第三步：合并积分记录（使用type + relatedId + timestamp作为唯一键，更新relatedId） ==========
      const localPointRecords: PointRecord[] = localData.userData.pointRecords || [];
      const importedPointRecords: PointRecord[] = imported.data.userData.pointRecords || [];
      const pointRecordMap = new Map<string, PointRecord>();
      
      /**
       * 更新积分记录的relatedId
       * type='earn' → relatedId指向任务模板ID
       * type='spend' → relatedId指向商品ID
       */
      const updateRelatedId = (record: PointRecord): PointRecord => {
        if (!record.relatedId) {
          return record;
        }
        
        if (record.type === 'earn') {
          // 通过ID查找任务模板
          const task = Array.from(templateMap.values()).find(t => t.id === record.relatedId);
          if (task) {
            return record; // ID存在，无需更新
          }
          
          // 找不到，通过name查找（从描述解析：格式"完成任务: 任务名称"）
          const nameMatch = record.description.match(/完成任务:\s*([^(]+)/);
          if (nameMatch) {
            const taskName = nameMatch[1].trim();
            const foundTask = templateMap.get(taskName);
            if (foundTask) {
              return { ...record, relatedId: foundTask.id };
            }
          }
          
          // 找不到对应任务，返回原记录（可能任务已删除）
          return record;
        } else if (record.type === 'spend') {
          // 通过ID查找商品
          const product = Array.from(productMap.values()).find(p => p.id === record.relatedId);
          if (product) {
            return record; // ID存在，无需更新
          }
          
          // 找不到，通过name查找（从描述解析：格式"兑换商品名: 数量单位"）
          const nameMatch = record.description.match(/兑换([^:]+):/);
          if (nameMatch) {
            const productName = nameMatch[1].trim();
            const foundProduct = productMap.get(productName);
            if (foundProduct) {
              return { ...record, relatedId: foundProduct.id };
            }
          }
          
          // 找不到对应商品，返回原记录（可能商品已删除）
          return record;
        }
        
        return record;
      };
      
      // 处理本地积分记录，更新relatedId
      localPointRecords.forEach((r: PointRecord) => {
        const updatedRecord = updateRelatedId(r);
        const key = `${updatedRecord.type}_${updatedRecord.relatedId || 'none'}_${updatedRecord.timestamp}`;
        pointRecordMap.set(key, updatedRecord);
      });
      
      // 处理导入的积分记录，更新relatedId并合并
      for (const r of importedPointRecords) {
        // 先更新relatedId
        const updatedRecord = updateRelatedId(r);
        const key = `${updatedRecord.type}_${updatedRecord.relatedId || 'none'}_${updatedRecord.timestamp}`;
        
        const existing = pointRecordMap.get(key);
        if (!existing) {
          // 新记录，添加
          pointRecordMap.set(key, updatedRecord);
          stats.added++;
        } else {
          // 已存在，检查所有字段差异
          const differences = this.detectFieldDifferences(
            existing,
            updatedRecord,
            ['amount', 'description'],
            { amount: '积分数量', description: '描述' }
          );
          if (differences.length > 0) {
            const typeText = updatedRecord.type === 'earn' ? '获取' : '消耗';
            return { 
              success: false, 
              message: `积分记录存在冲突：${typeText}记录在时间 ${new Date(updatedRecord.timestamp).toLocaleString()} 的记录，本地和导入的字段不同。\n${differences.join('\n')}\n请先删除冲突项，再重新导出导入。` 
            };
          }
          // 字段相同，保留本地版本
          stats.merged++;
        }
      }
      
      // ========== 第四步：从积分记录计算背包和总积分 ==========
      const spendRecords = Array.from(pointRecordMap.values()).filter(r => r.type === 'spend' && r.relatedId);
      
      // 从积分记录中提取商品兑换信息
      // 描述格式通常是："兑换商品名: 数量单位" 例如："兑换黄金: 0.01g"
      const inventoryMap = new Map<string, InventoryItem>();
      
      // 遍历所有消费记录，计算每个商品的数量
      for (const record of spendRecords) {
        if (!record.relatedId) continue;
        
        // 从商品列表中找到对应的商品（通过ID或名称匹配）
        const product = Array.from(productMap.values()).find(p => 
          p.id === record.relatedId || p.name === record.relatedId
        );
        if (!product) {
          // 如果找不到商品，尝试从描述中解析商品名
          const nameMatch = record.description.match(/兑换([^:]+):/);
          if (nameMatch) {
            const productName = nameMatch[1].trim();
            const foundProduct = Array.from(productMap.values()).find(p => p.name === productName);
            if (foundProduct) {
              // 从描述中解析数量，格式："兑换商品名: 数量单位"
              const quantityMatch = record.description.match(/:\s*([\d.]+)(\w+)/);
              if (quantityMatch) {
                const quantity = parseFloat(quantityMatch[1]);
                const key = `${foundProduct.name}_${foundProduct.unit || ''}`;
                const existing = inventoryMap.get(key);
                const precision = this.getPrecisionByUnit(foundProduct.unit || '');
                
                if (existing) {
                  const newQuantity = this.roundToPrecision(existing.quantity + quantity, precision);
                  inventoryMap.set(key, {
                    ...existing,
                    quantity: newQuantity,
                  });
                } else {
                  inventoryMap.set(key, {
                    productId: foundProduct.id,
                    productName: foundProduct.name,
                    quantity: this.roundToPrecision(quantity, precision),
                    unit: foundProduct.unit,
                  });
                }
              }
            }
          }
          continue;
        }
        
        // 从描述中解析数量，格式："兑换商品名: 数量单位"
        const quantityMatch = record.description.match(/:\s*([\d.]+)(\w+)/);
        if (quantityMatch) {
          const quantity = parseFloat(quantityMatch[1]);
          const key = `${product.name}_${product.unit || ''}`;
          const existing = inventoryMap.get(key);
          const precision = this.getPrecisionByUnit(product.unit || '');
          
          if (existing) {
            const newQuantity = this.roundToPrecision(existing.quantity + quantity, precision);
            inventoryMap.set(key, {
              ...existing,
              quantity: newQuantity,
            });
          } else {
            inventoryMap.set(key, {
              productId: product.id,
              productName: product.name,
              quantity: this.roundToPrecision(quantity, precision),
              unit: product.unit,
            });
          }
        }
      }
      
      // 从积分记录计算总积分（不能直接取最大值，需要从记录计算）
      const allPointRecords = Array.from(pointRecordMap.values());
      let calculatedPoints = 0;
      for (const record of allPointRecords) {
        if (record.type === 'earn') {
          calculatedPoints += record.amount;
        } else if (record.type === 'spend') {
          calculatedPoints -= record.amount;
        }
      }
      
      // 修复库存数量的精度问题
      const finalInventory = this.fixInventoryPrecision(Array.from(inventoryMap.values()));
      
      const appData: AppData = {
        taskTemplates: Array.from(templateMap.values()),
        products: Array.from(productMap.values()),
        taskExecutions: localData.taskExecutions || [], // 任务执行记录保持不变（包含运行状态等，不影响积分记录）
        userData: {
          ...localData.userData,
          points: calculatedPoints, // 从积分记录计算得出
          pointRecords: Array.from(pointRecordMap.values()),
          inventory: finalInventory, // 从积分记录计算得出，并修复精度
          customStyle: localData.userData.customStyle || imported.data.userData.customStyle,
        },
        version: {
          version: CURRENT_VERSION,
          schemaVersion: CURRENT_SCHEMA_VERSION,
          createdAt: localData.version.createdAt,
          updatedAt: Date.now(),
        },
      };

      this.validateData(appData);
      // 确保预设商品使用最新配置
      const finalData = this.updatePresetProducts(appData);
      this.saveAppData(finalData);

      const statsText = `新增 ${stats.added} 项，更新 ${stats.updated} 项，合并 ${stats.merged} 项`;
      return { success: true, message: `数据导入成功！${statsText}`, stats };
    } catch (error) {
      return { success: false, message: '数据导入失败：' + (error as Error).message };
    }
  }
}

// 单例实例
export const dataManager = new DataManager();
