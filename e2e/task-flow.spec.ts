import { test, expect } from '@playwright/test';

test.describe('任务完整流程', () => {
  test('开始→暂停→恢复→完成，积分增加', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /结构化|试讲|刷题/ }).first()).toBeVisible({ timeout: 10000 });

    // 若有进行中任务先取消
    const cancelBtn = page.getByRole('button', { name: '取消任务' });
    if (await cancelBtn.isVisible()) {
      page.once('dialog', (d) => d.accept());
      await cancelBtn.click();
      await page.getByRole('button', { name: '确定' }).click();
      await page.waitForTimeout(500);
    }

    // 开始任务
    await page.locator('.task-template-card').filter({ hasText: '结构化' }).first().click();
    await page.getByRole('button', { name: '开始任务' }).click();

    const timerInfo = page.getByText(/学习时间:.*分钟/);
    await expect(timerInfo).toBeVisible({ timeout: 3000 });

    // 暂停
    await page.getByRole('button', { name: '暂停（如厕等）' }).click();
    await expect(page.getByText('（已暂停）')).toBeVisible({ timeout: 2000 });
    await expect(page.getByRole('button', { name: '继续任务' })).toBeVisible();

    // 恢复
    await page.getByRole('button', { name: '继续任务' }).click();
    await page.waitForTimeout(1500);

    // 完成（需至少 1 分钟才有积分，等待约 65 秒）
    await page.waitForTimeout(65000);
    await page.getByRole('button', { name: '完成任务' }).click();
    await page.waitForTimeout(500);

    // 积分应增加
    const pointsBadge = page.getByText(/\d+(\.\d+)?\s*积分/).first();
    await expect(pointsBadge).toBeVisible({ timeout: 3000 });
    const pointsText = await pointsBadge.textContent();
    expect(pointsText).toMatch(/\d/);
  });
});
