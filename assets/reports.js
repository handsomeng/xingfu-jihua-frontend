// 幸福计划 · 历史报告列表（基于 curriculum 单一数据源）

if (typeof XingfuRedeem !== "undefined" && (!XingfuRedeem.isOnboarded() || !XingfuRedeem.isRedeemed())) {
  location.replace("onboarding.html");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function loadCompleted() {
  try {
    return new Set(JSON.parse(localStorage.getItem("xingfu-completed-days") || "[]"));
  } catch {
    return new Set();
  }
}

function loadReportMeta(day) {
  try {
    const raw = localStorage.getItem(`xingfu-day-${day}-report-meta`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hasReport(day) {
  return !!localStorage.getItem(`xingfu-day-${day}-report`);
}

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function render() {
  const completed = [...loadCompleted()].sort((a, b) => a - b);
  const list = document.getElementById("reports-list");

  if (completed.length === 0) {
    list.innerHTML = `
      <div class="card" style="text-align: center;">
        <p style="margin: 0 0 12px 0; color: var(--text-secondary);">你还没完成任何一天。</p>
        <a class="btn-primary" href="index.html" style="text-decoration: none; text-align: center; display: block;">去做 Day 1</a>
      </div>
    `;
    return;
  }

  const cardsHtml = completed.map(day => {
    const meta = XINGFU.getDayMeta(day);
    if (!meta) return "";
    const stage = meta.stage;
    const reportMeta = loadReportMeta(day);
    const hasRep = hasReport(day);
    const dateStr = reportMeta?.generatedAt ? formatDate(reportMeta.generatedAt) : "";

    return `
      <a class="report-list-item" href="report.html?day=${day}"
         style="--item-tint:${stage.tint}; --item-accent:${stage.color};">
        <div class="report-list-day">DAY ${String(day).padStart(2, "0")}</div>
        <div class="report-list-main">
          <div class="report-list-eyebrow">${escapeHtml(stage.name)}</div>
          <div class="report-list-theme">${escapeHtml(meta.theme)}</div>
          <div class="report-list-meta">
            ${hasRep ? `已生成 ${escapeHtml(dateStr || "")}` : "教练报告待生成"}
          </div>
        </div>
        <div class="report-list-arrow">→</div>
      </a>
    `;
  }).join("");

  list.innerHTML = cardsHtml;
}

render();
