// 幸福计划 · 今日报告 (沉浸式 v3)
// 渲染：hero + echo + AI 流式信
// 数据：localStorage("xingfu-day-N-state") + POST /api/report (stream)

const params = new URLSearchParams(location.search);
const dayNum = parseInt(params.get("day") || "1", 10);
const STATE_KEY = `xingfu-day-${dayNum}-state`;
const REPORT_KEY = `xingfu-day-${dayNum}-report`;
const REPORT_META_KEY = `xingfu-day-${dayNum}-report-meta`;
const API_BASE = location.origin;

document.getElementById("report-top").textContent = `DAY ${String(dayNum).padStart(2, "0")} · LETTER`;

async function loadDayData() {
  const res = await fetch(`assets/days/day${dayNum}.json`);
  if (!res.ok) throw new Error("加载 day data 失败");
  return res.json();
}
function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function buildEchoEntries(dayData, state) {
  const entries = [];
  for (const page of dayData.pages) {
    if (page.category !== "awareness") continue;
    const ans = state.answers[page.id];
    if (ans == null || ans === "") continue;
    let answerLabel = "";
    if (page.type === "single_choice" || page.type === "scale") {
      const opt = (page.options || []).find(o => o.id === ans);
      answerLabel = opt ? opt.label : ans;
    } else if (page.type === "text") {
      answerLabel = ans;
    } else if (Array.isArray(ans)) {
      const labels = ans.map(id => {
        const opt = (page.options || []).find(o => o.id === id);
        return opt ? opt.label : id;
      });
      answerLabel = labels.join("、");
    } else {
      answerLabel = String(ans);
    }
    entries.push({
      pageId: page.id, type: page.type,
      question: (page.question || "").replace(/\*\*/g, ""),
      answer: answerLabel
    });
  }
  return entries;
}

function buildPayload(dayData, state, echoEntries) {
  const userInputs = {};
  for (const e of echoEntries) {
    userInputs[e.pageId] = { question: e.question, answer: e.answer };
  }
  return {
    day: dayData.day,
    theme: dayData.theme,
    coreLine: dayData.coreLine,
    stageName: dayData.stage?.name || "",
    userInputs,
    knowledgeResults: state.knowledgeResult || {}
  };
}

function colorOf(stageId) {
  return { 1:"#F09866", 2:"#E5B14B", 3:"#7BBE7E", 4:"#7AA8D6" }[stageId] || "#B26A2E";
}
function tintOf(stageId) {
  return { 1:"#FBE3D1", 2:"#F6E5B6", 3:"#D8EDD9", 4:"#D5E5F0" }[stageId] || "#F0E6D6";
}

function renderHero(dayData) {
  const stage = dayData.stage || {};
  const meta = window.XINGFU?.getDayMeta(dayData.day);
  const stageId = meta?.stage?.id ?? stage.stageNumber ?? 1;
  const stageColor = colorOf(stageId);
  const stageTint = tintOf(stageId);

  document.getElementById("hero-root").innerHTML = `
    <div class="report-hero reveal" data-delay="1" style="--hero-tint:${stageTint}; --hero-accent:${stageColor};">
      <div class="report-hero-spark">✦</div>
      <div class="report-hero-eyebrow">DAY ${String(dayData.day).padStart(2, "0")} · ${escapeHtml(stage.name || meta?.stage?.name || "")}</div>
      <h1 class="report-hero-title">${escapeHtml(dayData.theme)}</h1>
      <div class="report-hero-coreline">「${escapeHtml(dayData.coreLine || "")}」</div>
    </div>
  `;
}

function renderEcho(entries) {
  const root = document.getElementById("echo-root");
  if (!entries.length) { root.innerHTML = ""; return; }
  const text = entries.filter(e => e.type === "text");
  const scale = entries.filter(e => e.type === "scale");
  const others = entries.filter(e => e.type !== "text" && e.type !== "scale");
  const picks = [...text, ...scale, ...others].slice(0, 4);
  const itemsHtml = picks.map(e => `
    <li class="echo-item">
      <div class="echo-q">${escapeHtml((e.question || "").slice(0, 80))}${(e.question || "").length > 80 ? "…" : ""}</div>
      <div class="echo-a">${escapeHtml(e.answer)}</div>
    </li>
  `).join("");
  root.innerHTML = `
    <div class="card echo-card reveal" data-delay="2">
      <div class="echo-eyebrow">what you wrote today</div>
      <ul class="echo-list">${itemsHtml}</ul>
    </div>
  `;
}

function renderActions() {
  document.getElementById("actions-root").innerHTML = `
    <div class="btn-stack reveal" data-delay="2">
      <a class="btn-primary" href="index.html">回 到 首 页</a>
      <a class="btn-secondary" href="reports.html">看 历 史 报 告</a>
      <button class="btn-ghost" id="regen-btn" type="button">重 新 生 成</button>
    </div>
  `;
  document.getElementById("regen-btn").onclick = () => {
    if (!confirm("重新让 AI 生成一份新的报告？")) return;
    localStorage.removeItem(REPORT_KEY);
    location.reload();
  };
}

async function start() {
  let dayData, state;
  try {
    dayData = await loadDayData();
    state = loadState();
    if (!state) throw new Error("没找到今天的练习数据，请先去做一遍 Day" + dayNum);
  } catch (e) {
    showError(e.message);
    return;
  }

  renderHero(dayData);
  const echoEntries = buildEchoEntries(dayData, state);
  renderEcho(echoEntries);

  const cached = localStorage.getItem(REPORT_KEY);
  if (cached) {
    renderReport(cached);
    renderActions();
    return;
  }

  const payload = buildPayload(dayData, state, echoEntries);

  try {
    const res = await fetch(`${API_BASE}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`服务返回 ${res.status}：${text.slice(0, 100)}`);
    }
    await streamReport(res, dayData);
  } catch (e) {
    showError(`生成失败：${e.message}\n\n请确认 api-proxy 已启动（在 api-proxy/ 目录下跑 npm install && npm start）。`);
  }
}

async function streamReport(res, dayData) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  document.getElementById("report-root").innerHTML = `
    <div class="card report-card reveal" data-delay="3">
      <div class="report-body" id="report-stream"></div>
    </div>
  `;
  const stream = document.getElementById("report-stream");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim() || !line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") {
        finalize(fullText, dayData);
        return;
      }
      try {
        const json = JSON.parse(data);
        if (json.delta) {
          fullText += json.delta;
          stream.innerHTML = marked.parse(fullText) + '<span class="typing-cursor"></span>';
          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        }
      } catch {}
    }
  }
  if (fullText) finalize(fullText, dayData);
}

function finalize(text, dayData) {
  localStorage.setItem(REPORT_KEY, text);
  localStorage.setItem(REPORT_META_KEY, JSON.stringify({
    generatedAt: Date.now(),
    theme: dayData.theme,
    stageName: dayData.stage?.name || ""
  }));
  renderReport(text);
  renderActions();
}

function renderReport(text) {
  const html = marked.parse(text, { breaks: true, gfm: true });
  document.getElementById("report-root").innerHTML = `
    <div class="card report-card">
      <div class="report-body">${html}</div>
    </div>
  `;
}

function showError(msg) {
  document.getElementById("hero-root").innerHTML = "";
  document.getElementById("echo-root").innerHTML = "";
  document.getElementById("report-root").innerHTML = `
    <div class="card">
      <p style="color: var(--wrong); margin: 0 0 16px 0; white-space: pre-line; font-size:14px; line-height:1.8;">${escapeHtml(msg)}</p>
      <a href="day.html?day=${dayNum}" class="btn-primary" style="display:flex;">回 到 今 日 卡 片</a>
    </div>
  `;
}

start();
