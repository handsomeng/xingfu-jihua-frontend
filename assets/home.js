// 幸福计划 · Landing 主页
// 依赖：assets/curriculum.js（XINGFU）+ assets/redeem.js（XingfuRedeem）

(function () {
  const TOTAL = 71;

  // 守卫：未 onboarded / 未 redeem 的用户先去 onboarding
  if (!XingfuRedeem.isOnboarded() || !XingfuRedeem.isRedeemed()) {
    location.replace("onboarding.html");
    return;
  }

  function loadCompleted() {
    try {
      return new Set(JSON.parse(localStorage.getItem("xingfu-completed-days") || "[]"));
    } catch {
      return new Set();
    }
  }

  function getCurrentDay(completed) {
    for (const d of XINGFU.AVAILABLE_DAYS) {
      if (!completed.has(d)) return d;
    }
    return null;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function render() {
    const completed = loadCompleted();
    // Day 0 是入门，不计入 71 天进度
    const completedCount = [...completed].filter(d => d > 0).length;
    const currentDay = getCurrentDay(completed);

    const todayBox = document.getElementById("landing-today");
    const cta = document.getElementById("cta-primary");

    if (currentDay != null) {
      const meta = XINGFU.getDayMeta(currentDay);
      const stage = meta.stage;
      todayBox.innerHTML = `
        <div class="landing-today-card" style="--card-tint:${stage.tint}; --card-accent:${stage.color};">
          <div class="landing-today-eyebrow">今天</div>
          <div class="landing-today-day">DAY ${String(currentDay).padStart(2, "0")} · ${escapeHtml(stage.name)}</div>
          <div class="landing-today-theme">${escapeHtml(meta.theme)}</div>
          <div class="landing-today-coreline">${escapeHtml(meta.coreLine)}</div>
        </div>
      `;
      cta.textContent = completedCount === 0 ? "开始今天  →" : `继续 Day ${currentDay}  →`;
      cta.href = `day.html?day=${currentDay}`;
    } else {
      // 当前可做的全部完成
      todayBox.innerHTML = `
        <div class="landing-today-card landing-today-done">
          <div class="landing-today-eyebrow">恭喜</div>
          <div class="landing-today-theme">已完成全部可解锁的内容</div>
          <div class="landing-today-coreline">新的天数陆续上线</div>
        </div>
      `;
      cta.textContent = "看完整目录  →";
      cta.href = "catalog.html";
    }

    document.getElementById("progress-fill").style.width = `${(completedCount / TOTAL) * 100}%`;
    document.getElementById("progress-text").textContent = `${completedCount}/${TOTAL}`;

    document.getElementById("settings-btn").onclick = () => {
      const choice = prompt(
        "输入选项数字：\n1. 清空所有进度（重头开始）\n2. 清空兑换码 + 进度（回 onboarding）\n（直接关闭=取消）"
      );
      if (choice === "1") {
        Object.keys(localStorage)
          .filter(k => k.startsWith("xingfu-day-") || k === "xingfu-completed-days")
          .forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        location.reload();
      } else if (choice === "2") {
        Object.keys(localStorage)
          .filter(k => k.startsWith("xingfu-"))
          .forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        location.replace("onboarding.html");
      }
    };
  }

  render();
})();
