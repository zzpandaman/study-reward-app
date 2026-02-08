import { test, expect } from '@playwright/test';

test.describe('任务计时', () => {
  test('开始任务后显示 0 分钟', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 等待任务列表加载
    await expect(page.getByRole('heading', { name: /结构化|试讲|刷题/ }).first()).toBeVisible({ timeout: 10000 });

    // 若已有进行中任务，先取消
    const cancelBtn = page.getByRole('button', { name: '取消任务' });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.getByRole('button', { name: '确定' }).click();
      await page.waitForTimeout(500);
    }

    // 选择任务并开始（点击任务卡片）
    await page.locator('.task-template-card').filter({ hasText: '结构化' }).first().click();
    await page.getByRole('button', { name: '开始任务' }).click();

    // 验证初始显示 0 分钟且计时区域可见
    const timerInfo = page.getByText(/学习时间:.*分钟/);
    await expect(timerInfo).toBeVisible({ timeout: 3000 });
    await expect(timerInfo).toContainText('学习时间: 0 分钟');
  });
});
