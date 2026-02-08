import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/** 创建包含预置积分的 .srdata 文件，用于导入后兑换 */
function createSrdataWithPoints(points: number): string {
  const now = Date.now();
  return JSON.stringify({
    version: '1.1.0',
    exportTime: now,
    data: {
      version: { version: '1.1.0', schemaVersion: 3, createdAt: now, updatedAt: now },
      userData: {
        points,
        pointRecords: [],
        inventory: [],
        customStyle: {},
        enableBackgroundCheck: false,
      },
      taskTemplates: [
        { id: '1', name: '结构化', description: '进行结构化学习', isPreset: true, createdAt: now },
        { id: '2', name: '试讲', description: '进行试讲练习', isPreset: true, createdAt: now },
        { id: '3', name: '刷题', description: '进行题目练习', isPreset: true, createdAt: now },
      ],
      products: [
        { id: 'gold', name: '黄金', description: '兑换黄金', price: 4.8, minQuantity: 0.01, unit: 'g', isPreset: true, createdAt: now },
        { id: 'phone', name: '玩手机', description: '兑换玩手机时长', price: 1, minQuantity: 1, unit: '分钟', isPreset: true, createdAt: now },
      ],
      taskExecutions: [],
    },
  });
}

test.describe('兑换与背包', () => {
  test('localStorage 预置积分→兑换玩手机→背包显示', async ({ page }) => {
    const appData = {
      version: { version: '1.1.0', schemaVersion: 3, createdAt: Date.now(), updatedAt: Date.now() },
      userData: { points: 10, pointRecords: [], inventory: [], customStyle: {}, enableBackgroundCheck: false },
      taskTemplates: [
        { id: '1', name: '结构化', description: '进行结构化学习', isPreset: true, createdAt: Date.now() },
        { id: '2', name: '试讲', description: '进行试讲练习', isPreset: true, createdAt: Date.now() },
        { id: '3', name: '刷题', description: '进行题目练习', isPreset: true, createdAt: Date.now() },
      ],
      products: [
        { id: 'gold', name: '黄金', description: '兑换黄金', price: 4.8, minQuantity: 0.01, unit: 'g', isPreset: true, createdAt: Date.now() },
        { id: 'phone', name: '玩手机', description: '兑换玩手机时长', price: 1, minQuantity: 1, unit: '分钟', isPreset: true, createdAt: Date.now() },
      ],
      taskExecutions: [],
    };

    await page.goto('/');
    await page.evaluate((data) => {
      localStorage.setItem('study_reward_app_data', JSON.stringify(data));
    }, appData);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /结构化|试讲|刷题/ }).first()).toBeVisible({ timeout: 10000 });

    page.on('dialog', (d) => d.accept());

    await page.getByRole('button', { name: /积分商城/ }).click();
    await page.waitForTimeout(500);

    const playPhoneCard = page.locator('.exchange-card').filter({ hasText: '玩手机' });
    await expect(playPhoneCard).toBeVisible({ timeout: 5000 });
    await playPhoneCard.getByRole('button', { name: '立即兑换' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /我的背包/ }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/玩手机/)).toBeVisible({ timeout: 3000 });
  });

  test.skip('导入积分→兑换玩手机→背包显示', async ({ page }) => {
    const srdata = createSrdataWithPoints(10);
    const tmpPath = path.join(process.cwd(), 'test-results', 'import-test.srdata');
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, srdata);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /结构化|试讲|刷题/ }).first()).toBeVisible({ timeout: 10000 });

    page.on('dialog', (d) => d.accept());

    await page.locator('button.data-btn[title="数据管理"]').click();
    await page.getByRole('button', { name: '导入数据' }).waitFor({ state: 'visible', timeout: 2000 });

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }),
      page.getByRole('button', { name: '导入数据' }).click(),
    ]);
    await fileChooser.setFiles(tmpPath);

    await page.waitForLoadState('networkidle');

    // 切换到积分商城
    await page.getByRole('button', { name: /积分商城/ }).click();
    await page.waitForTimeout(500);

    const playPhoneCard = page.locator('.exchange-card').filter({ hasText: '玩手机' });
    await expect(playPhoneCard).toBeVisible({ timeout: 5000 });
    await playPhoneCard.getByRole('button', { name: '立即兑换' }).click();
    await page.waitForTimeout(500);

    // 切换到背包
    await page.getByRole('button', { name: /我的背包/ }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/玩手机/)).toBeVisible({ timeout: 3000 });
  });
});
