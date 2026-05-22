// 幸福计划 · AI 报告生成

const params = new URLSearchParams(location.search);
const dayNum = parseInt(params.get("day") || "1", 10);
const STATE_KEY = `xingfu-day-${dayNum}-state`;
const REPORT_KEY = `xingfu-day-${dayNum}-report`;
const API_BASE = location.origin; // 同源

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

function buildPayload(dayData, state) {
  // 觉察题：取 pages 里 category === awareness 的回答
  // 知识题对错：state.knowledgeResult
  const userInputs = {};
  const knowledgeResults = state.knowledgeResult || {};

  for (const page of dayData.pages) {
    if (page.category === "awareness" && state.answers[page.id] != null) {
      const ans = state.answers[page.id];
      if (page.type === "single_choice" || page.type === "scale") {
        const opt = page.options.find(o => o.id === ans);
        userInputs[page.id] = opt ? opt.label : ans;
      } else if (page.type === "text") {
        userInputs[page.id] = ans;
      } else {
        userInputs[page.id] = Array.isArray(ans) ? ans.join("、") : ans;
      }
    }
  }

  return {
    day: dayData.day,
    theme: dayData.theme,
    coreLine: dayData.coreLine,
    userInputs,
    knowledgeResults
  };
}

async function generateReport() {
  let dayData, state;
  try {
    dayData = await loadDayData();
    state = loadState();
    if (!state) throw new Error("没找到今天的练习数据，请先去做一遍 Day" + dayNum);
  } catch (e) {
    showError(e.message);
    return;
  }

  // 缓存：如果已有报告，直接展示
  const cached = localStorage.getItem(REPORT_KEY);
  if (cached) {
    renderReport(cached, /* fromCache */ true);
    return;
  }

  const payload = buildPayload(dayData, state);

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

    await streamReport(res);
  } catch (e) {
    showError(`生成失败：${e.message}\n\n请确认 api-proxy 已启动（在 api-proxy/ 目录下跑 npm install && npm start）。`);
  }
}

async function streamReport(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  // 初始化容器
  document.getElementById("report-root").innerHTML = `
    <div class="card">
      <div class="report-body" id="report-stream"></div>
    </div>
    <button class="btn-secondary" id="back-btn" style="margin-top: 16px;">回到首页</button>
  `;
  const stream = document.getElementById("report-stream");
  document.getElementById("back-btn").onclick = () => location.href = "index.html";

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
        localStorage.setItem(REPORT_KEY, fullText);
        renderReport(fullText, false);
        return;
      }
      try {
        const json = JSON.parse(data);
        if (json.delta) {
          fullText += json.delta;
          stream.innerHTML = marked.parse(fullText) + '<span class="typing-cursor"></span>';
        }
      } catch {}
    }
  }
  // 流结束但没有 [DONE]
  if (fullText) {
    localStorage.setItem(REPORT_KEY, fullText);
    renderReport(fullText, false);
  }
}

function renderReport(text, fromCache) {
  const html = marked.parse(text, { breaks: true, gfm: true });
  document.getElementById("report-root").innerHTML = `
    <div class="card">
      <div class="report-body">${html}</div>
    </div>
    <button class="btn-secondary" id="back-btn" style="margin-top: 16px;">回到首页</button>
    <button class="btn-secondary" id="regen-btn" style="margin-top: 8px;">重新生成</button>
  `;
  document.getElementById("back-btn").onclick = () => location.href = "index.html";
  document.getElementById("regen-btn").onclick = () => {
    localStorage.removeItem(REPORT_KEY);
    location.reload();
  };
}

function showError(msg) {
  document.getElementById("report-root").innerHTML = `
    <div class="card">
      <p style="color: var(--wrong); margin: 0 0 12px 0;">😔 ${msg}</p>
      <a href="day.html?day=${dayNum}" class="btn-primary" style="text-decoration: none; text-align: center;">回到今日卡片</a>
    </div>
  `;
}

generateReport();
