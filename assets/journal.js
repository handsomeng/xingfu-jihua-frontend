// 幸福计划 · 日记本：聚合所有 day 的 text 题答案，按 Day 倒序

(function () {
  if (typeof XingfuRedeem !== "undefined" && (!XingfuRedeem.isOnboarded() || !XingfuRedeem.isRedeemed())) {
    location.replace("onboarding.html");
    return;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function loadDayState(day) {
    try {
      const raw = localStorage.getItem(`xingfu-day-${day}-state`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function fetchDayData(day) {
    try {
      const res = await fetch(`assets/days/day${day}.json`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  function cleanQuestion(q) {
    return (q || "").replace(/\*\*/g, "").replace(/\n+/g, " ").trim();
  }

  async function collectAllEntries() {
    // 遍历所有 AVAILABLE_DAYS（含 Day 0），取每天有 state 的 text 答案
    const out = [];
    for (const day of XINGFU.AVAILABLE_DAYS) {
      const state = loadDayState(day);
      if (!state || !state.answers) continue;

      const dayData = await fetchDayData(day);
      if (!dayData) continue;

      const meta = XINGFU.getDayMeta(day);
      const entries = [];

      for (const page of dayData.pages) {
        if (page.type !== "text") continue;
        const ans = state.answers[page.id];
        if (!ans || !String(ans).trim()) continue;
        entries.push({
          pageId: page.id,
          question: cleanQuestion(page.question),
          answer: String(ans).trim()
        });
      }

      if (entries.length) {
        out.push({ day, meta, entries });
      }
    }
    // 按 Day 倒序：最近写的在最前
    out.sort((a, b) => b.day - a.day);
    return out;
  }

  function render(blocks) {
    const root = document.getElementById("journal-root");

    if (!blocks.length) {
      root.innerHTML = `
        <div class="journal-empty">
          <div class="journal-empty-icon">✎</div>
          <p>你还没写下过什么。</p>
          <p style="margin-top: 16px;">从 <strong>Day 0</strong> 开始，把今天的自己留个底。</p>
          <a class="btn-primary" href="day.html?day=0" style="text-decoration: none; text-align: center; display: block; margin-top: 24px;">去 Day 0</a>
        </div>
      `;
      return;
    }

    root.innerHTML = blocks.map(block => {
      const stage = block.meta.stage;
      const dayLabel = block.day === 0 ? "DAY 0" : `DAY ${String(block.day).padStart(2, "0")}`;
      const entriesHtml = block.entries.map(e => `
        <div class="journal-entry" style="--day-color:${stage.color};">
          <div class="journal-entry-q">${escapeHtml(e.question)}</div>
          <div class="journal-entry-a">${escapeHtml(e.answer)}</div>
        </div>
      `).join("");
      return `
        <section class="journal-day-block">
          <header class="journal-day-head" style="--day-color:${stage.color}; --day-tint:${stage.tint};">
            <div class="journal-day-num">${dayLabel}</div>
            <div class="journal-day-theme">${escapeHtml(block.meta.theme)}</div>
            <a class="journal-day-link" href="report.html?day=${block.day}">看那天的报告 →</a>
          </header>
          ${entriesHtml}
        </section>
      `;
    }).join("");
  }

  collectAllEntries().then(render);
})();
