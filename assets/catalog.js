// 幸福计划 · 目录页 (沉浸式 v3)
(function () {
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

  function stTag(status) {
    if (status === "done")      return `<span class="status-dot done">✓</span>`;
    if (status === "current")   return `<span class="status-dot current">▶</span>`;
    if (status === "available") return `<span class="status-dot available">·</span>`;
    return `<span class="status-dot locked">🔒</span>`;
  }

  function render() {
    const completed = loadCompleted();
    const currentDay = getCurrentDay(completed);

    let expanded = loadExpanded();
    if (!expanded) {
      expanded = new Set();
      if (currentDay != null) {
        const s = XINGFU.getStageForDay(currentDay);
        if (s) expanded.add(s.id);
      } else {
        expanded.add(1);
      }
      saveExpanded(expanded);
    }

    const completedReal = [...completed].filter(d => d > 0).length;
    document.getElementById("overall-fill").style.width = `${(completedReal / TOTAL) * 100}%`;
    document.getElementById("overall-text").textContent = `${completedReal} / ${TOTAL}`;

    const root = document.getElementById("catalog-root");

    // Day 0
    const day0Done = completed.has(0);
    const day0Status = day0Done
      ? "done"
      : (XINGFU.AVAILABLE_DAYS.includes(0) ? (currentDay === 0 ? "current" : "available") : "locked");
    const day0 = XINGFU.ONBOARDING_DAY;
    const day0Html = `
      <a class="catalog-onboarding catalog-day-${day0Status} reveal" data-delay="2" href="day.html?day=0"
         style="--stage-color:${day0.stage.color}; --stage-tint:${day0.stage.tint};">
        <div class="catalog-onboarding-tag">DAY 0 · ${escapeHtml(day0.stage.name).toUpperCase()}</div>
        <div class="catalog-onboarding-theme">${escapeHtml(day0.theme)}</div>
        <div class="catalog-onboarding-coreline">${escapeHtml(day0.coreLine)}</div>
        <div class="catalog-onboarding-status">${day0Done ? "✓ 已完成" : (currentDay === 0 ? "▶ 从这里开始" : "·")}</div>
      </a>
    `;

    const STAGE_COLORS = { 1:"#F09866", 2:"#E5B14B", 3:"#7BBE7E", 4:"#7AA8D6" };
    const STAGE_TINTS = { 1:"#FBE3D1", 2:"#F6E5B6", 3:"#D8EDD9", 4:"#D5E5F0" };

    root.innerHTML = day0Html + XINGFU.STAGES.map((stage, idx) => {
      const prog = stageProgress(stage, completed);
      const isOpen = expanded.has(stage.id);
      const color = STAGE_COLORS[stage.id] || stage.color;
      const tint = STAGE_TINTS[stage.id] || stage.tint;
      const daysHtml = XINGFU.CURRICULUM
        .filter(item => item.day >= stage.range[0] && item.day <= stage.range[1])
        .map(item => {
          const st = statusOf(item.day, completed, currentDay);
          const clickable = st !== "locked";
          const tag = stTag(st);
          const inner = `
            <div class="catalog-day-row" data-status="${st}" style="--stage-color:${color};">
              <div class="catalog-day-status">${tag}</div>
              <div class="catalog-day-main">
                <div class="catalog-day-head">
                  <span class="catalog-day-num">${String(item.day).padStart(2, "0")}</span>
                  <span class="catalog-day-theme">${escapeHtml(item.theme)}</span>
                </div>
                <div class="catalog-day-coreline">${escapeHtml(item.coreLine)}</div>
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
        <section class="catalog-stage ${isOpen ? "open" : ""} reveal" data-delay="${Math.min(idx + 3, 6)}"
                 data-stage-id="${stage.id}"
                 style="--stage-color:${color}; --stage-tint:${tint};">
          <button class="catalog-stage-head" type="button">
            <div class="catalog-stage-head-main">
              <div class="catalog-stage-eyebrow">CHAPTER ${["I","II","III","IV"][idx]} · ${prog.done}/${prog.total}</div>
              <div class="catalog-stage-name">${escapeHtml(stage.name.replace(/篇$/, ""))}</div>
              <div class="catalog-stage-subtitle">${escapeHtml(stage.subtitle || "")}</div>
              <div class="catalog-stage-bar"><div class="catalog-stage-bar-fill" style="width:${prog.pct}%"></div></div>
            </div>
            <div class="catalog-stage-arrow">${isOpen ? "▾" : "▸"}</div>
          </button>
          <div class="catalog-stage-body">${daysHtml}</div>
        </section>
      `;
    }).join("");

    // 折叠
    document.querySelectorAll(".catalog-stage-head").forEach(btn => {
      btn.onclick = () => {
        const section = btn.closest(".catalog-stage");
        const id = parseInt(section.dataset.stageId, 10);
        if (expanded.has(id)) expanded.delete(id);
        else expanded.add(id);
        saveExpanded(expanded);
        section.classList.toggle("open");
        btn.querySelector(".catalog-stage-arrow").textContent =
          section.classList.contains("open") ? "▾" : "▸";
      };
    });

    // 滚到当前阶段
    if (currentDay != null) {
      const stage = XINGFU.getStageForDay(currentDay);
      if (stage) {
        const el = document.querySelector(`.catalog-stage[data-stage-id="${stage.id}"]`);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      }
    }
  }

  render();
})();
