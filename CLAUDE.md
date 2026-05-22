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
