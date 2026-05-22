// 幸福计划 · 卡片流引擎（v2 · bottom sheet 反馈）

const params = new URLSearchParams(location.search);
const dayNum = parseInt(params.get("day") || "1", 10);
const STATE_KEY = `xingfu-day-${dayNum}-state`;
const COMPLETED_KEY = "xingfu-completed-days";

let DAY = null;
let state = loadState();

// ============ 状态 ============
function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    day: dayNum,
    currentPage: "p1",
    answers: {},
    knowledgeResult: {},
    judged: {},        // 已经评判过的题（避免重复弹 sheet）
    startedAt: Date.now(),
    completedAt: null
  };
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function markDayCompleted() {
  try {
    const completed = new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]"));
    completed.add(dayNum);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed]));
  } catch {}
}

// ============ 工具 ============
function md(text) {
  if (!text) return "";
  if (typeof marked === "undefined") return text.replace(/\n/g, "<br>");
  return marked.parse(text, { breaks: true, gfm: true });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

// ============ 初始化 ============
async function init() {
  try {
    const res = await fetch(`assets/days/day${dayNum}.json`);
    if (!res.ok) throw new Error("加载失败");
    DAY = await res.json();
  } catch (e) {
    document.getElementById("page-root").innerHTML = `<div class="card"><p>加载 Day${dayNum} 数据失败：${e.message}</p></div>`;
    return;
  }

  document.getElementById("day-label").textContent = `DAY ${String(DAY.day).padStart(2, "0")} · ${DAY.stage.name}`;
  document.getElementById("day-theme").textContent = DAY.theme;
  document.title = `Day ${DAY.day} · ${DAY.theme}`;

  renderCurrentPage();
}

// ============ 进度条 ============
function updateProgress() {
  const idx = DAY.pages.findIndex(p => p.id === state.currentPage);
  const total = DAY.totalPages;
  const cur = idx >= 0 ? idx + 1 : total;
  document.getElementById("progress-fill").style.width = `${(cur / total) * 100}%`;
  document.getElementById("progress-text").textContent = `${cur}/${total}`;
}

// ============ 渲染分发 ============
function renderCurrentPage() {
  const page = DAY.pages.find(p => p.id === state.currentPage);
  if (!page) return;

  updateProgress();

  const root = document.getElementById("page-root");
  root.innerHTML = "";
  window.scrollTo({ top: 0, behavior: "smooth" });

  switch (page.type) {
    case "content":         renderContent(page); break;
    case "summary":         renderSummary(page); break;
    case "reading":         renderReading(page); break;
    case "single_choice":
    case "scale":
    case "true_false":      renderSingleChoice(page); break;
    case "multiple_choice": renderMultiChoice(page); break;
    case "fill_blank":      renderFillBlank(page); break;
    case "text":            renderText(page); break;
    default:
      root.innerHTML = `<div class="card"><p>未知题型: ${page.type}</p></div>`;
  }
}

// ============ reading 核心阅读卡 ============
async function renderReading(page) {
  const root = document.getElementById("page-root");
  root.innerHTML = `
    <div class="card reading-card">
      <div class="reading-eyebrow">${escapeHtml(page.title || "📖 完整阅读")}</div>
      ${page.subtitle ? `<div class="reading-subtitle">${escapeHtml(page.subtitle)}</div>` : ""}
      <div class="reading-body" id="reading-body">
        <div style="text-align:center; padding: 24px 0;"><div class="loading-dots"><span></span><span></span><span></span></div></div>
      </div>
    </div>
    <button class="btn-primary" id="next-btn">${escapeHtml(page.buttonText || "读完了，继续")}</button>
  `;

  try {
    const res = await fetch(page.source);
    if (!res.ok) throw new Error(`加载 ${page.source} 失败 (${res.status})`);
    const text = await res.text();
    document.getElementById("reading-body").innerHTML = marked.parse(text, { breaks: true, gfm: true });
  } catch (e) {
    document.getElementById("reading-body").innerHTML = `<p style="color: var(--wrong);">加载失败：${e.message}</p>`;
  }

  document.getElementById("next-btn").onclick = () => goNext(page);
}

// ============ content ============
function renderContent(page) {
  const titleHtml = page.title ? `<h3 class="card-title">${escapeHtml(page.title)}</h3>` : "";
  document.getElementById("page-root").innerHTML = `
    <div class="card">
      ${titleHtml}
      <div class="card-body">${md(page.body)}</div>
    </div>
    <button class="btn-primary" id="next-btn">${escapeHtml(page.buttonText || "继续")}</button>
  `;
  document.getElementById("next-btn").onclick = () => goNext(page);
}

// ============ summary ============
function renderSummary(page) {
  state.completedAt = state.completedAt || Date.now();
  markDayCompleted();
  saveState();

  const titleHtml = page.title ? `<h3 class="card-title" style="text-align:center;">${escapeHtml(page.title)}</h3>` : "";
  document.getElementById("page-root").innerHTML = `
    <div class="star-burst">⭐</div>
    <div class="card card-soft">
      ${titleHtml}
      <div class="card-body">${md(page.body)}</div>
    </div>
    <button class="btn-primary" id="next-btn">${escapeHtml(page.buttonText || "查看今日报告")}</button>
    <button class="btn-secondary" id="back-btn">回到首页</button>
  `;
  document.getElementById("next-btn").onclick = () => location.href = `report.html?day=${dayNum}`;
  document.getElementById("back-btn").onclick = () => location.href = "index.html";
}

// ============ single_choice / scale / true_false ============
function renderSingleChoice(page) {
  const userAnswer = state.answers[page.id];

  const optionsHtml = page.options.map(opt => {
    const cls = "option" + (userAnswer === opt.id ? " selected" : "");
    return `
      <button class="${cls}" data-opt="${opt.id}" type="button">
        <span class="option-mark"></span>
        <span class="option-text">${escapeHtml(opt.label)}</span>
      </button>
    `;
  }).join("");

  const btnLabel = page.mustCorrect ? "检查" : "继续";

  document.getElementById("page-root").innerHTML = `
    <div class="card">
      <div class="question">${md(page.question)}</div>
      <div class="options">${optionsHtml}</div>
    </div>
    <button class="btn-primary" id="next-btn" ${!userAnswer ? "disabled" : ""}>${btnLabel}</button>
  `;

  document.querySelectorAll(".option").forEach(el => {
    el.onclick = () => {
      state.answers[page.id] = el.dataset.opt;
      saveState();
      // 重渲染让选中态生效
      document.querySelectorAll(".option").forEach(o => o.classList.toggle("selected", o.dataset.opt === el.dataset.opt));
      document.getElementById("next-btn").disabled = false;
    };
  });

  document.getElementById("next-btn").onclick = () => {
    const ans = state.answers[page.id];
    if (!ans) return;
    const opt = page.options.find(o => o.id === ans);

    if (page.mustCorrect) {
      const correct = ans === page.correctAnswer;
      state.knowledgeResult[page.id] = correct;
      saveState();
      showSheet({
        type: correct ? "correct" : "wrong",
        title: correct ? "答对了" : "再想想",
        body: escapeHtml(opt.feedback),
        primaryLabel: correct ? "下一题" : "重新作答",
        onPrimary: () => {
          if (correct) goNext(page);
          else {
            // 不清空，让用户改选
          }
        }
      });
    } else {
      // 觉察题，无对错
      showSheet({
        type: "neutral",
        title: "我看见你了",
        body: escapeHtml(opt.feedback),
        primaryLabel: "下一题",
        onPrimary: () => goNext(page)
      });
    }
  };
}

// ============ multiple_choice ============
function renderMultiChoice(page) {
  const userAnswer = state.answers[page.id] || [];
  const userSet = new Set(userAnswer);
  const correctSet = new Set(page.correctAnswers || []);

  const optionsHtml = page.options.map(opt => {
    const cls = "option" + (userSet.has(opt.id) ? " selected" : "");
    return `
      <button class="${cls}" data-opt="${opt.id}" type="button">
        <span class="option-mark square">${userSet.has(opt.id) ? "✓" : ""}</span>
        <span class="option-text">${escapeHtml(opt.label)}</span>
      </button>
    `;
  }).join("");

  const btnLabel = page.mustCorrect ? "检查" : "继续";

  document.getElementById("page-root").innerHTML = `
    <div class="card">
      <div class="question">${md(page.question)}</div>
      <div class="options">${optionsHtml}</div>
    </div>
    <button class="btn-primary" id="next-btn" ${userSet.size === 0 ? "disabled" : ""}>${btnLabel}</button>
  `;

  document.querySelectorAll(".option").forEach(el => {
    el.onclick = () => {
      const id = el.dataset.opt;
      if (userSet.has(id)) userSet.delete(id);
      else userSet.add(id);
      state.answers[page.id] = [...userSet];
      saveState();
      // 更新视图
      el.classList.toggle("selected");
      el.querySelector(".option-mark").textContent = userSet.has(id) ? "✓" : "";
      document.getElementById("next-btn").disabled = userSet.size === 0;
    };
  });

  document.getElementById("next-btn").onclick = () => {
    if (userSet.size === 0) return;

    const allCorrect = userSet.size === correctSet.size && [...correctSet].every(id => userSet.has(id));

    let bodyHtml;
    if (allCorrect && page.allCorrectFeedback) {
      bodyHtml = `<p>${escapeHtml(page.allCorrectFeedback)}</p>`;
    } else {
      const lines = page.options
        .filter(opt => userSet.has(opt.id) || correctSet.has(opt.id))
        .map(opt => {
          const tag = correctSet.has(opt.id)
            ? (userSet.has(opt.id) ? "✓" : "漏选")
            : "误选";
          return `<li><strong>${tag}</strong> ${escapeHtml(opt.feedback)}</li>`;
        }).join("");
      bodyHtml = `<ul>${lines}</ul>`;
    }

    if (page.mustCorrect) {
      state.knowledgeResult[page.id] = allCorrect;
      saveState();
      showSheet({
        type: allCorrect ? "correct" : "wrong",
        title: allCorrect ? "答对了" : "差一点",
        bodyHtml,
        primaryLabel: allCorrect ? "下一题" : "重新作答",
        onPrimary: () => { if (allCorrect) goNext(page); }
      });
    } else {
      showSheet({
        type: "neutral",
        title: "我看见你了",
        bodyHtml,
        primaryLabel: "下一题",
        onPrimary: () => goNext(page)
      });
    }
  };
}

// ============ fill_blank ============
function renderFillBlank(page) {
  const userAnswer = state.answers[page.id] || "";

  document.getElementById("page-root").innerHTML = `
    <div class="card">
      <div class="question">${md(page.question)}</div>
      <input class="fill-input" id="fill-input" placeholder="${escapeHtml(page.placeholder || "")}" value="${escapeHtml(userAnswer)}">
    </div>
    <button class="btn-primary" id="next-btn" ${!userAnswer.trim() ? "disabled" : ""}>检查</button>
  `;

  const input = document.getElementById("fill-input");
  input.oninput = (e) => {
    state.answers[page.id] = e.target.value;
    saveState();
    document.getElementById("next-btn").disabled = !e.target.value.trim();
  };

  document.getElementById("next-btn").onclick = () => {
    const val = (state.answers[page.id] || "").trim();
    if (!val) return;

    const ans = val.toLowerCase();
    const correct = page.correctAnswer.toLowerCase();
    const accepts = (page.acceptAnswers || []).map(a => a.toLowerCase());

    let type = "wrong";
    let fb = page.feedback.wrong;
    if (ans === correct) { type = "correct"; fb = page.feedback.correct; }
    else if (accepts.includes(ans)) { type = "correct"; fb = page.feedback.accept; }

    state.knowledgeResult[page.id] = (type === "correct");
    saveState();

    showSheet({
      type,
      title: type === "correct" ? "答对了" : "再想想",
      body: escapeHtml(fb),
      primaryLabel: type === "correct" ? "下一题" : "重新作答",
      onPrimary: () => { if (type === "correct") goNext(page); }
    });
  };
}

// ============ text ============
function renderText(page) {
  const userAnswer = state.answers[page.id] || "";
  const required = page.required !== false;

  document.getElementById("page-root").innerHTML = `
    <div class="card">
      <div class="question">${md(page.question)}</div>
      <textarea class="text-input" id="text-input" placeholder="${escapeHtml(page.placeholder || "")}">${escapeHtml(userAnswer)}</textarea>
    </div>
    <button class="btn-primary" id="next-btn" ${required && !userAnswer.trim() ? "disabled" : ""}>继续</button>
  `;

  const input = document.getElementById("text-input");
  input.oninput = (e) => {
    state.answers[page.id] = e.target.value;
    saveState();
    document.getElementById("next-btn").disabled = required && !e.target.value.trim();
  };

  document.getElementById("next-btn").onclick = () => {
    if (required && !(state.answers[page.id] || "").trim()) return;
    showSheet({
      type: "neutral",
      title: "我收到了",
      body: escapeHtml(page.feedback),
      primaryLabel: "下一题",
      onPrimary: () => goNext(page)
    });
  };
}

// ============ Bottom Sheet ============
function showSheet({ type, title, body, bodyHtml, primaryLabel, onPrimary }) {
  // 清掉旧 sheet
  document.querySelectorAll(".sheet, .sheet-overlay").forEach(el => el.remove());

  const overlay = document.createElement("div");
  overlay.className = "sheet-overlay";

  const sheet = document.createElement("div");
  sheet.className = `sheet ${type}`;

  const iconMap = { correct: "✓", wrong: "✕", neutral: "💭" };

  sheet.innerHTML = `
    <div class="sheet-handle"></div>
    <div class="sheet-icon">${iconMap[type] || ""}</div>
    <h3 class="sheet-title">${escapeHtml(title)}</h3>
    <div class="sheet-body">${bodyHtml || body || ""}</div>
    <button class="btn-primary" id="sheet-primary">${escapeHtml(primaryLabel || "继续")}</button>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sheet);

  requestAnimationFrame(() => {
    overlay.classList.add("open");
    sheet.classList.add("open");
  });

  function close() {
    overlay.classList.remove("open");
    sheet.classList.remove("open");
    setTimeout(() => {
      overlay.remove();
      sheet.remove();
    }, 360);
  }

  sheet.querySelector("#sheet-primary").onclick = () => {
    close();
    if (typeof onPrimary === "function") onPrimary();
  };

  overlay.onclick = close;
}

// ============ 跳转 ============
function goNext(page) {
  if (page.next) {
    state.currentPage = page.next;
    saveState();
    renderCurrentPage();
  }
}

init();
