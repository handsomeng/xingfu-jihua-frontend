// 幸福计划 · 部署健康检查
export const config = { runtime: "edge" };

export default async function handler() {
  return new Response(
    JSON.stringify({
      ok: true,
      ts: Date.now(),
      hasKey: !!process.env.DEEPSEEK_API_KEY
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
