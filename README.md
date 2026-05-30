# 幸福计划

> 一个 71 天的 ToC 幸福养成产品。
> 把幸福从一种运气，变成一种能练出来的本事。

[![Status](https://img.shields.io/badge/已上线-Day_0--71_全量-7BBE7E)]()
[![Tech](https://img.shields.io/badge/Tech-HTML_%2B_vanilla_JS_%2B_immersive.css-FAF6EE)]()
[![AI](https://img.shields.io/badge/AI-DeepSeek-3D332A)]()

---

## 这是什么

幸福计划是一款多邻国式的移动端 H5 产品。每天一节，约 25-27 张卡片，带用户走完 71 天积极心理学课程，每天结尾由 AI 教练生成一份个性化报告。沉浸式视觉系统（immersive.css），按天顺序解锁 + 每日 3 节额度。

理论底座是积极心理学三大经典：

- 耶鲁 Laurie Santos《The Science of Well-Being》
- Martin Seligman《Flourish》PERMA 五支柱
- Sonja Lyubomirsky《The How of Happiness》幸福饼模型

## 当前进度

**Day 0 入门 + Day 1–71 全量内容已上线**（2026-05 完成 v2 费曼版全量翻译 + 沉浸式 v3 重构）。

| 阶段 | 天数 | 状态 |
|------|------|------|
| 阶段 0 · 入门日 | Day 0 | ✅ 已上线 |
| 阶段 1 · 觉察篇 | Day 1–13 | ✅ 已上线 |
| 阶段 2 · 探索篇 | Day 14–34 | ✅ 已上线 |
| 阶段 3 · 练习篇 | Day 35–61 | ✅ 已上线 |
| 阶段 4 · 内化篇 | Day 62–71 | ✅ 已上线 |

内容源：`~/Obsidian/9-幸福计划/v2-费曼版/`（markdown）→ `scripts/v2_md_to_json.py` 转成 `assets/days/dayN.json`。改完用 `npm run validate:data` 扫数据层 bug。

每天包含：约 1800 字独立阅读（`readings/dayN.md`）+ 25-27 页结构化卡片流（含 content / single_choice / multiple_choice / true_false / scale / fill_blank / text / reading / summary 题型）+ 一份 AI 报告。

> 遗留：Day31-71 部分觉察题选项反馈在内容源里是占位（约 2700 处 feedback 空），仅影响 bottom sheet 反馈展示，不卡死、不影响答题判对，待后续补内容。

## 快速启动

### 1. 安装依赖（仅首次）

```bash
cd api-proxy
npm install
```

### 2. 配置 AI 报告 Key

在 `api-proxy/.env` 配置 DeepSeek API key：

```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
PORT=3001
```

去 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 申请 key。

### 3. 启动

```bash
cd api-proxy
npm start
```

控制台会打印：

```
✓ 幸福计划已启动

  本机访问：  http://localhost:3001/
  手机访问（同 WiFi）：
              http://192.168.1.xxx:3001/
```

iPhone Safari 打开局域网地址，加到主屏幕，体验最接近原生 App。

## 仓库结构

```
xingfu-jihua-frontend/
├── index.html              首页（一屏不滚动 / 品牌 + 当前任务 + CTA）
├── map.html                完整路径地图（71 格四阶段蛇形 / Day1 在底）
├── day.html                卡片流（?day=0|1|...|71）
├── reading.html            核心阅读独立页
├── report.html             AI 报告（流式 typewriter 显示）
├── assets/
│   ├── styles.css          奶油暖系视觉系统
│   ├── home.js             首页逻辑
│   ├── pathmap.js          蛇形路径地图渲染
│   ├── app.js              卡片流引擎（6 种题型 + bottom sheet 反馈）
│   ├── report.js           AI 报告 + 流式渲染
│   └── days/
│       ├── day1.json ~ day6.json     6 天结构化卡片数据
├── readings/
│   ├── day1.md ~ day6.md             6 天核心阅读 markdown
├── api-proxy/
│   ├── server.js           Express + DeepSeek 转发 + 静态托管
│   ├── package.json
│   ├── .env                DEEPSEEK_API_KEY（git ignored）
│   └── .env.example
├── content/                **产品内容源头**（从 Obsidian vault 同步）
│   ├── _INDEX.md
│   ├── 幸福计划-71天产品大纲.md
│   └── 阶段1-觉察篇/
│       └── Day01 ~ Day06 共 12 份 markdown
├── BACKLOG.md              远期需求池（P0: AI 实时驱动整个体验）
├── CLAUDE.md               给 AI agent 用的工作约定
└── README.md
```

## 设计原则

- **温暖但不甜腻 / 安静但不亢奋**：奶油暖系配色 + 思源宋体 + 16px 圆角 + 慢动效
- **反对攀比**：不做排行榜，只跟过去的自己比
- **AI 教练而非鸡汤**：每条反馈都基于用户真实回答，绝不下诊断
- **手机原生体感**：首页一屏不滚动，按钮直跳当前任务，按钮主色暖橘 #E89B6A
- **写作硬规则**：禁用「不是……而是……」/ 不用破折号（写入了 AI prompt）

## 5 种题型

| type | 说明 | 关键字段 |
|------|------|----------|
| `content` / `summary` | 内容卡 / 总结卡 | `body`, `buttonText` |
| `reading` | 核心阅读卡（加载独立 markdown） | `source`, `subtitle` |
| `single_choice` / `scale` / `true_false` | 单选 / 自评 / 判断 | `options[]`, `correctAnswer` |
| `multiple_choice` | 多选 | `correctAnswers[]`, `allCorrectFeedback` |
| `fill_blank` | 填空（v1 已移除，保留题型字段供未来扩展） | `correctAnswer`, `acceptAnswers[]` |
| `text` | 开放回答（无对错，AI 报告原料） | `placeholder`, `required` |

`category: "awareness"` 表示自我觉察题（无对错，AI 报告原料）
`category: "knowledge"` 表示知识检测题（有对错，影响 AI 报告的"温柔提醒"板块）

## AI 报告

走完 Day 末页后跳到 `report.html?day=N`：

1. `report.js` 从 localStorage 收集 7 道觉察题回答 + 13 道知识题对错
2. POST 到 `localhost:3001/api/report`
3. `api-proxy/server.js` 拼好 prompt（四板块 + 语气准则）调 DeepSeek，stream 返回
4. 前端 typewriter 实时渲染，缓存到 localStorage

固定四个板块：
- **【今天的你】** 被看见
- **【一个小发现】** 提炼跨题规律
- **【温柔提醒一句】** 指点知识题错误
- **【明天带着走】** 具体微行动

## 数据持久化

| localStorage key | 内容 |
|-----|------|
| `xingfu-day-N-state` | 第 N 天的进度（当前页、用户答案、知识题对错） |
| `xingfu-day-N-report` | 第 N 天的 AI 报告缓存 |
| `xingfu-completed-days` | 已完成的天数数组 |

清空所有进度（也可以点首页左上 ⚙ 设置图标）：

```js
Object.keys(localStorage).filter(k => k.startsWith("xingfu-")).forEach(k => localStorage.removeItem(k));
```

## 待办

详见 [BACKLOG.md](./BACKLOG.md)。优先级最高的是 P0「**AI 实时驱动整个体验**」：让 27 张卡的反馈和题目走向都由 LLM 基于用户上下文实时生成。

短期：
- [ ] Day 7–13 内容（觉察篇剩余）
- [ ] Day 14–71 内容（探索篇、练习篇、内化篇）
- [ ] PWA 化（manifest + service worker）
- [ ] 报告分享：长图导出
- [ ] 设置页

## 设计参考

- 路径地图节奏 / 解锁机制：Duolingo
- 视觉调性 / 留白：Headspace、Calm
- 卡片流分页交互：参考独立计划（同类产品 v2 题库）

## License

待定（暂未明确）

---

🤖 部分代码 / 内容由 Claude（Anthropic）协助产出
