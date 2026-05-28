// 幸福计划 · 蜿蜒路径地图
// 一条正弦曲线下行；每阶段一页；今天发光，可点；已上线可点进入；未上线点开提示

(function () {
  const TOTAL = 71;

  // 颜色与 curriculum.js STAGES 对齐
  const STAGE_COLORS = {
    1: "#F09866", 2: "#E5B14B", 3: "#7BBE7E", 4: "#7AA8D6",
  };
  function colorOf(id) { return STAGE_COLORS[id] || "#B26A2E"; }

  const FLOW = {
    1: { waves: 1.6, amp: 22, harmonic: 0.18, harmonicW: 3.2, phase: 0.6 },
    2: { waves: 2.0, amp: 24, harmonic: 0.20, harmonicW: 4.1, phase: 0.2 },
    3: { waves: 2.4, amp: 22, harmonic: 0.16, harmonicW: 3.7, phase: 1.1 },
    4: { waves: 1.5, amp: 20, harmonic: 0.12, harmonicW: 2.9, phase: 0.4 },
  };

  function curveX(t, flow) {
    const base = 50 + flow.amp * Math.sin(t * 2 * Math.PI * flow.waves + flow.phase);
    const harm = flow.harmonic * flow.amp * Math.sin(t * 2 * Math.PI * flow.harmonicW + flow.phase * 1.7);
    return base + harm;
  }

  function lighten(hex, amt) {
    const m = hex.replace("#", "");
    if (m.length !== 6) return hex;
    const r = Math.min(255, parseInt(m.slice(0,2), 16) + amt);
    const g = Math.min(255, parseInt(m.slice(2,4), 16) + amt);
    const b = Math.min(255, parseInt(m.slice(4,6), 16) + amt);
    return `#${[r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')}`;
  }
  function darken(hex, amt) {
    const m = hex.replace("#", "");
    if (m.length !== 6) return hex;
    const r = Math.max(0, parseInt(m.slice(0,2), 16) - amt);
    const g = Math.max(0, parseInt(m.slice(2,4), 16) - amt);
    const b = Math.max(0, parseInt(m.slice(4,6), 16) - amt);
    return `#${[r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')}`;
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
  function isAvailable(d) { return XINGFU.AVAILABLE_DAYS.includes(d); }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function renderStage(stage, today, completed) {
    const [start, end] = stage.range;
    const days = [];
    for (let d = start; d <= end; d++) days.push(d);
    const n = days.length;
    const flow = FLOW[stage.id];
    const color = colorOf(stage.id);

    const dayGap = 78;
    const padTop = 40, padBottom = 56;
    const pageHeight = padTop + padBottom + (n - 1) * dayGap;

    const nodes = days.map((d, i) => {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const y = padTop + t * (pageHeight - padTop - padBottom);
      const jx = Math.sin(d * 1.13) * 1.5;
      const jy = Math.cos(d * 1.71) * 1.5;
      return { d, t, xPct: Math.max(15, Math.min(85, curveX(t, flow) + jx)), yPx: y + jy };
    });

    const samples = 120;
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      pts.push({ x: curveX(t, flow), y: padTop + t * (pageHeight - padTop - padBottom), t });
    }

    const stageIsDone = today.day === null ? true : end < today.day;
    const stageIsNow = today.day !== null && today.day >= start && today.day <= end;
    const tToday = stageIsNow ? (today.day - start) / Math.max(1, n - 1) : null;

    const fullD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const pastPts = stageIsDone
      ? pts
      : (stageIsNow ? pts.filter(p => p.t <= tToday + 0.001) : []);
    const pastD = pastPts.length >= 2
      ? pastPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : null;

    const nodesHtml = nodes.map(node => {
      const d = node.d;
      const isToday = today.day !== null && d === today.day;
      const isDone = today.day === null ? true : d < today.day;
      const isAvail = isAvailable(d);
      const cls = isToday ? "today" : (isDone ? "done" : "future");
      const clickable = isToday || isDone || isAvail;
      const tag = clickable ? "a" : "div";
      const href = clickable ? ` href="day.html?day=${d}"` : "";

      let circleStyle = "";
      if (isToday) {
        circleStyle = `background: radial-gradient(circle at 32% 28%, ${lighten(color, 26)}, ${color}); box-shadow: 0 8px 28px ${color}55; color: #FFFCF3;`;
      } else if (isDone) {
        const bg1 = lighten(color, 50), bg2 = lighten(color, 28);
        circleStyle = `background: radial-gradient(circle at 32% 28%, ${bg1}, ${bg2}); box-shadow: 0 2px 8px ${color}26; color: ${darken(color, 30)};`;
      } else {
        circleStyle = `background: ${color}14; border: 1.5px solid ${color}; color: ${color};`;
      }

      const wrapColor = isToday ? `color: ${color};` : "";
      const dataAttrs = !clickable ? ` data-locked="1" data-day="${d}"` : "";

      return `
        <${tag} class="imm-day-node ${cls}"${href}${dataAttrs}
                style="left:${node.xPct}%; top:${node.yPx}px; transform:translate(-50%,-50%); ${wrapColor}"
                aria-label="Day ${d}">
          <div class="imm-day-circle" style="${circleStyle}">${d}</div>
        </${tag}>
      `;
    }).join("");

    let pillCls = "ahead", pillText = "ahead";
    if (stageIsNow) { pillCls = "now"; pillText = "now"; }
    else if (stageIsDone) { pillCls = "done"; pillText = "done"; }

    return `
      <div class="imm-stage-page reveal" data-delay="${Math.min(stage.id, 4)}">
        <div class="imm-stage-head">
          <div class="imm-stage-num" style="color:${color};">0${stage.id}</div>
          <div style="min-width:0;">
            <div class="imm-stage-name-cn">${escapeHtml(stage.name.replace(/篇$/, ""))}</div>
            <div class="imm-stage-name-en">chapter ${["i","ii","iii","iv"][stage.id - 1]} · day ${start}—${end}</div>
          </div>
          <div class="imm-stage-pill ${pillCls}">${pillText}</div>
        </div>

        <div class="imm-stream" style="height:${pageHeight}px;">
          <svg viewBox="0 0 100 ${pageHeight}" preserveAspectRatio="none">
            <path d="${fullD}" stroke="${color}" stroke-width="0.5" fill="none"
                  stroke-linecap="round" stroke-linejoin="round"
                  stroke-dasharray="0.5 2" opacity="0.28" vector-effect="non-scaling-stroke" />
            ${pastD ? `<path d="${pastD}" stroke="${color}" stroke-width="0.9" fill="none"
                            stroke-linecap="round" stroke-linejoin="round"
                            opacity="0.55" vector-effect="non-scaling-stroke" />` : ""}
          </svg>
          ${nodesHtml}
        </div>
      </div>
    `;
  }

  function openSheet(html) {
    document.getElementById("sheet-inner").innerHTML = html;
    document.getElementById("sheet").classList.add("open");
    document.getElementById("sheet-backdrop").classList.add("open");
  }
  function closeSheet() {
    document.getElementById("sheet").classList.remove("open");
    document.getElementById("sheet-backdrop").classList.remove("open");
  }
  document.getElementById("sheet-backdrop").addEventListener("click", closeSheet);

  function showLockedSheet(day) {
    const meta = XINGFU.getDayMeta(day);
    const stage = meta?.stage;
    const color = colorOf(stage?.id);
    openSheet(`
      <div class="sheet-handle"></div>
      <div style="display:flex; align-items:baseline; gap:14px; margin-bottom:16px;">
        <div style="font-family:var(--english-serif); font-style:italic; font-size:56px; line-height:1; color:${color};">${day}</div>
        <div style="flex:1; min-width:0;">
          <div style="font-family:var(--english-serif); font-style:italic; font-size:12px; color:var(--ink-mute); letter-spacing:0.2em;">day ${day} / 71 · ${escapeHtml(stage?.name || "")}</div>
          <div class="sheet-title" style="margin-top:4px; margin-bottom:0;">${escapeHtml(meta?.theme || "还没到的日子")}</div>
        </div>
      </div>
      <div class="sheet-body" style="padding-top:14px; border-top:1px dashed var(--ink-line);">
        ${meta?.coreLine ? `<p>${escapeHtml(meta.coreLine)}</p>` : ""}
        <p>今天还没走到这里。新的天数会陆续上线，你可以留在今天，等它自己来。</p>
      </div>
      <div class="sheet-actions">
        <button type="button" class="btn-primary" data-close>好 的</button>
      </div>
    `);
  }
  document.getElementById("sheet-inner").addEventListener("click", e => {
    if (e.target.closest("[data-close]")) closeSheet();
  });

  function render() {
    const completed = loadCompleted();
    const currentDay = getCurrentDay(completed);
    const today = { day: currentDay };

    const html = XINGFU.STAGES.map(s => renderStage(s, today, completed)).join("") + `
      <div style="text-align:center; padding:30px 28px 60px; font-family:var(--english-serif); font-style:italic; font-size:16px; color:var(--ink-faint); letter-spacing:0.25em;">— end of path —</div>
    `;
    document.getElementById("map-root").innerHTML = html;

    document.getElementById("map-root").addEventListener("click", e => {
      const node = e.target.closest("[data-locked='1']");
      if (node) {
        e.preventDefault();
        showLockedSheet(parseInt(node.dataset.day, 10));
      }
    });

    // 滚动到当前
    if (currentDay != null) {
      requestAnimationFrame(() => {
        const target = document.querySelector(".imm-day-node.today");
        if (!target) return;
        const r = target.getBoundingClientRect();
        const absTop = window.scrollY + r.top;
        window.scrollTo({ top: Math.max(0, absTop - window.innerHeight * 0.45), behavior: "instant" });
      });
    }
  }

  render();
})();
