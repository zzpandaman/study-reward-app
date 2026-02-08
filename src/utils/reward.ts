/**
 * 积分与兑换相关工具函数
 */
export const calculateReward = (minutes: number): number =>
  Math.round(1 * minutes);

export const calculateGoldPrice = (grams: number): number =>
  Math.round(grams * 480 * 100) / 100;
