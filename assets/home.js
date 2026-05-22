// 幸福计划 · 首页

const DAY_META = {
  1: { stage: "觉察篇", theme: "幸福不只是开心",     duration: "约 15 分钟" },
  2: { stage: "觉察篇", theme: "我们都追错了",       duration: "约 15 分钟" },
  3: { stage: "觉察篇", theme: "四成幸福靠自己",     duration: "约 15 分钟" },
  4: { stage: "觉察篇", theme: "好事为何不香了",     duration: "约 15 分钟" },
  5: { stage: "觉察篇", theme: "坏事为何更扎心",     duration: "约 15 分钟" },
  6: { stage: "觉察篇", theme: "比较，快乐的小偷",   duration: "约 15 分钟" }
};

const AVAILABLE_DAYS = [1, 2, 3, 4, 5, 6];
const TOTAL = 71;

function getCompleted() {
  try {
    return new Set(JSON.parse(localStorage.getItem("xingfu-completed-days") || "[]"));
  } catch {
    return new Set();
  }
}

function getCurrentDay(completed) {
  for (const d of AVAILABLE_DAYS) {
    if (!completed.has(d)) return d;
  }
  return null;
}

function render() {
  const completed = getCompleted();
  const completedTotal = completed.size;
  const currentDay = getCurrentDay(completed);
  const taskCard = document.getElementById("task-card");
  const ctaBtn = document.getElementById("cta-btn");

  if (currentDay) {
    const meta = DAY_META[currentDay];
    const ctaLabel = completedTotal === 0 ? "开始今天  →" : `继续 Day ${currentDay}  →`;
    taskCard.innerHTML = `
      <div class="task-card-eyebrow">DAY ${String(currentDay).padStart(2, "0")} · ${meta.stage}</div>
      <h2 class="task-card-theme">${meta.theme}</h2>
      <div class="task-card-divider"></div>
      <div class="task-card-meta">${meta.duration}</div>
    `;
    ctaBtn.textContent = ctaLabel;
    ctaBtn.href = `day.html?day=${currentDay}`;
  } else {
    // 可做的全部完成
    taskCard.classList.add("done-all");
    taskCard.innerHTML = `
      <div class="task-card-eyebrow">恭喜</div>
      <h2 class="task-card-theme">你完成了能做的部分</h2>
      <div class="task-card-divider" style="margin-left:auto; margin-right:auto;"></div>
      <div class="task-card-meta">Day 4 之后的内容陆续解锁</div>
    `;
    ctaBtn.textContent = "查看完整路径  →";
    ctaBtn.href = "map.html";
  }

  // 总进度
  const pct = (completedTotal / TOTAL) * 100;
  document.getElementById("progress-fill").style.width = `${pct}%`;
  document.getElementById("progress-text").textContent = `${completedTotal}/${TOTAL}`;

  // 设置图标暂时绑一个简易菜单（点了清空数据）
  document.getElementById("settings-btn").onclick = () => {
    if (confirm("清空所有进度？这会让你回到 Day1 的起点。")) {
      Object.keys(localStorage)
        .filter(k => k.startsWith("xingfu-"))
        .forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
      location.reload();
    }
  };
}

render();
