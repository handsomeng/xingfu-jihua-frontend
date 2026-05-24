# 幸福计划 · 部署 SOP

> 目标：把项目部署到 Vercel，绑定 `xingfu.handsomeng.com`，API key 不暴露。
> 预计耗时：首次 15-20 分钟，之后每次更新 1 分钟（git push 自动部署）。

---

## 架构说明

```
浏览器
  ↓ 访问 xingfu.handsomeng.com
Cloudflare DNS (CNAME → cname.vercel-dns.com)
  ↓
Vercel
  ├─ 静态文件：index.html / onboarding.html / catalog.html / report.html ...
  ├─ Edge Function：/api/report（流式调 DeepSeek）
  └─ Edge Function：/api/health（健康检查）
  ↓ 转发请求（带 Authorization header）
DeepSeek API
```

- **API key 只存在 Vercel 环境变量**，前端永远拿不到，源码也看不到
- 本地开发仍然跑 `api-proxy/server.js`（用 `.env`），跟生产隔离
- `api/_shared.js` 是两边共享的 prompt 逻辑，单一数据源

---

## 一次性准备（只做一次）

### 1. 装 Vercel CLI

```bash
npm i -g vercel
vercel --version   # 应该看到版本号（>= 32）
```

### 2. 登录 Vercel

```bash
vercel login
# 用 GitHub 账号登录，浏览器会跳 OAuth 授权页
```

---

## 首次部署

### Step 1. 链接 GitHub repo 到 Vercel 项目

```bash
cd ~/vibecoding/xingfu-jihua-frontend
vercel link
```

提示选择：

- Set up and deploy？**Y**
- Which scope？选你自己的 personal account
- Link to existing project？**N**（首次）
- Project name？默认 `xingfu-jihua-frontend` 即可
- Directory？默认 `./`（就是当前目录）
- Override settings？**N**

完成后会出现 `.vercel/` 目录（已加进 `.gitignore` 不会被 push）。

### Step 2. 配置环境变量（DeepSeek API key）

```bash
vercel env add DEEPSEEK_API_KEY
```

提示后输入：

- Value：粘贴你的 `sk-...` 真实 key（输入时不显示，正常的）
- Apply to？**全选** Production / Preview / Development（用空格选）

可选：再加一遍方便本地 `vercel dev` 拉环境变量

### Step 3. 触发部署

```bash
vercel deploy --prod
```

几分钟后输出一个 URL，类似：

```
https://xingfu-jihua-frontend-xxxxxx.vercel.app
```

打开它测试。

### Step 4. 验证部署

```bash
# 健康检查（应该返回 hasKey: true）
curl https://xingfu-jihua-frontend-xxxxxx.vercel.app/api/health

# 浏览器打开做完整流程：
# - 看到 onboarding 3 屏
# - 输兑换码 GUOHANSEN
# - 进 Day 0 走完 11 页
# - 末页跳报告看流式 AI 生成
```

---

## 绑定 xingfu.handsomeng.com

### Vercel 那一边

1. 浏览器进 `https://vercel.com/dashboard`
2. 选 `xingfu-jihua-frontend` 项目
3. Settings → Domains → Add Domain
4. 输入 `xingfu.handsomeng.com` → Add
5. Vercel 会显示一段 DNS 配置提示（一般是 CNAME 指向 `cname.vercel-dns.com`），先记下来

### Cloudflare 那一边

1. 进 `dash.cloudflare.com`
2. 选 `handsomeng.com` 域名 → 左侧菜单 DNS → Records
3. **Add record**：
   - Type：`CNAME`
   - Name：`xingfu`（只填子域名前缀）
   - Target：`cname.vercel-dns.com`
   - Proxy status：**DNS only**（**关掉橙色云朵**，否则 SSL 会冲突）
   - TTL：`Auto`
4. 保存

等 1-5 分钟 DNS 生效。可以用 `dig xingfu.handsomeng.com` 验证。

### 回 Vercel 确认

回到 Vercel Domains 页面，刷新。Vercel 会自动检测到 DNS 已生效，显示绿色 ✓。HTTPS 证书（Let's Encrypt）会在 1 分钟内自动签发。

**完成。** 打开 `https://xingfu.handsomeng.com` 看效果。

---

## 之后每次更新

最简单：

```bash
git add .
git commit -m "更新内容"
git push
```

GitHub 收到 push 后，Vercel 自动触发部署（约 30-60 秒）。

如果只想本地预览不发布：

```bash
vercel       # 部署到 preview URL（带 hash）
```

如果想强制重新部署生产：

```bash
vercel deploy --prod --force
```

---

## 安全检查清单

部署前过一遍：

- [ ] `.env` 在 `.gitignore` 里（已 ✓）
- [ ] `api-proxy/.env` 没有被 git track（确认：`git ls-files | grep .env` 应该空）
- [ ] 项目根没有任何 `*.key` `*.pem` 文件
- [ ] `vercel env add` 加完 key 后，本地 `~/.vercel` 里没存明文 key
- [ ] Vercel 环境变量页能看到 `DEEPSEEK_API_KEY`，但 value 显示为 `***`

**永远不要**：
- 在 `index.html` / `assets/*.js` / 任何前端文件里写 API key
- 把 `.env` 文件 push 到 GitHub
- 把 Vercel CLI token（`~/.vercel/auth.json`）粘贴到任何地方

---

## 常见问题

### 部署后访问报错「Server misconfigured: missing DEEPSEEK_API_KEY」

环境变量没生效。重新加一遍：

```bash
vercel env add DEEPSEEK_API_KEY
vercel deploy --prod --force
```

### 流式输出卡住

Vercel Edge Function timeout 默认 30s。DeepSeek 一般 5-15s 完成，正常不会卡。如果持续卡住，进 Vercel Dashboard → Functions 看日志。

### CNAME 配了但访问域名仍 404

- Cloudflare 那边「Proxy status」是否关了橙色云朵？（必须 DNS only）
- 等 5-10 分钟 DNS 全球生效
- `dig xingfu.handsomeng.com CNAME +short` 看返回值是不是 `cname.vercel-dns.com`

### 本地开发跟生产联调

本地：`cd api-proxy && npm start`，访问 `http://localhost:3001`
生产：访问 `https://xingfu.handsomeng.com`

两边的 prompt 逻辑都来自 `api/_shared.js`，改一处两边同步。
