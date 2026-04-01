---
name: framelink-mcp-rate-limit
description: Apply Figma REST API rate-limit safe strategy when using Framelink MCP for Figma tools. Use when calling get_figma_data or download_figma_images, or when users mention Figma MCP, 429, throttle, rate limits, Retry-After, batching, or frequent sync/export workflows.
---

# Framelink MCP Rate Limit Guard (No Paid Seat)

Use this skill whenever calling `user-Framelink MCP for Figma` tools:
- `get_figma_data`
- `download_figma_images`

Goal: for Viewer/Collab only accounts, follow official Figma rate-limit rules without distortion, minimize 429, and preserve scarce monthly quota.

## Official Rules (must follow)

From Figma official docs (`/docs/rest-api/rate-limits/`, `/docs/rest-api/errors/`):

- Rate limit depends on: seat type + endpoint tier + requested resource plan.
- Figma uses leaky bucket; over-limit returns `429`.
- Viewer/Collab limits:
  - Tier 1: up to `6/month`
  - Tier 2: up to `5/min`
  - Tier 3: up to `10/min`
  - Real limit may be lower during high traffic.
- `429` headers:
  - `Retry-After` (retry timing authority)
  - `X-Figma-Rate-Limit-Type` (`low` for Viewer/Collab, `high` for Full/Dev)
  - `X-Figma-Plan-Tier`
  - `X-Figma-Upgrade-Link`
- Official recommendations: batch requests, cache results, and retry after `Retry-After`.

## Scope And Non-Distortion Rules

- Do not invent endpoint tier mapping unless documented.
- Do not assume a fixed tier for `get_figma_data` or `download_figma_images`.
- If endpoint tier is unknown, run with conservative defaults and budget gating.
- Distinguish clearly:
  - **Official facts** (from docs)
  - **Operational heuristics** (from runtime signals like headerless `429`)
- Token accounting truth:
  - OAuth: per-user, per-plan, per-app.
  - Personal token: per-user, per-plan (shared usage counts together).

## View/Collab Strict Strategy (Default)

### 1) Request necessity gate (before any MCP call)

- Label request as `essential` or `non-essential`.
- If `non-essential`, prefer cache or skip.
- Never do speculative scanning under Viewer/Collab.

### 2) Cache-first and dedupe (officially recommended)

- Never call any Figma MCP tool in a tight loop.
- Cache key: `fileKey + nodeId + depth`.
- Reuse cached result by default unless user requests refresh.
- Use manual/explicit refresh trigger, not navigation-driven polling.

### 3) Batch-first for image export (officially recommended)

- For `download_figma_images`, combine multiple nodes in one call (single `nodes` array) instead of one-call-per-image.
- Keep exactly one in-flight Framelink request.
- Prefer one batched call; only split when throttling persists.

### 4) Conservative pacing (fallback, not override for Retry-After)

- Minimum spacing:
  - same endpoint consecutive calls: wait `3000ms`
  - different endpoint switch: wait `2000ms`
- If throttling appears, raise to `5000-8000ms`.
- Global limiter baseline: keep aggregate request rate around `<= 0.5 QPS` (about 1 request per 2s) before retries.

### 5) 429 handling (mandatory, Retry-After first)

When a call returns/indicates rate limit:

1. Always read `Retry-After` first (case-insensitive key).
2. If `Retry-After` exists, it is authoritative for retry timing.
3. Parse rule:
   - integer seconds -> `seconds * 1000`
   - HTTP-date -> `max(date - now, 0)`
4. If `Retry-After` is missing/invalid, fallback to capped exponential backoff:
   - attempt 1: `3000ms`
   - attempt 2: `6000ms`
   - attempt 3: `12000ms`
   - attempt 4+: cap at `20000ms`
5. Max retries per request: `5`.
6. If still failing, stop and report:
   - endpoint/tool name
   - attempts
   - last `Retry-After`
   - `X-Figma-Rate-Limit-Type`
   - `X-Figma-Plan-Tier`
   - suggested cool-down window
   - `X-Figma-Upgrade-Link` (if present)

### 6) Adaptive downgrade (required after repeated 429)

If 2 consecutive `429` happen in one session:

- Enter cooldown for `60-120s`
- Reduce request frequency (double spacing)
- Reduce request breadth per call (smaller node batches)
- Prefer staged fetching:
  1. metadata/data first
  2. image download after cool-down

### 7) Headerless-429 protection mode (operational heuristic)

Trigger:
- `429` and `Retry-After` is unavailable, especially repeated on same `fileKey`.

Actions:
- Treat as protective throttling window (unknown recovery time).
- Enable **file-level circuit breaker**:
  - same `fileKey`, consecutive `429 >= 2` -> cooldown `60-120s` (no new live call to that file)
- Use stronger retry ladder for this mode:
  - `3000ms -> 10000ms -> 30000ms -> 60000ms -> stop`
- During breaker window:
  - return cache if present
  - otherwise stop and report pending state, do not keep hammering API

Notes:
- This mode is a safety heuristic, not an official statement about hidden backend rules.

## Budget Protection For No Paid Seat

- Track `monthlyScarceBudgetUsed` for calls likely to consume expensive tier.
- Soft guard: ask user before non-essential call once usage is high.
- Hard guard: stop non-essential calls when user confirms budget is near exhaustion.
- Priority order:
  - A: user-explicit required nodes
  - B: current screen required assets
  - C: exploratory pulls (default skip)
- For same `fileKey`, merge node reads into one request whenever possible (batch ids).

## Runtime Tracker (must maintain in response context)

For each task, track and update:
- `monthlyScarceBudgetUsed`
- `consecutive429`
- `lastRetryAfterSec`
- `lastRateLimitType`
- `lastPlanTier`
- `headerless429CountByFileKey`
- `fileBreakerUntilByFileKey`

Rule: if repeated throttling or user reports low remaining budget, require confirmation before non-essential requests.

## Mandatory Per-Call Audit Output

For every Framelink MCP call, always append an audit block with:

1) raw packet (verbatim where available)
2) interpreted human-readable summary
3) compliance verdict (`COMPLIANT` / `NON_COMPLIANT`)

If full raw response is unavailable from tool output, explicitly mark missing fields as `unavailable` and do not fabricate values.

### Audit Output Format

```text
[Figma MCP Audit]
tool: {get_figma_data|download_figma_images}
request: {essential|non-essential}, {fileKey}, {nodeId|nodesCount}, {depth|pngScale|localPath}

raw_response:
  status: {number|unavailable}
  headers:
    retry-after: {value|unavailable}
    x-figma-rate-limit-type: {value|unavailable}
    x-figma-plan-tier: {value|unavailable}
    x-figma-upgrade-link: {value|unavailable}
  body_excerpt: {first_300_chars_or_unavailable}

interpreted:
  is429: {true|false|unknown}
  retryAfterSec: {number|null}
  retryWaitMs: {number|null}
  fallbackBackoffMs: {number|null}
  rateLimitType: {low|high|unknown}
  planTier: {starter|pro|org|enterprise|student|unknown}
  action: {retry_now|wait_then_retry|enter_cooldown|stop_and_report}

verdict: {COMPLIANT|NON_COMPLIANT}
reason: {short reason}
```

### Compliance Rules For Verdict

- `COMPLIANT` only if:
  - on `429`, `Retry-After` was parsed and honored when present
  - fallback backoff used only when `Retry-After` missing/invalid
  - single in-flight request respected
  - no speculative/non-essential request bypassed the necessity gate
- Otherwise mark `NON_COMPLIANT` and state corrective action.

## Self-Iteration Rule (learn and update skill on unknown throttling signals)

Trigger any of the following:
- `429` response contains unknown header/key/value pattern
- repeated throttling behavior conflicts with current skill rules
- response shape cannot be explained by existing documented rules

### Iteration Workflow (mandatory)

1) **Capture unknowns first**
- Record exact raw fields as observed (no normalization loss), including unknown headers and body fragments.
- Add to audit block under `raw_response` and mark `unknown_signals`.

2) **Classify confidence**
- `official`: explicitly documented by Figma docs
- `community`: reported by forum/community but not official docs
- `heuristic`: runtime-derived operational safeguard

3) **Document lookup and validation**
- Re-check official docs first:
  - `/docs/rest-api/rate-limits/`
  - `/docs/rest-api/errors/`
- If still unresolved, check community sources (e.g., Figma forum) and clearly label non-official status.
- Never promote community/heuristic findings to official facts.

4) **Patch this skill immediately**
- If new rule is validated, update this `SKILL.md` in the same task.
- Add/update in the correct section:
  - official findings -> `Official Rules (must follow)`
  - community observations -> new/updated note under heuristic sections
  - runtime safeguards -> `Headerless-429 protection mode` or related strategy sections
- Keep wording concise and non-duplicative.

5) **Emit change audit in response**
- Include:
  - what unknown signal was found
  - what sources were checked
  - whether rule was added/updated/rejected
  - confidence label (`official|community|heuristic`)

### Unknown Signal Report Template

```text
[Unknown Throttling Signal]
observed: {raw header/body/status snippet}
matched_rule: {none|rule_name}
classification: {official|community|heuristic|unresolved}
actions:
  - docs_checked: {rate-limits, errors, ...}
  - community_checked: {yes|no}
  - skill_updated: {yes|no}
  - update_summary: {short text}
```

## Operational Checklist (each Figma MCP task)

- [ ] Confirm request necessity (`essential` vs `non-essential`)
- [ ] Avoid duplicate fetches for same input
- [ ] Batch downloads instead of per-item calls
- [ ] Keep single in-flight request
- [ ] Insert conservative pacing delay between calls
- [ ] On `429`, honor `Retry-After` first; only fallback to backoff if missing/invalid
- [ ] If repeated 429, enter cooldown + downgrade throughput
- [ ] Update runtime tracker fields in working notes
- [ ] Output mandatory per-call audit block (raw + interpreted + verdict)
- [ ] For same `fileKey`, batch node ids instead of split calls
- [ ] If headerless 429 repeats, open file-level breaker and prefer cache fallback

## Response Template For Rate-Limit Events

Use concise status text:

```text
Figma MCP 命中限流（429），已按 Retry-After 等待 {n}s，并执行第 {k}/{max} 次重试。
限流类型：{low|high|unknown}，资源计划：{starter|pro|org|enterprise|unknown}。
若再次失败，将进入冷却并降速分批；如有升级链接将一并返回。
```

## Response Template For Low-Budget Warning

```text
当前账号为 Viewer/Collab，无付费席位，本次请求为 {essential|non-essential}。
为避免触发低配额限流，建议优先复用缓存与批量请求；非必要请求建议跳过。
```
