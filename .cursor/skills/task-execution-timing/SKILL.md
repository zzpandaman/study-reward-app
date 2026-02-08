---
name: task-execution-timing
description: Fix task execution timer and clientTime alignment between frontend and backend. Use when elapsed time shows 1s drift, backend receives wrong timestamps, or implementing start/pause/resume/complete/cancel flows with clientTime.
---

# Task Execution Timing

Frontend is the source of truth for elapsed time. Backend derives `totalExecutionDuration` from `clientTime` sent by frontend. Misalignment causes backend to show 1 second more than frontend.

## Core Rules

### 1. Logical vs Wall-Clock Timestamps

**Pause / Complete / Cancel**: Use **logical** `clientTime` so backend computes exactly `elapsedSeconds`:

```typescript
const clientTime =
  (runningExecution.startTime ?? 0) + (runningExecution.totalPausedDuration ?? 0) + elapsedSeconds;
```

**Resume / Start**: Use **wall-clock** `Date.now()` (resume computes `pausedDuration = resumeTime - pauseTime`).

### 2. Why Logical Timestamps

- `elapsedSeconds` is driven by `setInterval(1000)` and can drift from real wall-clock
- If `setInterval` runs slow, frontend shows 59s while wall-clock has passed 60s
- Sending `Date.now()` makes backend compute 60s → 1s mismatch
- Logical timestamp guarantees: `clientTime - startTime - totalPausedDuration === elapsedSeconds`

### 3. Capture Timing

For wall-clock (resume/start): capture `clientTime` at the **very start** of the handler, before any `await` or `setState`, to avoid handler delay adding extra seconds.

### 4. Visibility/Auto-Pause

When auto-pausing (e.g. page hidden), use logical timestamp. Use a ref for `elapsedSeconds` so the callback reads the latest value:

```typescript
const elapsedSecondsRef = useRef(0);
useEffect(() => { elapsedSecondsRef.current = elapsedSeconds; }, [elapsedSeconds]);
// In handler: elapsedSecondsRef.current
```

### 5. Refresh Recovery

After refresh, frontend reconstructs from backend. Backend data came from our `clientTime` sends, so `totalExecutionDuration` and `accumulatedExecutionSeconds` should match. Prefer `totalExecutionDuration ?? accumulatedExecutionSeconds ?? computed` for restoring `elapsedSeconds`.

## Checklist

- [ ] Pause/complete/cancel use logical: `startTime + totalPausedDuration + elapsedSeconds`
- [ ] Resume/start use `Math.floor(Date.now() / 1000)`
- [ ] Capture clientTime before any async work
- [ ] Auto-pause uses logical + ref for latest elapsed
