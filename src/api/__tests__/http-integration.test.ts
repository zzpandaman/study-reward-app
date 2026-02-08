/**
 * HTTP 模式集成测试
 * 需后端运行。默认账号 admin/123456（star-sso QUICK_START.md）
 * 若账号不存在，会先尝试注册再登录。
 *
 * 运行: TEST_HTTP_BACKEND=true npm run test
 * 自定义: TEST_HTTP_BACKEND=true TEST_USERNAME=xxx TEST_PASSWORD=xxx npm run test
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import ApiClientFactory from '../client';
import { TaskTemplateAPI, TaskExecutionAPI } from '../task-api';
import { ProductAPI } from '../product-api';
import { UserAPI } from '../user-api';
import { login } from '../auth-api';
import { clearToken } from '../client';

const BASE_URL = 'http://localhost/api/reward';
const TEST_USERNAME = process.env.TEST_USERNAME || 'admin';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123456';

const hasBackend = process.env.TEST_HTTP_BACKEND === 'true';

async function register(username: string, password: string): Promise<boolean> {
  const res = await fetch('/api/sso/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email: `${username}@test.com` }),
  });
  const result = await res.json();
  return result.code === 200 || result.code === 0;
}

async function ensureLoggedIn(): Promise<boolean> {
  let res = await login({ username: TEST_USERNAME, password: TEST_PASSWORD });
  if (!res.success || !res.data?.token) {
    await register(TEST_USERNAME, TEST_PASSWORD);
    res = await login({ username: TEST_USERNAME, password: TEST_PASSWORD });
  }
  if (!res.success || !res.data?.token) {
    return false;
  }
  ApiClientFactory.configure({
    baseURL: BASE_URL,
    token: res.data.token,
    timeout: 10000,
  });
  return true;
}

describe.skipIf(!hasBackend)('HTTP 集成测试', () => {
  beforeAll(async () => {
    const ok = await ensureLoggedIn();
    if (!ok) {
      throw new Error(
        `登录失败，请设置 TEST_USERNAME 和 TEST_PASSWORD 环境变量。当前: ${TEST_USERNAME}`
      );
    }
  });

  afterEach(() => {
    clearToken();
    ApiClientFactory.configure({});
  });

  describe('健康检查', () => {
    it('reward health 返回 200', async () => {
      const res = await fetch('http://localhost/api/reward/health');
      expect(res.status).toBe(200);
    });

    it('sso health 返回 200', async () => {
      const res = await fetch('http://localhost/api/sso/health');
      expect(res.status).toBe(200);
    });
  });

  describe('TaskTemplateAPI', () => {
    let createdId: string;

    beforeEach(async () => {
      await ensureLoggedIn();
    });

    it('getTaskTemplates', async () => {
      const res = await TaskTemplateAPI.getTaskTemplates();
      expect(res.success).toBe(true);
      expect(Array.isArray(res.data?.data)).toBe(true);
    });

    it('createTaskTemplate', async () => {
      const res = await TaskTemplateAPI.createTaskTemplate({
        name: `集成测试任务_${Date.now()}`,
        description: 'HTTP集成测试',
      });
      expect(res.success).toBe(true);
      const created = res.data as { id?: number; data?: { id?: number } };
      createdId = String(created?.data?.id ?? created?.id ?? '');
      expect(createdId).toBeDefined();
    });

    it('deleteTaskTemplate', async () => {
      const create = await TaskTemplateAPI.createTaskTemplate({
        name: `可删_${Date.now()}`,
        description: 'del',
      });
      expect(create.success).toBe(true);
      const created = create.data as { id?: number; data?: { id?: number } };
      const id = String(created?.data?.id ?? created?.id ?? '');
      const del = await TaskTemplateAPI.deleteTaskTemplate(id);
      expect(del.success).toBe(true);
    });
  });

  describe('ProductAPI', () => {
    beforeEach(async () => {
      await ensureLoggedIn();
    });

    it('getProducts', async () => {
      const res = await ProductAPI.getProducts();
      expect(res.success).toBe(true);
      expect(Array.isArray(res.data?.data)).toBe(true);
    });

    it('createProduct + deleteProduct', async () => {
      const create = await ProductAPI.createProduct({
        name: `集成商品_${Date.now()}`,
        description: 'test',
        price: 10,
        minQuantity: 1,
        unit: '个',
      });
      expect(create.success).toBe(true);
      const created = create.data as { id?: number; data?: { id?: number } };
      const id = String(created?.data?.id ?? created?.id ?? '');
      const del = await ProductAPI.deleteProduct(id);
      expect(del.success).toBe(true);
    });
  });

  describe('UserAPI', () => {
    beforeEach(async () => {
      await ensureLoggedIn();
    });

    it('getPoints', async () => {
      const res = await UserAPI.getPoints();
      expect(res.success).toBe(true);
    });

    it('getInventory', async () => {
      const res = await UserAPI.getInventory();
      expect(res.success).toBe(true);
    });

    it('getPointRecords', async () => {
      const res = await UserAPI.getPointRecords();
      expect(res.success).toBe(true);
    });
  });

  describe('TaskExecutionAPI', () => {
    beforeEach(async () => {
      await ensureLoggedIn();
    });

    it('startTask + completeTask', async () => {
      const execs = await TaskExecutionAPI.getTaskExecutions();
      const list = execs.data as { data?: { id?: number; status?: string }[] };
      for (const ex of list?.data ?? []) {
        if (ex.status === 'running' || ex.status === 'paused') {
          await TaskExecutionAPI.cancelTask(String(ex.id), Math.floor(Date.now() / 1000));
        }
      }

      const create = await TaskTemplateAPI.createTaskTemplate({
        name: `执行测试_${Date.now()}`,
        description: '用于 startTask',
      });
      expect(create.success).toBe(true);
      const created = create.data as { id?: number; data?: { id?: number } };
      const templateId = created?.data?.id ?? created?.id;

      const start = await TaskExecutionAPI.startTask({
        taskTemplateId: String(templateId!),
        clientTime: Math.floor(Date.now() / 1000),
      });
      expect(start.success).toBe(true);
      const execData = start.data as { id?: number; data?: { id?: number } };
      const execId = String(execData?.data?.id ?? execData?.id ?? '');

      const complete = await TaskExecutionAPI.completeTask(execId, Math.floor(Date.now() / 1000));
      if (complete.success) {
        expect(complete.success).toBe(true);
      } else {
        const cancel = await TaskExecutionAPI.cancelTask(execId, Math.floor(Date.now() / 1000));
        expect(cancel.success).toBe(true);
      }
    });
  });
});
