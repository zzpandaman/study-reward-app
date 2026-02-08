// 任务模板（任务类型）
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  isPreset: boolean; // 是否为预设任务
  createdAt?: number; // 创建时间
}

// 任务执行记录
export interface TaskExecution {
  id: string;
  executionNo?: string; // 实例编号，HTTP 模式由后端返回，用于 by-no 查询
  taskTemplateId: string; // 对应的任务模板ID
  taskName: string; // 任务名称（快照）
  startTime: number; // 开始时间（秒级时间戳，API 约定）
  endTime?: number; // 结束时间（秒级时间戳）
  pausedTime?: number; // 暂停时间（秒级时间戳）
  totalPausedDuration: number; // 总暂停时长（秒）
  accumulatedExecutionSeconds?: number; // 到最近一次暂停为止的已执行秒数，仅 paused 时有值
  totalExecutionDuration?: number; // 总执行时长（秒），star-reward 后端返回
  actualDuration?: number; // 实际时长（分钟）- 纯学习时间，不包括暂停
  actualReward: number; // 实际获得积分
  status: 'running' | 'paused' | 'completed'; // running: 进行中, paused: 暂停, completed: 完成
  pointsDetails?: Array<{
    intervalType?: string;
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    multiplier?: number;
    points?: number;
  }>; // 积分计算明细（by-no 接口返回）
}

// 商店商品
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // 所需积分（每minQuantity单位的积分）
  minQuantity: number; // 最小数量单位（如：0.1g、1分钟）
  unit?: string; // 单位（如：g、分钟）
  isPreset: boolean; // 是否为预设商品
  createdAt?: number; // 创建时间
}

// 积分记录
export interface PointRecord {
  id: string | number;
  recordNo?: string;
  type: 'earn' | 'spend'; // earn: 获取, spend: 消耗
  amount: number; // 积分数量
  description: string; // 描述
  timestamp?: number; // 时间戳（兼容旧数据）
  createTime?: string; // API 返回的创建时间
  relatedId?: string; // 关联ID（任务实例编号或购买记录编号）
}

// 背包物品
export interface InventoryItem {
  productId: string;
  productName: string;
  quantity: number; // 数量
  unit?: string; // 单位
}

// 自定义样式配置
export interface CustomStyle {
  borderImage?: string; // 边框图片URL（base64或URL）
  cursorImage?: string; // 鼠标图标URL（base64或URL）
  backgroundImage?: string; // 背景图片URL（base64或URL）
  borderStyle?: string; // 边框样式预设名称
  cursorStyle?: string; // 鼠标样式预设名称
  backgroundStyle?: string; // 背景样式预设名称
}

// 用户数据
export interface UserData {
  points: number; // 总积分
  pointRecords: PointRecord[]; // 积分记录
  inventory: InventoryItem[]; // 背包物品
  customStyle?: CustomStyle; // 自定义样式
  enableBackgroundCheck?: boolean; // 是否启用后台检测（默认false：不检测，一直计时）
}

// 数据版本信息
export interface DataVersion {
  version: string; // 数据版本号
  schemaVersion: number; // 数据结构版本
  createdAt: number; // 创建时间
  updatedAt: number; // 更新时间
}

// 完整应用数据
export interface AppData {
  version: DataVersion; // 版本信息
  userData: UserData; // 用户数据
  taskTemplates: TaskTemplate[]; // 任务模板（包括自定义）
  products: Product[]; // 商品列表（包括自定义）
  taskExecutions: TaskExecution[]; // 任务执行记录
}

// 导出数据格式
export interface ExportData {
  version: string;
  exportTime: number;
  data: AppData; // 完整应用数据
}
