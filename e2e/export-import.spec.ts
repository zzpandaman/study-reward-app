import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('导出', () => {
  test('导出数据下载 .srdata 且格式正确', async ({ page }) => {
    page.once('dialog', (d) => d.accept());
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /结构化|试讲|刷题/ }).first()).toBeVisible({ timeout: 10000 });

    await page.locator('button.data-btn[title="数据管理"]').click();
    await page.getByRole('button', { name: '导出数据' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.srdata$/);
    const savePath = path.join(process.cwd(), 'test-results', download.suggestedFilename());
    await download.saveAs(savePath);

    const content = fs.readFileSync(savePath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.version).toBeDefined();
    expect(parsed.exportTime).toBeDefined();
    expect(parsed.data).toBeDefined();
    expect(parsed.data.userData).toBeDefined();
    expect(parsed.data.taskTemplates).toBeDefined();
    expect(parsed.data.products).toBeDefined();
  });
});

test.describe('导入', () => {
  test('导入有效 .srdata 数据合并', async ({ page }) => {
    const srdata = JSON.stringify({
      version: '1.1.0',
      exportTime: Date.now(),
      data: {
        version: { version: '1.1.0', schemaVersion: 3, createdAt: Date.now(), updatedAt: Date.now() },
        userData: { points: 0, pointRecords: [], inventory: [], customStyle: {}, enableBackgroundCheck: false },
        taskTemplates: [
          { id: 'custom-1', name: 'E2E自定义任务', description: '导入测试', isPreset: false, createdAt: Date.now() },
        ],
        products: [
          { id: 'gold', name: '黄金', description: '兑换黄金', price: 4.8, minQuantity: 0.01, unit: 'g', isPreset: true, createdAt: Date.now() },
          { id: 'phone', name: '玩手机', description: '兑换玩手机时长', price: 1, minQuantity: 1, unit: '分钟', isPreset: true, createdAt: Date.now() },
        ],
        taskExecutions: [],
      },
    });
    const tmpPath = path.join(process.cwd(), 'test-results', 'import-merge.srdata');
    fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
    fs.writeFileSync(tmpPath, srdata);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    page.on('dialog', (d) => d.accept());

    await page.locator('button.data-btn[title="数据管理"]').click();

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      page.getByRole('button', { name: '导入数据' }).click(),
    ]);
    await fileChooser.setFiles(tmpPath);

    await page.waitForLoadState('networkidle');

    await expect(page.getByText('E2E自定义任务')).toBeVisible({ timeout: 5000 });
  });
});
