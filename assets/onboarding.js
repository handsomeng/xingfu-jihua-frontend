// 幸福计划 · Onboarding 滑卡 + 兑换码 sheet
(function () {
  const track = document.getElementById("track");
  const dots = Array.from(document.querySelectorAll(".dot"));
  const nextBtn = document.getElementById("next-btn");
  const startBtn = document.getElementById("start-btn");
  const skipBtn = document.getElementById("skip-btn");
  const overlay = document.getElementById("redeem-overlay");
  const sheet = document.getElementById("redeem-sheet");
  const input = document.getElementById("redeem-input");
  const err = document.getElementById("redeem-error");
  const submitBtn = document.getElementById("redeem-submit");
  const cancelBtn = document.getElementById("redeem-cancel");

  const SLIDE_COUNT = 3;
  let current = 0;

  function goSlide(idx) {
    current = Math.max(0, Math.min(SLIDE_COUNT - 1, idx));
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === current));
    nextBtn.style.opacity = current === SLIDE_COUNT - 1 ? 0 : 1;
    nextBtn.style.pointerEvents = current === SLIDE_COUNT - 1 ? "none" : "auto";
  }

  nextBtn.onclick = () => goSlide(current + 1);
  dots.forEach(d => d.onclick = () => goSlide(parseInt(d.dataset.go, 10)));
  skipBtn.onclick = () => goSlide(SLIDE_COUNT - 1);
  startBtn.onclick = openSheet;

  // 触摸滑动
  let startX = 0, dx = 0, swiping = false;
  track.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    dx = 0;
    swiping = true;
    track.style.transition = "none";
  }, { passive: true });
  track.addEventListener("touchmove", e => {
    if (!swiping) return;
    dx = e.touches[0].clientX - startX;
    const w = track.clientWidth;
    const offset = -current * 100 + (dx / w) * 100;
    track.style.transform = `translateX(${offset}%)`;
  }, { passive: true });
  track.addEventListener("touchend", () => {
    swiping = false;
    track.style.transition = "";
    const threshold = track.clientWidth * 0.18;
    if (dx < -threshold) goSlide(current + 1);
    else if (dx > threshold) goSlide(current - 1);
    else goSlide(current);
  });

  // ============ Redeem Sheet ============
  function openSheet() {
    overlay.classList.add("open");
    sheet.classList.add("open");
    err.textContent = "";
    setTimeout(() => input.focus(), 280);
  }
  function closeSheet() {
    overlay.classList.remove("open");
    sheet.classList.remove("open");
  }
  cancelBtn.onclick = closeSheet;
  overlay.onclick = closeSheet;

  submitBtn.onclick = () => {
    const code = (input.value || "").trim();
    if (!code) {
      shakeAndShow("请输入兑换码");
      return;
    }
    if (XingfuRedeem.redeem(code)) {
      XingfuRedeem.markOnboarded();
      // 成功
      submitBtn.disabled = true;
      submitBtn.textContent = "✓ 解锁成功，准备进入";
      setTimeout(() => location.href = "index.html", 500);
    } else {
      shakeAndShow("兑换码不对，再核对一下？");
    }
  };

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") submitBtn.click();
  });

  function shakeAndShow(msg) {
    err.textContent = msg;
    sheet.classList.remove("shake");
    void sheet.offsetWidth; // restart animation
    sheet.classList.add("shake");
  }

  // 已 onboarded + 已兑换的用户访问 onboarding，直接跳首页
  if (XingfuRedeem.isOnboarded() && XingfuRedeem.isRedeemed()) {
    // 但允许 ?force=1 强制重看
    if (!new URLSearchParams(location.search).has("force")) {
      location.replace("index.html");
      return;
    }
  }

  goSlide(0);
})();
