// 幸福计划 · AI 报告生成（v2 · hero + echo + 流式四板块）

const params = new URLSearchParams(location.search);
const dayNum = parseInt(params.get("day") || "1", 10);
const STATE_KEY = `xingfu-day-${dayNum}-state`;
const REPORT_KEY = `xingfu-day-${dayNum}-report`;
const REPORT_META_KEY = `xingfu-day-${dayNum}-report-meta`;
const API_BASE = location.origin;

async function loadDayData() {
  const res = await fetch(`assets/days/day${dayNum}.json`);
  if (!res.ok) throw new Error("加载 day data 失败");
  return res.json();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function buildEchoEntries(dayData, state) {
  // 把 awareness 题（用户的真实回答）整理成可回显 + 喂给 AI 的两种结构
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
      pageId: page.id,
      type: page.type,
      question: (page.question || "").replace(/\*\*/g, ""),
      answer: answerLabel
    });
  }
  return entries;
}

function buildPayload(dayData, state, echoEntries) {
  // 喂给后端 AI 的结构（带 question 文本，让 AI 能复述原话）
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

function renderHero(dayData) {
  const stage = dayData.stage || {};
  const stageColor = stage.color || "var(--accent)";
  const stageTint = stage.bgColor || "var(--bg-soft)";
  document.getElementById("hero-root").innerHTML = `
    <div class="report-hero" style="--hero-tint:${stageTint}; --hero-accent:${stageColor};">
      <div class="report-hero-spark">✦</div>
      <div class="report-hero-eyebrow">DAY ${String(dayData.day).padStart(2, "0")} · ${escapeHtml(stage.name || "")}</div>
      <h1 class="report-hero-title">${escapeHtml(dayData.theme)}</h1>
      <div class="report-hero-coreline">「${escapeHtml(dayData.coreLine || "")}」</div>
    </div>
  `;
}

function renderEcho(entries) {
  const root = document.getElementById("echo-root");
  if (!entries.length) {
    root.innerHTML = "";
    return;
  }
  // 只挑 3-4 条最有质感的回答展示，优先 text 类型，其次 scale，其余按顺序补
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
    <div class="card echo-card">
      <div class="echo-eyebrow">你今天写下来的</div>
      <ul class="echo-list">${itemsHtml}</ul>
    </div>
  `;
}

function renderActions() {
  document.getElementById("actions-root").innerHTML = `
    <button class="btn-primary" id="home-btn">回到首页</button>
    <button class="btn-secondary" id="reports-btn">看历史报告</button>
    <button class="btn-ghost" id="regen-btn">重新生成</button>
  `;
  document.getElementById("home-btn").onclick = () => location.href = "index.html";
  document.getElementById("reports-btn").onclick = () => location.href = "reports.html";
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

  // 缓存：如果已有报告，直接展示
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
    <div class="card report-card">
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
      <p style="color: var(--wrong); margin: 0 0 12px 0; white-space: pre-line;">😔 ${escapeHtml(msg)}</p>
      <a href="day.html?day=${dayNum}" class="btn-primary" style="text-decoration: none; text-align: center; display: block;">回到今日卡片</a>
    </div>
  `;
}

start();
