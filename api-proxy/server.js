// 幸福计划 · 本地 API 代理
// 转发 DeepSeek 调用，避免 API key 暴露在前端

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_ROOT = path.join(__dirname, "..");

const app = express();
const PORT = process.env.PORT || 3001;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";

if (!DEEPSEEK_API_KEY) {
  console.error("[启动失败] 缺少 DEEPSEEK_API_KEY。请在 api-proxy/.env 中配置。");
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// 静态文件服务：把项目根目录作为 web root
app.use(express.static(STATIC_ROOT, {
  index: "index.html",
  extensions: ["html"]
}));

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// 报告生成
app.post("/api/report", async (req, res) => {
  const { day, theme, coreLine, userInputs, knowledgeResults } = req.body;

  if (!day || !theme) {
    return res.status(400).json({ error: "缺少 day 或 theme" });
  }

  const systemPrompt = buildSystemPrompt(day, theme, coreLine);
  const userPrompt = buildUserPrompt(userInputs, knowledgeResults);

  try {
    const upstream = await fetch(DEEPSEEK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        stream: true,
        temperature: 0.75,
        max_tokens: 1200
      })
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("[DeepSeek 错误]", upstream.status, text);
      return res.status(upstream.status).json({ error: `DeepSeek API 返回 ${upstream.status}`, detail: text });
    }

    // SSE 透传
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // 按行解析 SSE
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              res.write(`data: ${JSON.stringify({ delta })}\n\n`);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    res.end();
  } catch (err) {
    console.error("[请求异常]", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.end();
    }
  }
});

function buildSystemPrompt(day, theme, coreLine) {
  return `你是「幸福计划」第 ${day} 天的 AI 教练。今天的主题是「${theme}」，核心句是「${coreLine}」。

请根据用户今天的练习数据，给他写一份 300–500 字的「今日报告」。报告必须按下面四个板块结构，每个板块用 markdown 加粗标题分隔，**严格遵守**：

**【今天的你】**
基于用户填写的开放回答和情绪状态，写一段「我看见你了」式的反馈。要复述用户的关键词，让他感到被听见。不评判、不诊断、不贴标签。

**【一个小发现】**
从用户多个回答之间，提炼一个他自己可能没意识到的规律或亮点。可以是一种「反差」「巧合」或「藏在细节里的信息」。

**【温柔提醒一句】**
如果用户在知识题上有错，挑最关键的 1 道用一句话点一下。如果全对，写一句「今天几个判断你都很准」之类的鼓励。**不要罗列所有错题，只点一个。**

**【明天带着走】**
给一个具体、微小、和今天主题相关的行动建议。要可以今晚或明天就做到的小动作，不要给「请反思人生」这种空话。

### 语气准则（严格遵守）
- 像一个懂点心理学、又真心关心朋友的人
- 多肯定，少评判；多具体，少正确的废话
- 绝不做诊断，绝不贴标签
- 涉及明显情绪困扰时，温和地建议对方寻找专业帮助
- **禁用「不是……而是……」这种句式**，可以用「比起 X，更像是 Y」「主要在于 X」这类替代
- **不用破折号（—— 或 —）**，可以用句号、逗号、冒号、括号或换行
- 全文用简体中文，口语化，避免拽词`;
}

function buildUserPrompt(userInputs = {}, knowledgeResults = {}) {
  const inputsLines = Object.entries(userInputs)
    .map(([pageId, val]) => {
      const v = Array.isArray(val) ? val.join("、") : val;
      return `- [${pageId}] ${v}`;
    })
    .join("\n");

  const knowledgeLines = Object.entries(knowledgeResults)
    .map(([pageId, ok]) => `- [${pageId}] ${ok ? "✓" : "✗"}`)
    .join("\n");

  const wrongOnly = Object.entries(knowledgeResults).filter(([, ok]) => !ok).map(([id]) => id);

  return `这是用户今天 7 道「自我觉察题」的真实回答（开放、无对错）：

${inputsLines || "（用户没填）"}

这是用户 13 道「知识检测题」的对错结果：

${knowledgeLines || "（无数据）"}

${wrongOnly.length === 0 ? "用户全对。" : `用户答错了：${wrongOnly.join("、")}`}

请按系统提示词里的四个板块写一份温暖、具体、有「被看见」感的今日报告。直接输出四个板块的内容，不要寒暄开场，不要在末尾问问题。`;
}

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✓ 幸福计划已启动`);
  console.log(`\n  本机访问：  http://localhost:${PORT}/`);
  const ips = getLocalIPs();
  if (ips.length) {
    console.log(`  手机访问（同 WiFi）：`);
    for (const ip of ips) {
      console.log(`              http://${ip}:${PORT}/`);
    }
  }
  console.log(`\n  在 iPhone Safari 里打开上面任一地址即可\n`);
});
