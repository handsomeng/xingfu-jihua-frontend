// 幸福计划 · 解锁 + 每日额度
// 规则：
// 1. 顺序解锁：maxUnlocked = max(completed) + 1（Day 0 完成后解锁 Day 1）
// 2. 每日额度 3 节：当天已完成 Day 数 < 3 才能开新节
// 3. Day 0 是入门，不计入「每日 3 节」额度
// 4. 已完成的 Day 永远可回看（不受额度限制）

(function () {
  const COMPLETED_KEY = "xingfu-completed-days";
  const DAILY_QUOTA = 3;

  function loadCompleted() {
    try {
      return new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function getCompletionDate(day) {
    try {
      const state = JSON.parse(localStorage.getItem(`xingfu-day-${day}-state`) || "{}");
      return state.completedAt ? new Date(state.completedAt) : null;
    } catch {
      return null;
    }
  }

  function getCompletedToday() {
    const today = new Date().toDateString();
    const completed = loadCompleted();
    const todayDays = [];
    for (const d of completed) {
      if (d === 0) continue; // Day 0 不计入额度
      const date = getCompletionDate(d);
      if (date && date.toDateString() === today) {
        todayDays.push(d);
      }
    }
    return todayDays.sort((a, b) => a - b);
  }

  function getCompletedTodayCount() {
    return getCompletedToday().length;
  }

  function getRemainingQuota() {
    return Math.max(0, DAILY_QUOTA - getCompletedTodayCount());
  }

  function canStartNewDay() {
    return getCompletedTodayCount() < DAILY_QUOTA;
  }

  function getMaxUnlockedDay() {
    // 找最大已完成的 Day，+1 = 下一个解锁的 Day
    const completed = loadCompleted();
    let maxCompleted = -1;
    for (const d of completed) {
      if (d > maxCompleted) maxCompleted = d;
    }
    // 解锁 = max(已完成) + 1
    // 如果一节都没做 (maxCompleted = -1)，maxUnlocked = 0（Day 0 入门）
    return maxCompleted + 1;
  }

  function isDayUnlocked(day) {
    return day <= getMaxUnlockedDay();
  }

  function isDayCompleted(day) {
    return loadCompleted().has(day);
  }

  // 判断「现在能不能进 day N」
  // 返回 { ok: true } 或 { ok: false, reason: "locked"|"quota_exceeded" }
  function canStartDay(day) {
    if (isDayCompleted(day)) {
      return { ok: true, reason: "review" }; // 已完成可回看
    }
    if (!isDayUnlocked(day)) {
      return { ok: false, reason: "locked" };
    }
    if (day === 0) {
      return { ok: true }; // Day 0 不受额度限制
    }
    if (!canStartNewDay()) {
      return { ok: false, reason: "quota_exceeded" };
    }
    return { ok: true };
  }

  window.XingfuQuota = {
    DAILY_QUOTA,
    getCompletedToday,
    getCompletedTodayCount,
    getRemainingQuota,
    canStartNewDay,
    getMaxUnlockedDay,
    isDayUnlocked,
    isDayCompleted,
    canStartDay,
  };
})();
