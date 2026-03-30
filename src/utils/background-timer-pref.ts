/** 与 TaskManager 后台暂停检测共用，写入后广播以便当前页立即同步 */

export const BACKGROUND_TIMER_CHECK_KEY = 'study_reward_enable_background_check';

export const BACKGROUND_TIMER_PREF_EVENT = 'study_reward:enable-background-check';

export function readBackgroundTimerCheckEnabled(): boolean {
  return localStorage.getItem(BACKGROUND_TIMER_CHECK_KEY) === 'true';
}

export function writeBackgroundTimerCheckEnabled(value: boolean): void {
  localStorage.setItem(BACKGROUND_TIMER_CHECK_KEY, String(value));
  window.dispatchEvent(new CustomEvent(BACKGROUND_TIMER_PREF_EVENT));
}
