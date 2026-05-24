# 幸福计划 · 移动端 H5 原型

## 项目定位

71 天 ToC 幸福养成产品，多邻国式卡片流。MVP 期 Day1-3 可玩，纯静态 HTML+Tailwind+vanilla JS，DeepSeek 流式生成 AI 报告，本地 Node 代理转发避免 key 暴露。

## 启动

```bash
cd api-proxy && npm install && npm start
```

打开 http://localhost:3001/ 或日志里的局域网 IP（手机同 WiFi 直接访问）。

## 核心约束

- 写作硬规则（写进了 server.js 的 system prompt）：禁用「不是…而是…」/ 不用破折号
- API key 只存 api-proxy/.env，已被 .gitignore 排除
- 状态全靠 localStorage，无后端无登录

## 远期需求池

见 [BACKLOG.md](./BACKLOG.md)。**P0 是「AI 实时驱动整个体验」**（反馈个性化、题目动态生成、跨天上下文），瀚森哥 2026-05-21 提出。

## 改动记录

- **2026-05-21 凌晨**：MVP 完成。建项目骨架、3 份 day*.json（每天 27 页）、卡片流引擎（5 题型）、路径地图（71 格四阶段）、reading 页、AI 报告流式（DeepSeek SSE）、本地代理同时托管静态。联调通过。
- **2026-05-21 早**：路径地图改蛇形（sin 波形 + 阶段配色）、反馈改 bottom sheet 弹窗、整体精修留白阴影字体层级。
- **2026-05-21 完成**：A1+B1 阅读卡嵌入卡片流（p4 位置，type=reading，fetch readings/dayN.md 用 marked 渲染）；C1 3 道 fill_blank 改成单选「不包括/最不像/不属于」类型；路径地图改成从下往上走（Day1 在底，进入自动滚到当前节点屏幕下 1/3）。Day*.json 重写为 25 页结构，删冗余 CONTENT。
- **2026-05-22**：架构改三层。新 index.html 是**一屏首页**（品牌 + 当前任务卡 + 主 CTA + 总进度），不滚动。路径地图迁到 **map.html**（次级页面，从首页右上角 ⌖ 图标进入）。home.js 自动算当前可做 day、CTA 直跳 day.html。设置图标暂绑「清空进度」。
- **2026-05-22 晚**：新增 Day4-6 全部产出（基于 obsidian markdown 翻成 day4/5/6.json + 拷贝 readings/day4-6.md + home.js DAY_META 扩到 6 天 + pathmap.js AVAILABLE_DAYS 解锁 Day1-6）。Day4「好事为何不香了」/ Day5「坏事为何更扎心」/ Day6「比较快乐的小偷」全部 25 页结构对齐，联调通过。
- **2026-05-24**：报告系统升级。`report.html` 重写：hero 区（DAY + 主题 + 核心句 + 闪烁 ✦）/ echo 区（"你今天写下来的"，回显用户 text+scale 关键回答）/ AI 流式四板块 / actions（回首页 + 看历史 + 重新生成）。`server.js` prompt 接 stageName，buildUserPrompt 兼容新结构 `{ question, answer }`，让 AI 报告能复述用户原话。新增 `reports.html` + `reports.js`（已完成 Day 的历史报告列表，按阶段配色）。`index.html` 顶部加 📓 入口跳 reports.html。styles.css 加 report-hero / echo-card / report-list-* / btn-ghost 全套样式。
- **2026-05-24 晚**：主页 + Onboarding + 目录 + 兑换码大改。新建 `assets/curriculum.js`（71 天 + 4 阶段单一数据源，含 STAGES / CURRICULUM / AVAILABLE_DAYS / getDayMeta），`assets/redeem.js`（兑换码硬编码 + isOnboarded / isRedeemed 状态机）。新建 `onboarding.html` + `onboarding.js`：3 屏滑卡（是什么 / 怎么练 / 为什么靠谱）+ 末屏 CTA → 底部 sheet 输码 → 解锁后跳首页（带触摸 swipe / dot / 跳过 / shake 错误反馈）。重写 `index.html` → landing：品牌 hero（发光球 + ✦）+ 今日 Day 摘要卡（按阶段染色）+ 主 CTA 继续 / 副 CTA 看完整目录 + 总进度。`home.js` 改 landing 渲染 + redeem 守卫。新建 `catalog.html` + `catalog.js`：4 阶段折叠列表（默认展开当前 Day 所在阶段）+ 每天 3 态（done / current / available / locked）。`reports.js` 改读 curriculum 数据源。`BACKLOG.md` 加 P4.5 兑换码后端化 + P4.6 AVAILABLE_DAYS 单数据源。styles.css 加 landing / onboarding / redeem sheet / catalog 全套样式（约 600 行）。当前硬编码兑换码：FYQS-2026 / MENG-GULI / VIBE-CODE / BUDENG-71 / GUOHANSEN。
- **2026-05-24 深夜**：新增 Day 0「入门日」+ 日记本视图。`assets/days/day0.json`（11 页，纯觉察题：为什么按下开始 / 现在最想被回答的问题 / 状态打分 / 心里那块堵 / 71 天后期待 / 给今天自己写一句话）。`curriculum.js` 加 ONBOARDING_DAY 对象 + AVAILABLE_DAYS 加 0 + getDayMeta(0) 返回入门数据。`server.js` 加 `buildDay0SystemPrompt()` 给 Day 0 用专属 AI 报告 prompt（4 板块：看见你了 / 一个小发现 / 接下来 71 天我会陪你 / 今晚带着走），跟 Day1-71 的"含温柔提醒"版本区分。`catalog.js` 把 Day 0 单独渲染在 4 阶段之上（独立的入门卡）。`home.js + catalog.js` 进度算法排除 Day 0（不计入 71 天分母）。新建 `journal.html` + `assets/journal.js`：日记本视图，聚合所有 day 的 text 题答案，按 Day 倒序展示，每条带"那天主题 + 用户原话 + 看那天报告"链接，是阶段性复盘的基础。`index.html` 顶部加 ✎ 入口跳 journal.html。styles.css 加 catalog-onboarding / journal-* 全套样式。
