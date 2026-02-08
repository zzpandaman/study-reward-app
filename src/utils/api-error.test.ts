/**
 * api-error 订阅与回调测试
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { showApiError, subscribeApiError, clearApiError } from './api-error';

describe('api-error', () => {
  afterEach(() => {
    clearApiError();
  });

  it('subscribeApiError 回调收到 showApiError 消息', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeApiError(listener);
    showApiError('测试错误');
    expect(listener).toHaveBeenCalledWith('测试错误');
    unsubscribe();
    listener.mockClear();
    showApiError('另一错误');
    expect(listener).not.toHaveBeenCalled();
  });

  it('clearApiError 传递 null', () => {
    const listener = vi.fn();
    subscribeApiError(listener);
    showApiError('err');
    expect(listener).toHaveBeenCalledWith('err');
    clearApiError();
    expect(listener).toHaveBeenCalledWith(null);
  });
});
