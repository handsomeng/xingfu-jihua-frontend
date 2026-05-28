// 幸福计划 · 日记本 (沉浸式 v3)
(function () {
  if (typeof XingfuRedeem !== "undefined" && (!XingfuRedeem.isOnboarded() || !XingfuRedeem.isRedeemed())) {
    location.replace("onboarding.html");
    return;
  }

  const STAGE_COLORS = { 0:"#9B7B5A", 1:"#F09866", 2:"#E5B14B", 3:"#7BBE7E", 4:"#7AA8D6" };
  const STAGE_TINTS = { 0:"#F0E6D6", 1:"#FBE3D1", 2:"#F6E5B6", 3:"#D8EDD9", 4:"#D5E5F0" };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function loadDayState(day) {
    try {
      const raw = localStorage.getItem(`xingfu-day-${day}-state`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  async function fetchDayData(day) {
    try {
      const res = await fetch(`assets/days/day${day}.json`);
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }
  function cleanQuestion(q) {
    return (q || "").replace(/\*\*/g, "").replace(/\n+/g, " ").trim();
  }

  async function collectAllEntries() {
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
      if (entries.length) out.push({ day, meta, entries });
    }
    out.sort((a, b) => b.day - a.day);
    return out;
  }

  function render(blocks) {
    const root = document.getElementById("journal-root");
    if (!blocks.length) {
      root.innerHTML = `
        <div class="journal-empty reveal" data-delay="2">
          <div class="journal-empty-icon">✎</div>
          <p>你还没写下过什么。</p>
          <p style="margin-top: 16px;">从 <strong>Day 0</strong> 开始，把今天的自己留个底。</p>
          <a class="btn-primary" href="day.html?day=0" style="margin-top: 24px;">去 Day 0</a>
        </div>
      `;
      return;
    }

    root.innerHTML = blocks.map((block, idx) => {
      const stage = block.meta.stage;
      const stageId = stage?.id ?? 0;
      const color = STAGE_COLORS[stageId] || stage?.color || "#B26A2E";
      const tint = STAGE_TINTS[stageId] || stage?.tint || "rgba(178,106,46,0.06)";
      const dayLabel = block.day === 0 ? "DAY 0" : `DAY ${String(block.day).padStart(2, "0")}`;
      const entriesHtml = block.entries.map(e => `
        <div class="journal-entry" style="--day-color:${color};">
          <div class="journal-entry-q">${escapeHtml(e.question)}</div>
          <div class="journal-entry-a">${escapeHtml(e.answer)}</div>
        </div>
      `).join("");
      return `
        <section class="journal-day-block reveal" data-delay="${Math.min(idx + 2, 6)}">
          <header class="journal-day-head" style="--day-color:${color}; --day-tint:${tint};">
            <div class="journal-day-num">${dayLabel}</div>
            <div class="journal-day-theme">${escapeHtml(block.meta.theme)}</div>
            <a class="journal-day-link" href="report.html?day=${block.day}">看那天的信 →</a>
          </header>
          ${entriesHtml}
        </section>
      `;
    }).join("");
  }

  collectAllEntries().then(render);
})();
