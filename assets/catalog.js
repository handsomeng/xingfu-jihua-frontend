// 幸福计划 · 目录页：按 4 阶段折叠 + 每天 3 态（已完成 / 当前 / 未解锁）

(function () {
  // 守卫
  if (!XingfuRedeem.isOnboarded() || !XingfuRedeem.isRedeemed()) {
    location.replace("onboarding.html");
    return;
  }

  const TOTAL = 71;
  const EXPAND_KEY = "xingfu-catalog-expanded";

  function loadCompleted() {
    try { return new Set(JSON.parse(localStorage.getItem("xingfu-completed-days") || "[]")); }
    catch { return new Set(); }
  }

  function loadExpanded() {
    try {
      const raw = sessionStorage.getItem(EXPAND_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return null;
  }

  function saveExpanded(set) {
    sessionStorage.setItem(EXPAND_KEY, JSON.stringify([...set]));
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

  function statusOf(day, completed, currentDay) {
    if (completed.has(day)) return "done";
    if (day === currentDay) return "current";
    if (XINGFU.AVAILABLE_DAYS.includes(day)) return "available";
    return "locked";
  }

  function stageProgress(stage, completed) {
    const [a, b] = stage.range;
    let done = 0, total = b - a + 1;
    for (let d = a; d <= b; d++) if (completed.has(d)) done++;
    return { done, total, pct: total ? (done / total) * 100 : 0 };
  }

  function render() {
    const completed = loadCompleted();
    const currentDay = getCurrentDay(completed);

    // 初次进入默认展开「当前 Day 所在阶段」
    let expanded = loadExpanded();
    if (!expanded) {
      expanded = new Set();
      if (currentDay) {
        const s = XINGFU.getStageForDay(currentDay);
        if (s) expanded.add(s.id);
      } else {
        // 没有当前 day 时默认展开第一个阶段
        expanded.add(1);
      }
      saveExpanded(expanded);
    }

    // Day 0 是入门，不计入 71 天分母
    const completedReal = [...completed].filter(d => d > 0).length;
    document.getElementById("overall-fill").style.width = `${(completedReal / TOTAL) * 100}%`;
    document.getElementById("overall-text").textContent = `${completedReal} / ${TOTAL} 已完成`;

    const root = document.getElementById("catalog-root");

    // Day 0「入门」单独渲染在 4 阶段之上
    const day0Done = completed.has(0);
    const day0Status = day0Done ? "done" : (XINGFU.AVAILABLE_DAYS.includes(0) ? (currentDay === 0 ? "current" : "available") : "locked");
    const day0 = XINGFU.ONBOARDING_DAY;
    const day0Html = `
      <a class="catalog-onboarding catalog-day-${day0Status}" href="day.html?day=0"
         style="--stage-color:${day0.stage.color}; --stage-tint:${day0.stage.tint};">
        <div class="catalog-onboarding-tag">DAY 0 · ${escapeHtml(day0.stage.name)}</div>
        <div class="catalog-onboarding-theme">${escapeHtml(day0.theme)}</div>
        <div class="catalog-onboarding-coreline">${escapeHtml(day0.coreLine)}</div>
        <div class="catalog-onboarding-status">${day0Done ? "✓ 已完成" : (currentDay === 0 ? "▶ 从这里开始" : "·")}</div>
      </a>
    `;

    root.innerHTML = day0Html + XINGFU.STAGES.map(stage => {
      const prog = stageProgress(stage, completed);
      const isOpen = expanded.has(stage.id);
      const daysHtml = CURRICULUM_RANGE(stage).map(item => {
        const st = statusOf(item.day, completed, currentDay);
        const clickable = st !== "locked";
        const tag = stTag(st);
        const numHtml = `<span class="catalog-day-num">${String(item.day).padStart(2, "0")}</span>`;
        const themeHtml = `<span class="catalog-day-theme">${escapeHtml(item.theme)}</span>`;
        const coreLineHtml = `<div class="catalog-day-coreline">${escapeHtml(item.coreLine)}</div>`;
        const inner = `
          <div class="catalog-day-row" data-status="${st}">
            <div class="catalog-day-status">${tag}</div>
            <div class="catalog-day-main">
              <div class="catalog-day-head">${numHtml}${themeHtml}</div>
              ${coreLineHtml}
            </div>
          </div>
        `;
        if (clickable) {
          return `<a class="catalog-day catalog-day-${st}" href="day.html?day=${item.day}">${inner}</a>`;
        } else {
          return `<div class="catalog-day catalog-day-${st}">${inner}</div>`;
        }
      }).join("");

      return `
        <section class="catalog-stage ${isOpen ? "open" : ""}" data-stage-id="${stage.id}" style="--stage-color:${stage.color}; --stage-tint:${stage.tint};">
          <button class="catalog-stage-head" type="button">
            <div class="catalog-stage-head-main">
              <div class="catalog-stage-eyebrow">阶段 ${stage.id} · ${prog.done}/${prog.total}</div>
              <div class="catalog-stage-name">${escapeHtml(stage.name)}</div>
              <div class="catalog-stage-subtitle">${escapeHtml(stage.subtitle)}</div>
              <div class="catalog-stage-bar"><div class="catalog-stage-bar-fill" style="width:${prog.pct}%"></div></div>
            </div>
            <div class="catalog-stage-arrow">${isOpen ? "▾" : "▸"}</div>
          </button>
          <div class="catalog-stage-body">${daysHtml}</div>
        </section>
      `;
    }).join("");

    // 折叠交互
    document.querySelectorAll(".catalog-stage-head").forEach(btn => {
      btn.onclick = () => {
        const section = btn.closest(".catalog-stage");
        const id = parseInt(section.dataset.stageId, 10);
        if (expanded.has(id)) expanded.delete(id);
        else expanded.add(id);
        saveExpanded(expanded);
        section.classList.toggle("open");
        btn.querySelector(".catalog-stage-arrow").textContent = section.classList.contains("open") ? "▾" : "▸";
      };
    });

    // 滚到当前 Day 所在阶段
    if (currentDay) {
      const stage = XINGFU.getStageForDay(currentDay);
      if (stage) {
        const el = document.querySelector(`.catalog-stage[data-stage-id="${stage.id}"]`);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      }
    }
  }

  function CURRICULUM_RANGE(stage) {
    const [a, b] = stage.range;
    return XINGFU.CURRICULUM.filter(item => item.day >= a && item.day <= b);
  }

  function stTag(status) {
    if (status === "done") return `<span class="status-dot done">✓</span>`;
    if (status === "current") return `<span class="status-dot current">▶</span>`;
    if (status === "available") return `<span class="status-dot available">·</span>`;
    return `<span class="status-dot locked">🔒</span>`;
  }

  render();
})();
