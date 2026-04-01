# Figma 样式改造跟进文档（索引模式）

## 0. 背景与约束
- 由于无 Figma 席位、且 MCP 拉样式次数受限，本项目对 Figma 样式的改造采取“分批次、逐节点、可追溯”的方式进行。
- 本轮/后续的改造原则：只调整样式（style），不得私自变动功能与交互。
- 若确有必须的功能/交互变动，需要先征得你的明确同意后再执行。
- 当前采用“最小索引 + MCP 缓存读取”策略：仓库内仅保留节点索引与映射；完整节点树与大体量设计数据依赖 MCP 本地缓存文件。
- 当某个 MCP 拉取失败时，我会立即切换可用 MCP（如 Framelink）重试；若都失败，再同步通知当日受限状态。
- 图片资源下载优先级统一为最低：默认不提前拉取图片，仅在进入具体页面改造且确认“当前样式落地必须依赖该图片”时，才按需调用 `download_figma_images`。

## 1. 原件与映射的存储位置
- Figma 样式索引（URL + node-id + 待映射信息）存放在：
  - `assets/figma-style-originals/`
- 每个“改造批次”对应一个目录，例如：
  - `assets/figma-style-originals/batch-2026-03-30-01/`
- 每个 Figma 节点在批次目录下有一份对应的 `node-<nodeId>.json` 索引文件。
- 完整设计上下文默认保存在 MCP 缓存输出文件（`agent-tools/*.txt`）中，按 `node-*.json.artifacts.files` 记录路径引用。
- 图片资源默认不提前入库；改造阶段按需通过 MCP 下载到项目目录，且在限流场景下最后处理。

## 2. 元数据结构（node-*.json）
每个节点元数据文件包含：
- `original`：Figma 链接与 node-id（这是“原件索引”）
- `projectMapping`：该节点应当落在哪个页面/组件/元素（后续由你补齐）
- `artifacts`：MCP 缓存文件路径、最近拉取状态、必要的轻量预览信息（不强制固化完整设计数据）
- `status`：`received` | `stored` | `exported` | `applied`（从“索引已建立”到“已应用到项目样式”）

## 3. 跟进节奏（建议）
1. 你提供一组 Figma 样式节点（第一组 / 第二组 / ...），我先完成：
   - 落盘原件索引与元数据占位（不做任何 UI/交互改动）
   - 在本文档记录“已接收节点列表”
2. 你补充每个节点对应的项目页面/组件/元素（如路由 `/templates`、组件 `TemplatesPage`、具体元素“Primary 按钮/卡片背景/表格行”等）
3. 若后续需要通过 Figma MCP 拉取样式细节（token/间距/组件规格）：
   - 我会先尝试拉取并写入 MCP 缓存路径到 `node-*.json`
   - 若某个 MCP 失败，则自动切换可用 MCP 继续拉取
   - 仅在多个 MCP 都失败时，才停止并同步你
4. 图片下载策略（统一最低优先级）：
   - 先完成节点结构与样式数据拉取，再做图片下载决策
   - 仅下载“当前页面改造必需”的最小图片集合
   - 若存在限流信号，图片下载延后到下一轮，避免挤占结构数据拉取额度
5. 真正的落地阶段只改样式；如触及交互/功能我会先请求你的同意。

## 4. 当前已接收批次
### batch-2026-03-30-01（第一组）
已收到以下 3 个 Figma 节点，并已通过 MCP `get_design_context` 完成“真正读取”（详情已写入各自 `node-*.json` 的 artifacts/assetUrls）。
页面映射字段目前已填入“建议值”，你只需按实际页面/组件/元素最终确认即可：

- 节点 `31-2`  
  - Figma：`https://www.figma.com/design/yYx9f3mtS4xdWDHiLrzcUb/reward?node-id=31-2&t=GUEY1xkW5dEOhdVt-4`
  - 归属映射：建议映射已写入（待你最终确认）

- 节点 `31-140`  
  - Figma：`https://www.figma.com/design/yYx9f3mtS4xdWDHiLrzcUb/reward?node-id=31-140&t=GUEY1xkW5dEOhdVt-4`
  - 归属映射：建议映射已写入（待你最终确认）

- 节点 `37-303`  
  - Figma：`https://www.figma.com/design/yYx9f3mtS4xdWDHiLrzcUb/reward?node-id=37-303&t=GUEY1xkW5dEOhdVt-4`
  - 归属映射：建议映射已写入（待你最终确认）

> 2026-03-31 维护：已按新策略用 Framelink MCP `get_figma_data` 重新拉取第一组（3/3 成功），并统一切换为 index-only 索引模式。
>
> 2026-03-31 落地：第一组样式已优先落代码（控制台相关：`src/layouts/AppShell.css` + `src/components/TaskManager.css` 的 `task-manager--console` 区块），3 个节点状态已更新为 `applied`。

> 你接下来只需要按节点依次告诉我：它们分别对应我们项目的哪个页面/组件/元素即可。

### batch-2026-03-30-02（第二组）
已收到以下 2 个 Figma 节点，并完成 MCP `get_design_context` 读取（页面映射字段已写入建议值，后续你可最终确认）：

- 节点 `44-354`
  - Figma：`https://www.figma.com/design/cZ7YT22rwaZKUubcVpfKJS/star-reward?node-id=1-563&t=WQqapUomjkHi0dmD-4`
  - 归属映射：建议 `/templates`（TemplatesPage + TaskManager variant=full）页头/搜索/筛选/列表容器

- 节点 `44-593`
  - Figma：`https://www.figma.com/design/cZ7YT22rwaZKUubcVpfKJS/star-reward?node-id=1-801&t=WQqapUomjkHi0dmD-4`
  - 归属映射：建议 `/templates/new`（TemplatesNewPage）表单区（仅对齐现有 DOM；缺口不处理）

> 2026-03-31 维护：已按新策略尝试用 Framelink MCP `get_figma_data` 重拉第二组，并按 headerless-429 保护执行 120s 冷却 + batched 请求（`nodeId=44-354;44-593`）；当前仍触发 429 限流（0/2 成功）。已在对应 `node-*.json` 更新 `lastPullAttempt` 详情，待限流窗口恢复后继续补拉。
>
> 2026-03-31 追加尝试：再次执行 batched 请求（`44-354;44-593`）→ 429；冷却 120s 后重试 1 次 → 仍 429。

> 2026-04-01 落地：第二组样式已落代码（`src/pages/TemplatesPage.tsx`、`src/pages/TemplatesNewPage.tsx`、`src/pages/PageChrome.css`、`src/components/TaskManager.tsx`），2 个节点状态已更新为 `applied`。

### batch-2026-03-30-03（第三组）
已收到以下 3 个 Figma 节点并建立原件索引占位：

- 节点 `53-746`
  - Figma：`https://www.figma.com/design/yYx9f3mtS4xdWDHiLrzcUb/reward?node-id=53-746&t=GUEY1xkW5dEOhdVt-4`
  - 归属映射：建议 `/shop`（ShopPage + Shop 组件）页面头部/商店卡片网格区域
  - MCP 读取状态：`get_design_context` + Framelink `get_figma_data` 均已成功（详情见 `assets/figma-style-originals/batch-2026-03-30-03/node-53-746.json`）

- 节点 `60-1506`
  - Figma：`https://www.figma.com/design/yYx9f3mtS4xdWDHiLrzcUb/reward?node-id=60-1506&t=GUEY1xkW5dEOhdVt-4`
  - 归属映射：建议 `/shop`（ShopPage + Shop）商店列表页（搜索/分类/卡片网格）
  - MCP 读取状态：`get_design_context` 受 Starter 额度限制；已改用 Framelink MCP `get_figma_data` 成功读取

- 节点 `60-1763`
  - Figma：`https://www.figma.com/design/yYx9f3mtS4xdWDHiLrzcUb/reward?node-id=60-1763&t=GUEY1xkW5dEOhdVt-4`
  - 归属映射：建议 `/shop/new`（ShopNewPage）新增商品页（标题/副标题/表单区域）
  - MCP 读取状态：`get_design_context` 受 Starter 额度限制；已改用 Framelink MCP `get_figma_data` 成功读取

> 你接下来只需要按节点依次确认映射是否准确；若需导出具体图片资源，我再用 Framelink `download_figma_images` 补全本地素材。
>
> 2026-03-31 落地：第三组样式已先行落代码（`src/components/Shop.css`，覆盖 `/shop` 列表页与 `/shop/new` 入口相关视觉语义），3 个节点状态已更新为 `applied`。

### batch-2026-03-31-04（第四批）
已登记以下 3 个节点，当前为“任务登记状态”，暂不执行实际拉取（待你后续 cue）：

- 节点 `65-1896`
  - Figma：`https://www.figma.com/design/cZ7YT22rwaZKUubcVpfKJS/star-reward?node-id=1-1700&t=Wm5iSoLfaIDBUDqh-4`
  - MCP 读取状态：待执行（queued）

- 节点 `65-2108`
  - Figma：`https://www.figma.com/design/cZ7YT22rwaZKUubcVpfKJS/star-reward?node-id=1-1910&t=WQqapUomjkHi0dmD-4`
  - MCP 读取状态：待执行（queued）

- 节点 `65-2289`
  - Figma：`https://www.figma.com/design/cZ7YT22rwaZKUubcVpfKJS/star-reward?node-id=1-2088&t=WQqapUomjkHi0dmD-4`
  - MCP 读取状态：待执行（queued）

> 2026-03-31 追加尝试：已执行 batched 请求（`nodeId=65-1896;65-2108;65-2289`）→ 429；冷却 120s 后重试 1 次 → 仍 429（0/3 成功）。

### batch-2026-03-31-05（第五批）
已登记以下 1 个节点，当前为“任务登记状态”，暂不执行实际拉取（待你后续 cue）：

- 节点 `67-2399`
  - Figma：`https://www.figma.com/design/cZ7YT22rwaZKUubcVpfKJS/star-reward?node-id=1-2196&t=WQqapUomjkHi0dmD-4`
  - MCP 读取状态：待执行（queued）

> 2026-04-01 落地：第五组样式已落代码（`src/pages/InventoryPage.tsx`、`src/components/Inventory.css`），节点 `67-2399` 状态已更新为 `applied`。

### batch-2026-03-31-06（第六批）
已登记以下 1 个节点，当前为“任务登记状态”，暂不执行实际拉取（待你后续 cue）：

- 节点 `67-2626`
  - Figma：`https://www.figma.com/design/cZ7YT22rwaZKUubcVpfKJS/star-reward?node-id=1-2421&t=WQqapUomjkHi0dmD-4`
  - MCP 读取状态：待执行（queued）

> 2026-04-01 落地：第六组样式已落代码（`src/pages/SettingsPage.tsx`、`src/pages/SettingsPage.css`），节点 `67-2626` 状态已更新为 `applied`。

> 2026-04-01：合并一次 Framelink `get_figma_data`（`44:354;44:593;65:1896;65:2108;65:2289;67:2399;67:2626`）→ 429；随后单节点 `44:354` → 仍 429。本会话 Cursor 可用 MCP 列表未包含 Plugin Figma，无法在 Agent 内用 `get_design_context` 兜底；第二～六批相关 `node-*.json` 已更新 `lastPullAttempt`。


> 2026-04-01（替换链接后重拉）：
> - 合并请求（cZ7 fileKey 6 节点）报错 `Cannot read properties of null (reading 'components')`；
> - 改为单节点后：`1:563`、`1:801`、`1:2088`、`1:2421` 成功；`1:1910`、`1:2196` 触发 429；
> - `yYx9...` 的 `65:1896` 返回 404。
> - 详情已写入各 `node-*.json` 的 `artifacts.lastPullAttempt` 与 `artifacts.files`。

### 链接替换追溯（2026-04-01）
- 第二组
  - `44-354`：`yYx9.../node-id=44-354` -> `cZ7.../node-id=1-563`
  - `44-593`：`yYx9.../node-id=44-593` -> `cZ7.../node-id=1-801`
- 第四组
  - `65-1896`：`yYx9.../node-id=65-1896&t=2Lq...` -> `yYx9.../node-id=65-1896&t=6Ll...` -> `cZ7.../node-id=1-1700`
  - `65-2108`：`yYx9.../node-id=65-2108` -> `cZ7.../node-id=1-1910`
  - `65-2289`：`yYx9.../node-id=65-2289` -> `cZ7.../node-id=1-2088`
- 第五组
  - `67-2399`：`yYx9.../node-id=67-2399` -> `cZ7.../node-id=1-2196`
- 第六组
  - `67-2626`：`yYx9.../node-id=67-2626` -> `cZ7.../node-id=1-2421`

> 说明：每个 `node-*.json` 已增加 `original.figmaUrlHistory` 与 `original.figmaUrlChangeNote`，用于保留新老链接及替换原因。
