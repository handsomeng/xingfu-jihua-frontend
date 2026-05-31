// 幸福计划 · 本地 API 代理
// 转发 DeepSeek 调用，避免 API key 暴露在前端

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import { DEEPSEEK_ENDPOINT, buildSystemPrompt, buildUserPrompt } from "../api/_shared.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATIC_ROOT = path.join(__dirname, "..");

const app = express();
const PORT = process.env.PORT || 3001;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

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
  const { day, theme, coreLine, stageName, userInputs, knowledgeResults, history } = req.body;

  if (day == null || !theme) {
    return res.status(400).json({ error: "缺少 day 或 theme" });
  }

  const systemPrompt = buildSystemPrompt(day, theme, coreLine, stageName);
  const userPrompt = buildUserPrompt(userInputs, knowledgeResults, history);

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
