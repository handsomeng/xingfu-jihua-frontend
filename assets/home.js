// 幸福计划 · 沉浸式 Landing
// 数据：window.XINGFU + window.XingfuRedeem + localStorage("xingfu-completed-days")

(function () {
  const TOTAL = 71;

  // 守卫
  if (!XingfuRedeem.isOnboarded() || !XingfuRedeem.isRedeemed()) {
    location.replace("onboarding.html");
    return;
  }

  function loadCompleted() {
    try { return new Set(JSON.parse(localStorage.getItem("xingfu-completed-days") || "[]")); }
    catch { return new Set(); }
  }

  function getCurrentDay(completed) {
    for (const d of XINGFU.AVAILABLE_DAYS) {
      if (!completed.has(d)) return d;
    }
    return null;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function formatDate() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()} · ${pad(d.getMonth() + 1)} · ${pad(d.getDate())}`;
  }
  function weekdayCn() { return "日一二三四五六"[new Date().getDay()]; }

  function progressCount(completed) {
    return [...completed].filter(d => d > 0).length;
  }

  function renderToday(currentDay, completed) {
    const meta = XINGFU.getDayMeta(currentDay);
    if (!meta) return renderEmpty();
    const stage = meta.stage;
    const stageEyebrow = stage.id === 0
      ? "入  门  ·  起  笔"
      : `第 ${["零","一","二","三","四"][stage.id]} 篇 · ${stage.name.replace(/篇$/, "")}`;
    const done = progressCount(completed);

    return `
      <div class="imm-home-top reveal" data-delay="1">
        <div>
          <div class="imm-home-date">${formatDate()}</div>
          <div class="imm-home-weekday">星期${weekdayCn()}</div>
        </div>
        <div class="imm-home-actions">
          <a class="imm-icon-btn" href="reports.html" title="我的报告" aria-label="我的报告">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="1.5"/>
              <path d="M9 8 H15 M9 12 H15 M9 16 H13"/>
            </svg>
          </a>
          <a class="imm-icon-btn" href="journal.html" title="日记本" aria-label="日记本">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 4 c0-1 4-1 7 0 c3-1 7-1 7 0 v16 c0 1-4 1-7 0 c-3 1-7 1-7 0 V4z"/>
              <path d="M12 5 V20"/>
            </svg>
          </a>
          <a class="imm-icon-btn" href="growth.html" title="成长轨迹" aria-label="成长轨迹">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19 V5 M4 19 H20"/>
              <path d="M7 15 L11 11 L14 13 L19 7"/>
            </svg>
          </a>
          <button class="imm-icon-btn" id="settings-btn" title="设置" aria-label="设置">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="2.5"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.36.81.6 1.3.69L21 10a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="imm-home-center" id="home-cta-wrap">
        <div class="imm-breathing-orb"></div>

        <div class="imm-stage-eyebrow reveal" data-delay="2">${escapeHtml(stageEyebrow)}</div>

        <div class="imm-day-number reveal" data-delay="3">
          <span class="day-label">day</span>
          <span>${currentDay}</span>
        </div>

        <h1 class="imm-theme reveal" data-delay="4">${escapeHtml(meta.theme)}</h1>

        <div class="imm-coreline reveal" data-delay="5">${escapeHtml(meta.coreLine)}</div>

        <div class="imm-divider reveal" data-delay="6"><span class="hand-rule"></span></div>
      </div>

      <div class="imm-home-cta reveal" data-delay="7">
        <a class="imm-cta-button" href="day.html?day=${currentDay}">翻 开 今 天</a>
        <div class="imm-cta-meta">
          <span>Day</span>
          <span class="accent">${done}</span>
          <span>/ ${TOTAL} 已 完 成</span>
        </div>
        <div class="imm-home-note reveal" data-delay="8">记录只存在这台设备，换浏览器或清缓存会清空，建议固定用一个。</div>
      </div>
    `;
  }

  function renderEmpty() {
    const done = progressCount(loadCompleted());
    return `
      <div class="imm-home-top reveal" data-delay="1">
        <div>
          <div class="imm-home-date">${formatDate()}</div>
          <div class="imm-home-weekday">星期${weekdayCn()}</div>
        </div>
        <div class="imm-home-actions">
          <a class="imm-icon-btn" href="reports.html" aria-label="我的报告">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="3" width="14" height="18" rx="1.5"/>
              <path d="M9 8 H15 M9 12 H15 M9 16 H13"/>
            </svg>
          </a>
          <a class="imm-icon-btn" href="journal.html" aria-label="日记本">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 4 c0-1 4-1 7 0 c3-1 7-1 7 0 v16 c0 1-4 1-7 0 c-3 1-7 1-7 0 V4z"/>
              <path d="M12 5 V20"/>
            </svg>
          </a>
          <a class="imm-icon-btn" href="growth.html" aria-label="成长轨迹">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19 V5 M4 19 H20"/>
              <path d="M7 15 L11 11 L14 13 L19 7"/>
            </svg>
          </a>
          <button class="imm-icon-btn" id="settings-btn" aria-label="设置">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="2.5"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.36.81.6 1.3.69L21 10a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="imm-home-center">
        <div class="imm-breathing-orb"></div>
        <div class="imm-stage-eyebrow reveal" data-delay="2">— 已 走 完 此 处 —</div>
        <div class="imm-day-number reveal" data-delay="3"><span style="font-size:0.7em;">✦</span></div>
        <h1 class="imm-theme reveal" data-delay="4">你已经走完目前的旅程</h1>
        <div class="imm-coreline reveal" data-delay="5">新的天数会陆续上线</div>
        <div class="imm-divider reveal" data-delay="6"><span class="hand-rule"></span></div>
      </div>

      <div class="imm-home-cta reveal" data-delay="7">
        <a class="imm-cta-button" href="catalog.html">看 完 整 目 录</a>
        <div class="imm-cta-meta">
          <span>Day</span>
          <span class="accent">${done}</span>
          <span>/ ${TOTAL} 已 完 成</span>
        </div>
      </div>
    `;
  }

  function bindSettings() {
    const btn = document.getElementById("settings-btn");
    if (!btn) return;
    btn.onclick = () => {
      const choice = prompt(
        "输入数字：\n  1. 清空所有进度（重头开始）\n  2. 清空全部数据（回 onboarding）"
      );
      if (choice === "1") {
        Object.keys(localStorage)
          .filter(k => k.startsWith("xingfu-day-") || k === "xingfu-completed-days")
          .forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        location.reload();
      } else if (choice === "2") {
        Object.keys(localStorage).filter(k => k.startsWith("xingfu-")).forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        location.replace("onboarding.html");
      }
    };
  }

  function renderQuotaExceeded(completed) {
    const done = progressCount(completed);
    const todayDays = window.XingfuQuota.getCompletedToday();
    const lastToday = todayDays[todayDays.length - 1];
    const lastMeta = lastToday ? XINGFU.getDayMeta(lastToday) : null;
    return `
      <div class="imm-home-top reveal" data-delay="1">
        <div>
          <div class="imm-home-date">${formatDate()}</div>
          <div class="imm-home-weekday">星期${weekdayCn()}</div>
        </div>
        <div class="imm-home-actions">
          <a class="imm-icon-btn" href="reports.html" title="历史报告" aria-label="历史报告">⌄</a>
          <button class="imm-icon-btn" id="settings-btn" title="设置" aria-label="设置">⚙</button>
        </div>
      </div>

      <div class="imm-home-center">
        <div class="imm-breathing-orb"></div>

        <div class="imm-stage-eyebrow reveal" data-delay="2">今 日 · 已 满</div>

        <div class="imm-day-number reveal" data-delay="3">
          <span class="day-label">done</span>
          <span>${todayDays.length}</span>
          <span class="day-label" style="font-style:italic;">/ 3</span>
        </div>

        <h1 class="imm-theme reveal" data-delay="4">今天的 3 节做完了</h1>

        <div class="imm-coreline reveal" data-delay="5">${lastMeta ? `刚刚那节是 Day ${lastMeta.day} · ${escapeHtml(lastMeta.theme)}。` : ""}明天来开下一节，给自己留一天消化。</div>

        <div class="imm-divider reveal" data-delay="6"><span class="hand-rule"></span></div>

        <div class="imm-subtitle reveal" data-delay="7">Day ${done} / ${TOTAL}</div>
      </div>

      <div class="imm-home-cta reveal" data-delay="7">
        <a class="imm-cta-button" href="reports.html">看 看 走 过 的</a>
        <div class="imm-cta-meta">
          <span>明天 0 点解锁新的额度</span>
        </div>
      </div>
    `;
  }

  function render() {
    const completed = loadCompleted();
    const currentDay = getCurrentDay(completed);
    const root = document.getElementById("home-root");

    // 没有 currentDay = 71 天都做完了
    if (currentDay == null) {
      root.innerHTML = renderEmpty();
      root.classList.add("done");
      bindSettings();
      return;
    }

    // 检查能不能进 currentDay
    const quotaCheck = window.XingfuQuota.canStartDay(currentDay);
    if (!quotaCheck.ok && quotaCheck.reason === "quota_exceeded") {
      root.innerHTML = renderQuotaExceeded(completed);
      root.classList.add("done");
      bindSettings();
      return;
    }

    // 正常进 currentDay
    root.innerHTML = renderToday(currentDay, completed);
    root.classList.remove("done");
    bindSettings();

    // 整个中心区可点：进入今天
    const center = document.getElementById("home-cta-wrap");
    if (center) {
      center.style.cursor = "pointer";
      center.addEventListener("click", e => {
        if (e.target.closest("button, a")) return;
        location.href = `day.html?day=${currentDay}`;
      });
    }
  }

  render();
})();
