// 幸福计划 · 成长轨迹 (沉浸式 v3)
// 诚实设计：Day0「整体状态打分」是 71 天里唯一一道纯整体自评，
// 用它做唯一可比的锚。用户在本页当场重测同一道题，跟 Day0 对比，
// 历次 check-in 攒成一条「真·同维度」曲线。不混不同维度的分，不造假。
(function () {
  if (typeof XingfuRedeem !== "undefined" && (!XingfuRedeem.isOnboarded() || !XingfuRedeem.isRedeemed())) {
    location.replace("onboarding.html");
    return;
  }

  const CHECKIN_KEY = "xingfu-checkins";
  // Day0 p4 的 5 档，score 取每档中点（落在 0-10 轴上）
  const BANDS = [
    { band: 1, score: 1,   label: "0–2 分",  desc: "最近真的不太行" },
    { band: 2, score: 3.5, label: "3–4 分",  desc: "明显比想象中低" },
    { band: 3, score: 5.5, label: "5–6 分",  desc: "不上不下" },
    { band: 4, score: 7.5, label: "7–8 分",  desc: "其实挺稳的" },
    { band: 5, score: 9.5, label: "9–10 分", desc: "最近过得相当好" },
  ];
  const OPT_TO_BAND = { opt1: 1, opt2: 2, opt3: 3, opt4: 4, opt5: 5 };
  const bandOf = b => BANDS.find(x => x.band === b) || null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function loadDayState(day) {
    try {
      const raw = localStorage.getItem(`xingfu-day-${day}-state`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function loadCheckins() {
    try {
      const a = JSON.parse(localStorage.getItem(CHECKIN_KEY) || "[]");
      return Array.isArray(a) ? a.filter(x => x && x.band && x.ts) : [];
    } catch { return []; }
  }
  function saveCheckins(arr) {
    try { localStorage.setItem(CHECKIN_KEY, JSON.stringify(arr)); } catch {}
  }

  // ---------- 取数据 ----------
  const day0 = loadDayState(0);
  const startBand = day0 && day0.answers ? (OPT_TO_BAND[day0.answers.p4] || null) : null;
  const startWords = day0 && day0.answers ? {
    why:   String(day0.answers.p2 || "").trim(),
    stuck: String(day0.answers.p6 || "").trim(),
    hope:  String(day0.answers.p8 || "").trim(),
  } : { why: "", stuck: "", hope: "" };

  let completedCount = 0;
  try { completedCount = new Set(JSON.parse(localStorage.getItem("xingfu-completed-days") || "[]")).size; } catch {}

  function countWords() {
    let c = 0;
    const days = (window.XINGFU && XINGFU.AVAILABLE_DAYS) ? XINGFU.AVAILABLE_DAYS : [];
    for (const day of days) {
      const st = loadDayState(day);
      if (!st || !st.answers) continue;
      for (const v of Object.values(st.answers)) {
        if (typeof v !== "string") continue;
        const t = v.trim();
        if (/^opt\d+$/.test(t)) continue;
        if (t.length < 4) continue;
        c++;
      }
    }
    return c;
  }
  const wordCount = countWords();

  // check-in 按「天」去重，每天取最后一次
  function dedupCheckinsByDay(list) {
    const byDay = new Map();
    for (const c of list.slice().sort((a, b) => a.ts - b.ts)) {
      byDay.set(new Date(c.ts).toDateString(), c);
    }
    return [...byDay.values()].sort((a, b) => a.ts - b.ts);
  }

  function fmtDate(ts) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  }
  function todayCheckin() {
    const today = new Date().toDateString();
    return loadCheckins().reverse().find(c => new Date(c.ts).toDateString() === today) || null;
  }

  // ---------- 各区块 ----------
  function startCardHtml() {
    const b = bandOf(startBand);
    const wordRow = (label, val) => val
      ? `<div class="growth-word"><span class="growth-word-k">${label}</span><span class="growth-word-v">${escapeHtml(val)}</span></div>`
      : "";
    return `
      <section class="growth-card reveal" data-delay="2">
        <div class="growth-eyebrow">你的起点 · Day 0</div>
        <div class="growth-start-score">
          <span class="growth-start-num">${b ? b.label : "—"}</span>
          <span class="growth-start-desc">${b ? b.desc : ""}</span>
        </div>
        ${wordRow("我之所以按下开始", startWords.why)}
        ${wordRow("心里那块堵", startWords.stuck)}
        ${wordRow("我希望 71 天后", startWords.hope)}
      </section>`;
  }

  function checkinCardHtml() {
    const t = todayCheckin();
    if (t) {
      const tb = bandOf(t.band);
      const sb = bandOf(startBand);
      const delta = (tb.score - sb.score);
      let line;
      if (delta >= 1.5) line = `从「${sb.label}」到「${tb.label}」，这段路你确实走上来了。`;
      else if (delta <= -1.5) line = `比起点低了一点。状态本来就有起伏，你愿意回来诚实打这个分，本身就说明你还在认真对待自己。`;
      else line = `跟起点差不多。能稳住也是一种本事，接着走。`;
      return `
        <section class="growth-card reveal" data-delay="3">
          <div class="growth-eyebrow">此刻的你 · 今天打过了</div>
          <div class="growth-now-score">${tb.label}<span>·</span>${tb.desc}</div>
          <p class="growth-compare">${line}</p>
          <button type="button" class="growth-redo" id="growth-redo">重新打一次</button>
        </section>`;
    }
    const opts = BANDS.map(b => `
      <button class="option growth-band" type="button" data-band="${b.band}">
        <span class="option-mark"></span>
        <span class="option-text">${b.label}（${b.desc}）</span>
      </button>`).join("");
    return `
      <section class="growth-card reveal" data-delay="3">
        <div class="growth-eyebrow">此刻，再给自己打一次分</div>
        <div class="growth-q">此时此刻，你对自己整体状态打几分？<br><span class="growth-q-sub">0 = 糟透了 / 10 = 极好，凭直觉选。</span></div>
        <div class="options" id="growth-bands">${opts}</div>
      </section>`;
  }

  function trackCardHtml() {
    const sb = bandOf(startBand);
    const points = [{ score: sb.score, label: "起点", isStart: true }];
    for (const c of dedupCheckinsByDay(loadCheckins())) {
      const cb = bandOf(c.band);
      if (cb) points.push({ score: cb.score, label: fmtDate(c.ts) });
    }
    if (points.length < 2) {
      return `
        <section class="growth-card reveal" data-delay="4">
          <div class="growth-eyebrow">你的轨迹</div>
          <p class="growth-hint">打完上面这一次分，这里就会出现你的第一段轨迹。来得越勤，线越长，越能看见自己的状态在动。</p>
        </section>`;
    }
    return `
      <section class="growth-card reveal" data-delay="4">
        <div class="growth-eyebrow">你的轨迹 · 同一道题，不同时间</div>
        ${svgChart(points)}
        <p class="growth-hint">每个点都是你在「整体状态」这同一道题上的自评。横轴是你回来打分的顺序，不是日历。</p>
      </section>`;
  }

  function svgChart(points) {
    const W = 320, H = 180, padX = 30, padTop = 20, padBot = 34;
    const innerW = W - padX * 2, innerH = H - padTop - padBot;
    const n = points.length;
    const x = i => padX + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
    const y = s => padTop + innerH - (s / 10) * innerH;
    // 网格线（0 / 5 / 10）
    const grid = [0, 5, 10].map(v => {
      const gy = y(v);
      return `<line x1="${padX}" y1="${gy.toFixed(1)}" x2="${W - padX}" y2="${gy.toFixed(1)}" class="growth-grid"/>
        <text x="${padX - 6}" y="${(gy + 3).toFixed(1)}" class="growth-axis" text-anchor="end">${v}</text>`;
    }).join("");
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
    const dots = points.map((p, i) => {
      const cx = x(i).toFixed(1), cy = y(p.score).toFixed(1);
      return `<circle cx="${cx}" cy="${cy}" r="${p.isStart ? 4.5 : 4}" class="growth-dot ${p.isStart ? "is-start" : ""}"/>
        <text x="${cx}" y="${(H - padBot + 16)}" class="growth-axis" text-anchor="middle">${escapeHtml(p.label)}</text>`;
    }).join("");
    return `<svg class="growth-chart" viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet">
      ${grid}
      <path d="${path}" class="growth-line" fill="none"/>
      ${dots}
    </svg>`;
  }

  function footprintCardHtml() {
    const checkinCount = dedupCheckinsByDay(loadCheckins()).length;
    const cell = (num, unit, label) => `
      <div class="growth-stat">
        <div class="growth-stat-num">${num}<span class="growth-stat-unit">${unit}</span></div>
        <div class="growth-stat-label">${label}</div>
      </div>`;
    return `
      <section class="growth-card reveal" data-delay="5">
        <div class="growth-eyebrow">你的足迹</div>
        <div class="growth-stats">
          ${cell(completedCount, "/71", "点亮的天")}
          ${cell(wordCount, "段", "写下的心里话")}
          ${cell(checkinCount, "次", "回来打过分")}
        </div>
      </section>`;
  }

  function emptyHtml() {
    return `
      <section class="growth-card reveal" data-delay="2" style="text-align:center;">
        <div class="growth-eyebrow">还没有起点</div>
        <p class="growth-hint" style="margin-top:14px;">成长轨迹需要一个起点。先做 <strong>Day 0</strong>，给「此刻的整体状态」打第一个分，这条路就有了对照的开头。</p>
        <a class="btn-primary" href="day.html?day=0" style="margin-top:22px;">去 Day 0</a>
      </section>`;
  }

  // ---------- 渲染 + 交互 ----------
  function render() {
    const root = document.getElementById("growth-root");
    if (!startBand) { root.innerHTML = emptyHtml(); return; }
    root.innerHTML = startCardHtml() + checkinCardHtml() + trackCardHtml() + footprintCardHtml();
    bind();
  }

  function bind() {
    const bands = document.getElementById("growth-bands");
    if (bands) {
      bands.querySelectorAll(".growth-band").forEach(el => {
        el.onclick = () => {
          const band = parseInt(el.dataset.band, 10);
          const list = loadCheckins();
          list.push({ ts: Date.now(), band });
          saveCheckins(list);
          render();
        };
      });
    }
    const redo = document.getElementById("growth-redo");
    if (redo) {
      redo.onclick = () => {
        // 去掉今天这次，回到打分态
        const today = new Date().toDateString();
        saveCheckins(loadCheckins().filter(c => new Date(c.ts).toDateString() !== today));
        render();
      };
    }
  }

  render();
})();
