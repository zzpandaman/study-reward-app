# 功能测试用例

## 自动化测试

### 本地模式（无需后端）

```bash
npm run test
```

覆盖：任务模板 CRUD、任务执行、商品 CRUD、用户积分/背包/记录、兑换、导出导入、api-error。

### HTTP 集成测试（需后端 + 测试账号）

默认账号 `admin/123456`（star-sso QUICK_START.md）。若不存在会先注册再登录。

```bash
TEST_HTTP_BACKEND=true npm run test
```

自定义账号：

```bash
TEST_HTTP_BACKEND=true TEST_USERNAME=xxx TEST_PASSWORD=xxx npm run test
```

覆盖：健康检查、登录、任务模板、商品、用户数据、任务执行（startTask + complete/cancel）。

---

## E2E 测试（Playwright）

```bash
npm run test:e2e         # headless
npm run test:e2e:headed  # 可见浏览器（供观察操作）
```

|  spec  | 覆盖 |
|--------|------|
| task-timer | 开始任务后显示 0 分钟 |
| task-flow | 开始→暂停→恢复→完成，积分增加 |
| exchange-inventory | 预置积分→兑换→背包展示 |
| export-import | 导出 .srdata 格式校验、导入数据合并 |
| running-task-entry | header「进行中」入口点击返回任务 tab |

---

## 手动测试 checklist

### 前置

- [ ] 后端已启动：`curl http://localhost/api/reward/health` 返回 200
- [ ] HTTP 模式：`.env.local` 中 `VITE_API_BASE_URL=/api/reward`

### 用例

| ID | 模块 | 步骤 | 预期 |
|----|------|------|------|
| TC-01 | 健康 | 访问 /api/reward/health | 200 |
| TC-02 | 登录 | 无 Token 时打开应用 | 弹出 LoginModal |
| TC-02b | 登录 | 正确账号密码 | 登录成功 |
| TC-03 | 任务 | 新建/删除非预设模板 | 成功 |
| TC-04 | 任务 | 开始→暂停→恢复→完成 | 积分增加 |
| TC-05 | 商品 | 新建/删除非预设商品 | 成功 |
| TC-06 | 兑换 | 积分足够时兑换 | 积分减、背包增 |
| TC-07 | 背包 | 查看背包 | 显示已兑换商品 |
| TC-08 | 记录 | 查看积分记录 | 显示 earn/spend |
| TC-09 | 样式 | 修改自定义样式 | 刷新后仍生效 |
| TC-10 | 错误 | 触发 4xx/5xx | ApiErrorToast 显示 |
| TC-11 | 导出 | 导出数据 | 下载 .srdata |
| TC-12 | 导入 | 导入有效 .srdata | 数据合并、刷新 |
| TC-13 | 进行中任务入口 | 开始任务后，header 显示「进行中: 任务名」；切换到其他 tab 时，任务 tab 内显示 banner「你有进行中的任务，点击进入」 | 两处点击均可跳转回任务计时界面 |