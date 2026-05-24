// 幸福计划 · 兑换码模块（MVP 硬编码版）
// TODO 升级：后端校验 + token 颁发，见 BACKLOG.md

const REDEEM_KEY = "xingfu-redeem-code";
const ONBOARDED_KEY = "xingfu-onboarded";

// 硬编码有效码。给朋友测时挑一组发出去即可。注释里写「用途 / 备注」便于以后回查。
const VALID_CODES = new Set([
  "FYQS-2026",      // 飞扬启示，给瀚森哥自己留
  "MENG-GULI",      // 公众号「蒙在鼓里」读者
  "VIBE-CODE",      // VibeCoding 课程学员
  "BUDENG-71",      // 笔名「王不等」71 天
  "GUOHANSEN"       // 通用测试码
]);

function normalize(code) {
  return String(code || "").trim().toUpperCase();
}

function isValidCode(code) {
  return VALID_CODES.has(normalize(code));
}

function isRedeemed() {
  return !!localStorage.getItem(REDEEM_KEY);
}

function isOnboarded() {
  return localStorage.getItem(ONBOARDED_KEY) === "true";
}

function redeem(code) {
  if (!isValidCode(code)) return false;
  localStorage.setItem(REDEEM_KEY, normalize(code));
  return true;
}

function markOnboarded() {
  localStorage.setItem(ONBOARDED_KEY, "true");
}

function clearRedeem() {
  localStorage.removeItem(REDEEM_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
}

window.XingfuRedeem = { isValidCode, isRedeemed, isOnboarded, redeem, markOnboarded, clearRedeem };
