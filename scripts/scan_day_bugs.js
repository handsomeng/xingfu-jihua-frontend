// 对照 app.js 字段契约，扫描 71 个 dayN.json 找数据层 bug
const fs = require("fs");
const DIR = "/Users/handsomeng/vibecoding/xingfu-jihua-frontend/assets/days";

const issues = {
  noSummary: [],          // 没有 summary 页 → day 完不成
  scaleNoOptions: [],     // scale 题缺 options（app.js 当 single_choice 渲染）
  tfNoOptions: [],        // true_false 缺 options
  tfBoolCorrect: [],      // true_false correctAnswer 是布尔（app.js 期望 opt.id）
  scKnowledgeNoCorrect: [],// single_choice 知识题缺 correctAnswer
  mcCorrectNotArray: [],  // multiple_choice correctAnswers 不是数组 / 元素含逗号
  mcNoAllCorrectFb: [],   // multiple_choice 缺 allCorrectFeedback
  optNoFeedback: [],      // 选项 feedback 为空（弹窗会空白）
  fillNoCorrect: [],      // fill_blank 缺 correctAnswer
  correctAnswerNotInOpts: [], // correctAnswer 指向不存在的 opt
  emptyBody: [],          // content/summary body 为空
};

for (let n = 0; n <= 71; n++) {
  const path = `${DIR}/day${n}.json`;
  if (!fs.existsSync(path)) continue;
  let j;
  try { j = JSON.parse(fs.readFileSync(path)); } catch { continue; }
  const pages = j.pages || [];

  const hasSummary = pages.some(p => p.type === "summary");
  if (!hasSummary) issues.noSummary.push(n);

  pages.forEach(p => {
    const tag = `day${n}/${p.id}`;
    const optIds = (p.options || []).map(o => o.id);

    if (p.type === "scale" && (!p.options || p.options.length === 0))
      issues.scaleNoOptions.push(tag);

    if (p.type === "true_false") {
      if (!p.options || p.options.length === 0) issues.tfNoOptions.push(tag);
      if (typeof p.correctAnswer === "boolean") issues.tfBoolCorrect.push(tag);
    }

    if (p.type === "single_choice" && (p.mustCorrect || p.category === "knowledge")) {
      if (!p.correctAnswer) issues.scKnowledgeNoCorrect.push(tag);
      else if (optIds.length && !optIds.includes(p.correctAnswer))
        issues.correctAnswerNotInOpts.push(`${tag} (correctAnswer=${p.correctAnswer})`);
    }

    if (p.type === "multiple_choice") {
      const ca = p.correctAnswers;
      if (!Array.isArray(ca)) issues.mcCorrectNotArray.push(`${tag} (type=${typeof ca})`);
      else if (ca.some(x => typeof x === "string" && (x.includes(",") || x.includes("，"))))
        issues.mcCorrectNotArray.push(`${tag} (元素含逗号: ${JSON.stringify(ca)})`);
      if (!p.allCorrectFeedback) issues.mcNoAllCorrectFb.push(tag);
    }

    if (p.type === "fill_blank" && !p.correctAnswer) issues.fillNoCorrect.push(tag);

    // 选项 feedback 空检查（单选/多选/scale 用 renderSingleChoice/MultiChoice 时会读 opt.feedback）
    if (["single_choice", "multiple_choice", "true_false", "scale"].includes(p.type)) {
      (p.options || []).forEach(o => {
        if (!o.feedback || !o.feedback.trim()) issues.optNoFeedback.push(`${tag}/${o.id}`);
      });
    }

    if ((p.type === "content" || p.type === "summary") && (!p.body || !p.body.trim()))
      issues.emptyBody.push(tag);
  });
}

// 输出
const fmt = (arr, max = 12) => arr.length === 0 ? "无"
  : `${arr.length} 处: ${arr.slice(0, max).join(", ")}${arr.length > max ? " …" : ""}`;

console.log("===== 数据层 bug 扫描（对照 app.js 字段契约）=====\n");
console.log("【严重 · 会卡死/功能断裂】");
console.log("1. 没有 summary 页（day 永远标不了完成）:", fmt(issues.noSummary, 80));
console.log("2. scale 缺 options（app.js 当单选渲染会炸）:", fmt(issues.scaleNoOptions));
console.log("3. true_false 缺 options（同上）:", fmt(issues.tfNoOptions));
console.log("4. true_false correctAnswer 是布尔（期望 opt.id，判对失败卡死）:", fmt(issues.tfBoolCorrect));
console.log("5. single_choice 知识题缺 correctAnswer（判对失败卡死）:", fmt(issues.scKnowledgeNoCorrect));
console.log("6. multiple_choice correctAnswers 非数组/含逗号（判对失败卡死）:", fmt(issues.mcCorrectNotArray));
console.log("7. fill_blank 缺 correctAnswer:", fmt(issues.fillNoCorrect));
console.log("8. correctAnswer 指向不存在的选项:", fmt(issues.correctAnswerNotInOpts));
console.log("\n【中等 · 体验缺损】");
console.log("9. multiple_choice 缺 allCorrectFeedback:", fmt(issues.mcNoAllCorrectFb));
console.log("10. 选项 feedback 为空（弹窗空白）:", fmt(issues.optNoFeedback));
console.log("11. content/summary body 为空:", fmt(issues.emptyBody));

// 题型分布统计
console.log("\n===== 全 71 天题型分布 =====");
const typeCount = {};
for (let n = 1; n <= 71; n++) {
  const path = `${DIR}/day${n}.json`;
  if (!fs.existsSync(path)) continue;
  const j = JSON.parse(fs.readFileSync(path));
  (j.pages || []).forEach(p => { typeCount[p.type] = (typeCount[p.type] || 0) + 1; });
}
console.log(JSON.stringify(typeCount, null, 2));
