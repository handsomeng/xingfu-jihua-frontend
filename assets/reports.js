// 幸福计划 · 历史报告列表 (沉浸式 v3)
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
  function loadCompleted() {
    try { return new Set(JSON.parse(localStorage.getItem("xingfu-completed-days") || "[]")); }
    catch { return new Set(); }
  }
  function loadReportMeta(day) {
    try {
      const raw = localStorage.getItem(`xingfu-day-${day}-report-meta`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function hasReport(day) { return !!localStorage.getItem(`xingfu-day-${day}-report`); }
  function formatDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.getFullYear()} · ${String(d.getMonth() + 1).padStart(2, "0")} · ${String(d.getDate()).padStart(2, "0")}`;
  }

  function render() {
    const completed = [...loadCompleted()].sort((a, b) => a - b);
    const list = document.getElementById("reports-list");

    if (completed.length === 0) {
      list.innerHTML = `
        <div class="card reveal" data-delay="2" style="text-align:center;">
          <p style="margin: 0 0 18px 0; color: var(--ink-mute); font-size: 14px;">你还没完成任何一天。</p>
          <a class="btn-primary" href="index.html">去 做 今 天</a>
        </div>
      `;
      return;
    }

    list.innerHTML = completed.map((day, idx) => {
      const meta = XINGFU.getDayMeta(day);
      if (!meta) return "";
      const stage = meta.stage;
      const stageId = stage?.id ?? 0;
      const color = STAGE_COLORS[stageId] || stage?.color || "#B26A2E";
      const tint = STAGE_TINTS[stageId] || stage?.tint || "#F0E6D6";
      const reportMeta = loadReportMeta(day);
      const dateStr = reportMeta?.generatedAt ? formatDate(reportMeta.generatedAt) : "";
      const stamp = hasReport(day) ? `已生成 ${escapeHtml(dateStr)}` : "教练信待生成";

      const dayLabel = day === 0 ? "Day · 0" : `Day · ${String(day).padStart(2, "0")}`;

      return `
        <a class="report-list-item reveal" data-delay="${Math.min(idx + 2, 6)}" href="report.html?day=${day}"
           style="--item-tint:${tint}40; --item-accent:${color};">
          <div class="report-list-day">${dayLabel}</div>
          <div class="report-list-main">
            <div class="report-list-eyebrow">${escapeHtml((stage?.name || "").toUpperCase())}</div>
            <div class="report-list-theme">${escapeHtml(meta.theme)}</div>
            <div class="report-list-meta">${stamp}</div>
          </div>
          <div class="report-list-arrow">→</div>
        </a>
      `;
    }).join("");
  }

  render();
})();
