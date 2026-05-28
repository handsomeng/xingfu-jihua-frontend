// 幸福计划 · 卡片流引擎 (沉浸式 v3)
// 数据：assets/days/day{N}.json
// 状态：localStorage("xingfu-day-{N}-state") + "xingfu-completed-days"
// 题型：content / summary / reading / single_choice / scale / true_false /
//      multiple_choice / fill_blank / text

(function () {
  const params = new URLSearchParams(location.search);
  const dayNum = parseInt(params.get("day") || "1", 10);
  const STATE_KEY = `xingfu-day-${dayNum}-state`;
  const COMPLETED_KEY = "xingfu-completed-days";

  let DAY = null;
  let state = loadState();

  // ============ State ============
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
      judged: {},
      history: [],
      startedAt: Date.now(),
      completedAt: null
    };
  }
  function saveState() { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }

  function markDayCompleted() {
    try {
      const completed = new Set(JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]"));
      completed.add(dayNum);
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed]));
    } catch {}
  }

  // ============ Utils ============
  function md(text) {
    if (!text) return "";
    if (typeof marked === "undefined") return text.replace(/\n/g, "<br>");
    return marked.parse(text, { breaks: true, gfm: true });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  // ============ Init ============
  async function init() {
    try {
      const res = await fetch(`assets/days/day${dayNum}.json`);
      if (!res.ok) throw new Error("加载失败");
      DAY = await res.json();
    } catch (e) {
      document.getElementById("page-root").innerHTML = `<div class="card"><div class="card-body" style="color:var(--wrong);">加载 Day${dayNum} 数据失败：${e.message}</div></div>`;
      return;
    }

    // 顶部进度文案
    const progressLabel = `DAY ${String(DAY.day).padStart(2, "0")} · ${(DAY.stage?.name || "").toUpperCase()}`;
    document.getElementById("top-progress-text").textContent = progressLabel;
    document.title = `Day ${DAY.day} · ${DAY.theme}`;

    // header（章节眉签 + 大数字 + 主题）— 只出现在 p1。其它页隐藏，让 question 占主视觉
    renderHeader();
    renderCurrentPage();
    updatePrevBtn();
  }

  function renderHeader() {
    const stage = DAY.stage || {};
    document.getElementById("day-header-slot").innerHTML = `
      <div class="imm-day-header reveal" data-delay="1">
        <div class="imm-day-stage-eyebrow">${escapeHtml((stage.name || "").replace(/篇$/, ""))}</div>
        <div class="imm-day-num-mark">
          <span class="label">day</span>${DAY.day}
        </div>
        <h1 class="imm-day-theme">${escapeHtml(DAY.theme)}</h1>
        ${DAY.coreLine ? `<div class="imm-day-coreline">${escapeHtml(DAY.coreLine)}</div>` : ""}
      </div>
    `;
  }
  function hideHeader() {
    document.getElementById("day-header-slot").innerHTML = "";
  }

  // ============ Progress ============
  function updateProgress() {
    const idx = DAY.pages.findIndex(p => p.id === state.currentPage);
    const total = DAY.totalPages || DAY.pages.length;
    const cur = idx >= 0 ? idx + 1 : total;
    document.getElementById("progress-fill").style.width = `${(cur / total) * 100}%`;
  }

  // ============ Render dispatch ============
  function renderCurrentPage() {
    const page = DAY.pages.find(p => p.id === state.currentPage);
    if (!page) return;

    updateProgress();

    // 头部仅在 p1 显示
    const isFirstPage = page.id === "p1";
    if (isFirstPage) renderHeader(); else hideHeader();

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
        root.innerHTML = `<div class="card"><div class="card-body">未知题型: ${page.type}</div></div>`;
    }
  }

  // ============ content ============
  function renderContent(page) {
    const titleHtml = page.title ? `<h3 class="card-title">${escapeHtml(page.title)}</h3>` : "";
    document.getElementById("page-root").innerHTML = `
      <div class="card reveal" data-delay="2">
        ${titleHtml}
        <div class="card-body">${md(page.body)}</div>
      </div>
      <div class="reveal" data-delay="4">
        <button class="btn-primary" id="next-btn">${escapeHtml(page.buttonText || "继 续")}</button>
      </div>
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
      <div class="star-burst">✦</div>
      <div class="card card-soft reveal" data-delay="2">
        ${titleHtml}
        <div class="card-body">${md(page.body)}</div>
      </div>
      <div class="reveal btn-stack" data-delay="4">
        <button class="btn-primary" id="next-btn">${escapeHtml(page.buttonText || "看 今 日 的 信")}</button>
        <button class="btn-secondary" id="back-btn">回 到 首 页</button>
      </div>
    `;
    document.getElementById("next-btn").onclick = () => location.href = `report.html?day=${dayNum}`;
    document.getElementById("back-btn").onclick = () => location.href = "index.html";
  }

  // ============ reading ============
  async function renderReading(page) {
    const root = document.getElementById("page-root");
    root.innerHTML = `
      <div class="card reading-card reveal" data-delay="2">
        <div class="reading-eyebrow">${escapeHtml(page.title || "今日完整阅读")}</div>
        ${page.subtitle ? `<div class="reading-subtitle">${escapeHtml(page.subtitle).toUpperCase()}</div>` : ""}
        <div class="reading-body" id="reading-body">
          <div style="display:flex; justify-content:center; padding: 24px 0;"><div class="loading-dots"><span></span><span></span><span></span></div></div>
        </div>
      </div>
      <div class="reveal" data-delay="4">
        <button class="btn-primary" id="next-btn">${escapeHtml(page.buttonText || "读 完 了，继 续")}</button>
      </div>
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

    const btnLabel = page.mustCorrect ? "检 查" : "继 续";

    document.getElementById("page-root").innerHTML = `
      <div class="card reveal" data-delay="2">
        <div class="question">${md(page.question)}</div>
        <div class="options">${optionsHtml}</div>
      </div>
      <div class="reveal" data-delay="4">
        <button class="btn-primary" id="next-btn" ${!userAnswer ? "disabled" : ""}>${btnLabel}</button>
      </div>
    `;

    document.querySelectorAll(".option").forEach(el => {
      el.onclick = () => {
        state.answers[page.id] = el.dataset.opt;
        saveState();
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
          eyebrow: correct ? "well noticed" : "almost there",
          title: correct ? "答对了" : "再想想",
          body: escapeHtml(opt.feedback),
          primaryLabel: correct ? "下 一 题" : "重 新 作 答",
          onPrimary: () => { if (correct) goNext(page); }
        });
      } else {
        showSheet({
          type: "neutral",
          eyebrow: "i hear you",
          title: "我看见你了",
          body: escapeHtml(opt.feedback),
          primaryLabel: "下 一 题",
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
          <span class="option-mark square"></span>
          <span class="option-text">${escapeHtml(opt.label)}</span>
        </button>
      `;
    }).join("");

    const btnLabel = page.mustCorrect ? "检 查" : "继 续";

    document.getElementById("page-root").innerHTML = `
      <div class="card reveal" data-delay="2">
        <div class="question">${md(page.question)}</div>
        <div class="options">${optionsHtml}</div>
      </div>
      <div class="reveal" data-delay="4">
        <button class="btn-primary" id="next-btn" ${userSet.size === 0 ? "disabled" : ""}>${btnLabel}</button>
      </div>
    `;

    document.querySelectorAll(".option").forEach(el => {
      el.onclick = () => {
        const id = el.dataset.opt;
        if (userSet.has(id)) userSet.delete(id); else userSet.add(id);
        state.answers[page.id] = [...userSet];
        saveState();
        el.classList.toggle("selected", userSet.has(id));
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
        const items = page.options
          .filter(opt => userSet.has(opt.id) || correctSet.has(opt.id))
          .map(opt => {
            const isCorrect = correctSet.has(opt.id);
            const isSelected = userSet.has(opt.id);
            let tagHtml;
            if (isCorrect && isSelected)        tagHtml = `<strong style="color:var(--correct);">✓ 选对</strong>`;
            else if (isCorrect && !isSelected)  tagHtml = `<strong style="color:var(--wrong);">漏选</strong>`;
            else                                tagHtml = `<strong style="color:var(--wrong);">× 误选</strong>`;
            return `<li>${tagHtml} ${escapeHtml(opt.feedback)}</li>`;
          }).join("");
        bodyHtml = `<ul>${items}</ul>`;
      }

      if (page.mustCorrect) {
        state.knowledgeResult[page.id] = allCorrect;
        saveState();
        showSheet({
          type: allCorrect ? "correct" : "wrong",
          eyebrow: allCorrect ? "well noticed" : "almost there",
          title: allCorrect ? "答对了" : "差一点",
          bodyHtml,
          primaryLabel: allCorrect ? "下 一 题" : "重 新 作 答",
          onPrimary: () => { if (allCorrect) goNext(page); }
        });
      } else {
        showSheet({
          type: "neutral",
          eyebrow: "i hear you",
          title: "我看见你了",
          bodyHtml,
          primaryLabel: "下 一 题",
          onPrimary: () => goNext(page)
        });
      }
    };
  }

  // ============ fill_blank ============
  function renderFillBlank(page) {
    const userAnswer = state.answers[page.id] || "";
    document.getElementById("page-root").innerHTML = `
      <div class="card reveal" data-delay="2">
        <div class="question">${md(page.question)}</div>
        <input class="fill-input" id="fill-input" placeholder="${escapeHtml(page.placeholder || "")}" value="${escapeHtml(userAnswer)}">
      </div>
      <div class="reveal" data-delay="4">
        <button class="btn-primary" id="next-btn" ${!userAnswer.trim() ? "disabled" : ""}>检 查</button>
      </div>
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
      const correct = (page.correctAnswer || "").toLowerCase();
      const accepts = (page.acceptAnswers || []).map(a => a.toLowerCase());

      let type = "wrong", fb = page.feedback?.wrong || "再想想看。";
      if (ans === correct) { type = "correct"; fb = page.feedback?.correct || "答对了。"; }
      else if (accepts.includes(ans)) { type = "correct"; fb = page.feedback?.accept || "也算对。"; }

      state.knowledgeResult[page.id] = (type === "correct");
      saveState();

      showSheet({
        type,
        eyebrow: type === "correct" ? "well noticed" : "almost there",
        title: type === "correct" ? "答对了" : "再想想",
        body: escapeHtml(fb),
        primaryLabel: type === "correct" ? "下 一 题" : "重 新 作 答",
        onPrimary: () => { if (type === "correct") goNext(page); }
      });
    };
  }

  // ============ text ============
  function renderText(page) {
    const userAnswer = state.answers[page.id] || "";
    const required = page.required !== false;

    document.getElementById("page-root").innerHTML = `
      <div class="card reveal" data-delay="2">
        <div class="question">${md(page.question)}</div>
        <textarea class="text-input" id="text-input" placeholder="${escapeHtml(page.placeholder || "")}">${escapeHtml(userAnswer)}</textarea>
      </div>
      <div class="reveal" data-delay="4">
        <button class="btn-primary" id="next-btn" ${required && !userAnswer.trim() ? "disabled" : ""}>继 续</button>
      </div>
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
        eyebrow: "got it",
        title: "我收到了",
        body: escapeHtml(page.feedback || "你写的话已经记下了。"),
        primaryLabel: "下 一 题",
        onPrimary: () => goNext(page)
      });
    };
  }

  // ============ Bottom Sheet ============
  function showSheet({ type, eyebrow, title, body, bodyHtml, primaryLabel, onPrimary }) {
    document.querySelectorAll(".sheet, .sheet-overlay").forEach(el => el.remove());

    const overlay = document.createElement("div");
    overlay.className = "sheet-overlay";

    const sheet = document.createElement("div");
    sheet.className = "sheet";

    sheet.innerHTML = `
      <div class="sheet-inner">
        <div class="sheet-handle"></div>
        <div class="sheet-mark ${type}">${renderMarkSVG(type)}</div>
        <div class="sheet-eyebrow ${type}">${escapeHtml(eyebrow || "")}</div>
        <div class="sheet-title">${escapeHtml(title)}</div>
        <div class="sheet-body">${bodyHtml || `<p>${body || ""}</p>`}</div>
        <div class="sheet-actions">
          <button class="btn-primary" id="sheet-primary" type="button">${escapeHtml(primaryLabel || "继 续")}</button>
        </div>
      </div>
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
      setTimeout(() => { overlay.remove(); sheet.remove(); }, 500);
    }

    sheet.querySelector("#sheet-primary").onclick = () => {
      close();
      if (typeof onPrimary === "function") onPrimary();
    };
    overlay.onclick = close;
  }

  function renderMarkSVG(type) {
    const color = type === "correct" ? "var(--correct)"
                : type === "wrong"   ? "var(--wrong)"
                : "var(--amber)";
    if (type === "correct") {
      return `<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M 10 19 L 16 25 L 26 11" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
              style="stroke-dasharray: 40; stroke-dashoffset: 40; animation: feedback-stroke 0.45s ease-out 0.1s forwards;" />
      </svg>`;
    }
    if (type === "wrong") {
      return `<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <path d="M 11 11 L 25 25" stroke="${color}" stroke-width="2.6" stroke-linecap="round"
              style="stroke-dasharray: 30; stroke-dashoffset: 30; animation: feedback-stroke 0.32s ease-out 0.1s forwards;" />
        <path d="M 25 11 L 11 25" stroke="${color}" stroke-width="2.6" stroke-linecap="round"
              style="stroke-dasharray: 30; stroke-dashoffset: 30; animation: feedback-stroke 0.32s ease-out 0.4s forwards;" />
      </svg>`;
    }
    // neutral: small flower / sparkle
    return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M 16 6 L 17 14 L 25 16 L 17 18 L 16 26 L 15 18 L 7 16 L 15 14 Z" fill="${color}" opacity="0.85" />
    </svg>`;
  }

  // ============ Nav ============
  function goNext(page) {
    if (page.next) {
      if (!Array.isArray(state.history)) state.history = [];
      state.history.push(state.currentPage);
      state.currentPage = page.next;
      saveState();
      renderCurrentPage();
      updatePrevBtn();
    }
  }

  function goPrev() {
    if (!Array.isArray(state.history) || state.history.length === 0) return;
    const prev = state.history.pop();
    state.currentPage = prev;
    saveState();
    renderCurrentPage();
    updatePrevBtn();
  }

  function updatePrevBtn() {
    const btn = document.getElementById("prev-btn");
    if (!btn) return;
    const canGoBack = Array.isArray(state.history) && state.history.length > 0;
    if (canGoBack) {
      btn.disabled = false;
      btn.style.opacity = "";
      btn.style.pointerEvents = "";
    } else {
      btn.disabled = true;
      btn.style.opacity = "0";
      btn.style.pointerEvents = "none";
    }
  }

  function bindPrevBtn() {
    const btn = document.getElementById("prev-btn");
    if (btn) btn.onclick = goPrev;
  }

  bindPrevBtn();
  init();
})();
