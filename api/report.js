// 幸福计划 · Vercel Edge Function：流式生成今日 AI 报告
// 部署到 Vercel 后会自动暴露在 /api/report 路径
// 本地开发跑 api-proxy/server.js 即可，不动这个文件

import { DEEPSEEK_ENDPOINT, buildSystemPrompt, buildUserPrompt } from "./_shared.js";

export const config = {
  runtime: "edge"
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured: missing DEEPSEEK_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { day, theme, coreLine, stageName, userInputs, knowledgeResults, history } = body || {};
  if (day == null || !theme) {
    return new Response(JSON.stringify({ error: "缺少 day 或 theme" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const systemPrompt = buildSystemPrompt(day, theme, coreLine, stageName);
  const userPrompt = buildUserPrompt(userInputs, knowledgeResults, history);

  const upstream = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
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

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(JSON.stringify({
      error: `DeepSeek API 返回 ${upstream.status}`,
      detail: text.slice(0, 400)
    }), {
      status: upstream.status || 502,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 把 DeepSeek 的 SSE 流转译成「{delta: '...'} + [DONE]」格式
  // 跟本地 api-proxy/server.js 的 SSE 协议保持一致，前端不用改
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
              }
            } catch {
              // 忽略单行解析错误
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
