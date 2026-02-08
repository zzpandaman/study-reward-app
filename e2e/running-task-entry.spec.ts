import { test, expect } from '@playwright/test';

test.describe('进行中任务入口', () => {
  test('header 入口点击返回任务 tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /结构化|试讲|刷题/ }).first()).toBeVisible({ timeout: 10000 });

    const cancelBtn = page.getByRole('button', { name: '取消任务' });
    if (await cancelBtn.isVisible()) {
      page.once('dialog', (d) => d.accept());
      await cancelBtn.click();
      await page.getByRole('button', { name: '确定' }).click();
      await page.waitForTimeout(500);
    }

    await page.locator('.task-template-card').filter({ hasText: '结构化' }).first().click();
    await page.getByRole('button', { name: '开始任务' }).click();

    await expect(page.getByText(/学习时间:.*分钟/)).toBeVisible({ timeout: 3000 });

    // 切换到商品 tab
    await page.getByRole('button', { name: /积分商城/ }).click();
    await expect(page.getByRole('heading', { name: '黄金' }).or(page.getByRole('heading', { name: '玩手机' })).first()).toBeVisible({ timeout: 3000 });

    // 点击 header 进行中入口
    await page.getByRole('button', { name: /进行中:/ }).click();

    await expect(page.getByText(/学习时间:.*分钟/)).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: '完成任务' })).toBeVisible();
  });

  test.skip('banner 入口：有历史 running 任务时刷新可点击进入', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /结构化|试讲|刷题/ }).first()).toBeVisible({ timeout: 10000 });

    const cancelBtn = page.getByRole('button', { name: '取消任务' });
    if (await cancelBtn.isVisible()) {
      page.once('dialog', (d) => d.accept());
      await cancelBtn.click();
      await page.getByRole('button', { name: '确定' }).click();
      await page.waitForTimeout(500);
    }

    await page.locator('.task-template-card').filter({ hasText: '结构化' }).first().click();
    await page.getByRole('button', { name: '开始任务' }).click();
    await expect(page.getByText(/学习时间:.*分钟/)).toBeVisible({ timeout: 3000 });

    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const banner = page.getByRole('button', { name: /你有进行中的任务.*点击进入/ });
    await expect(banner).toBeVisible({ timeout: 5000 });
    await banner.click();
    await expect(page.getByText(/学习时间:.*分钟/)).toBeVisible({ timeout: 3000 });
  });
});
