// 幸福计划 · 蛇形路径地图（从下往上走 · Day1 在底）

const STAGES = [
  { num: 1, name: "觉察篇", subtitle: "先把幸福搞清楚",     start: 1,  end: 13 },
  { num: 2, name: "探索篇", subtitle: "幸福有好多种",       start: 14, end: 34 },
  { num: 3, name: "练习篇", subtitle: "动手把幸福练出来",   start: 35, end: 61 },
  { num: 4, name: "内化篇", subtitle: "把幸福沉淀成习惯",   start: 62, end: 71 }
];

const AVAILABLE_DAYS = new Set([1, 2, 3, 4, 5, 6]);

function getCompletedDays() {
  try {
    return new Set(JSON.parse(localStorage.getItem("xingfu-completed-days") || "[]"));
  } catch {
    return new Set();
  }
}

function nodeStatus(day, completed) {
  if (completed.has(day)) return "completed";
  if (AVAILABLE_DAYS.has(day)) return "available";
  return "locked";
}

// 蛇形偏移：按全局 index 算 sin 波，跨阶段连续
function offsetFor(globalIndex) {
  return Math.round(Math.sin(globalIndex * 0.7) * 100);
}

function render() {
  const completed = getCompletedDays();
  // 当前可做的最小 day → 加呼吸光晕
  let currentDay = null;
  for (let d = 1; d <= 71; d++) {
    if (AVAILABLE_DAYS.has(d) && !completed.has(d)) {
      currentDay = d;
      break;
    }
  }

  // 倒序：从 Stage 4 渲染到 Stage 1，每个 stage 内从大编号到小编号
  const html = [];
  let globalIndex = 70; // 用于 sin 偏移，倒序时从大到小（Day 71 globalIndex=70, Day 1 globalIndex=0）

  for (let si = STAGES.length - 1; si >= 0; si--) {
    const stage = STAGES[si];

    // 阶段分隔（在该阶段所有节点之上，即视觉上方）
    html.push(`
      <div class="stage-divider" data-stage="${stage.num}">
        <span class="stage-divider-eyebrow">Stage ${String(stage.num).padStart(2, "0")}</span>
        <div class="stage-divider-name">${stage.name}</div>
        <div class="stage-divider-subtitle">${stage.subtitle}</div>
      </div>
    `);

    // 阶段内：从大编号到小编号
    for (let d = stage.end; d >= stage.start; d--) {
      const status = nodeStatus(d, completed);
      const offset = offsetFor(d - 1); // Day1 globalIndex=0, Day71 globalIndex=70
      const classes = ["path-node", status];
      if (d === currentDay) classes.push("current");
      const tag = (status === "available" || status === "completed") ? "a" : "div";
      const href = (status === "available" || status === "completed") ? ` href="day.html?day=${d}"` : "";
      const content = status === "completed" ? "★" : d;
      html.push(`<${tag}${href} class="${classes.join(" ")}" data-stage="${stage.num}" style="--offset: ${offset}px;">${content}</${tag}>`);
    }
  }

  document.getElementById("pathmap-root").innerHTML = html.join("");

  // 进入时自动滚到当前可做节点（屏幕下 1/3 处），或滚到 Day1（默认起点）
  requestAnimationFrame(() => {
    const target = document.querySelector(".path-node.current")
                || document.querySelector(`.path-node[href*="day=1"]`);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const absoluteTop = window.scrollY + rect.top;
    const viewportH = window.innerHeight;
    window.scrollTo({ top: Math.max(0, absoluteTop - viewportH * 0.65), behavior: "instant" });
  });
}

render();
