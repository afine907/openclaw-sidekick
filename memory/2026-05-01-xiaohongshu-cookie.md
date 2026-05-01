# Session: 2026-05-01 01:13:55 UTC

- **Session Key**: agent:main:openclaw-weixin:direct:o9cq80--urowuyfdqzlbwfgawuvc@im.wechat
- **Session ID**: b1955178-2a2a-4533-bc03-7a2a6339f48b
- **Source**: openclaw-weixin

## Conversation Summary

user: Conversation info (untrusted metadata):
```json
{
  "message_id": "openclaw-weixin:1777596512241-582fa75e",
  "timestamp": "Fri 2026-05-01 08:48 GMT+8"
}
```

你现在在云上服务器
assistant: 对，这是个问题。

**云服务器上没有图形界面，没有本地浏览器可以复用。**

---

**适配云服务器的方案：**

**方案 A：Cookie 注入（最简单）**
1. 你在本地电脑登录小红书网页版
2. 导出 Cookie（用 EditThisCookie 插件或开发者工具）
3. 把 Cookie 发给我
4. 我在服务器上用 Playwright 注入 Cookie 访问

**方案 B：Playwright 持久化上下文**
1. 我在服务器上启动 Playwright
2. 它会弹出一个远程调试 URL 或二维码
3. 你用本地浏览器打开，扫码登录
4. Playwright 把登录态保存到 `state.json`
5. 之后我就能一直用这个登录态了

**方案 C：App 抓包（折腾）**
- 从手机小红书 App 抓登录态
- 复杂，不推荐

---

**最实用的是方案 A**：
你在本地电脑导个 Cookie 给我就行。Cookie 有效期一般几周到一个月，过期了再导一次。

你本地能访问小红书网页版吗？如果可以，我教你怎么导 Cookie。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "openclaw-weixin:1777597058107-a0f27f8b",
  "timestamp": "Fri 2026-05-01 08:57 GMT+8"
}
```

cookie多久过期
assistant: 根据搜索结果，小红书 Cookie 过期时间**没有固定值**，但实践经验：

---

**实际情况：**

| 场景 | 过期时间 |
|------|---------|
| 正常使用（经常活跃） | 几周到一个月 |
| 长期不用 | 几天就可能过期 |
| 频繁爬虫/异常行为 | 可能被加速失效 |

**关键因素：**
- 小红书会根据账号活跃度动态调整
- 主要 Cookie 字段 `web_session` 一般 **7-30 天**
- 如果账号持续活跃，登录态会自动续期

---

**实用建议：**

1. **导一次 Cookie，用 2-3 周问题不大**
2. 失效了我能检测到，再让你导一次
3. 如果你经常在小红书网页端活跃，Cookie 会更持久

---

**要不要试试？**

你本地 Chrome 打开小红书网页版，登录后我教你怎么导 Cookie。整个过程 2 分钟搞定。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "openclaw-weixin:1777597127736-97386cb9",
  "timestamp": "Fri 2026-05-01 08:58 GMT+8"
}
```

playwright mcp消耗太多token，浏览器的操作都使用Agent Browser Skill
assistant: 明白了，用 agent-browser 更省 token。

---

**方案调整：用 agent-browser + Cookie 注入**

```bash
# 1. 加载 Cookie 访问小红书
agent-browser open https://www.xiaohongshu.com
agent-browser state load xiaohongshu-auth.json

# 2. 之后正常操作
agent-browser snapshot -i --json
agent-browser click @e2
...
```

---

**你需要做的：**

在本地 Chrome 登录小红书后，导出 Cookie 或浏览器状态文件给我。

**两种方式：**

**方式 A：直接导 Cookie JSON**
```bash
# 用 EditThisCookie 插件导出，格式如：
[
  {"name": "web_session", "value": "xxx", "domain": ".xiaohongshu.com"},
  ...
]
```

**方式 B：用 agent-browser 本地保存状态**
```bash
# 你本地运行
agent-browser open https://www.xiaohongshu.com
# 手动登录
agent-browser state save xiaohongshu-auth.json
```
然后把 `xiaohongshu-auth.json` 文件内容发给我。

---

你方便用哪种方式？我可以一步步指导。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "openclaw-weixin:1777597191898-21e1e0f8",
  "timestamp": "Fri 2026-05-01 08:59 GMT+8"
}
```

我把我cookie发你
assistant: 好，你发过来后我存到服务器上，之后就能用了。

**怎么获取 Cookie：**

1. Chrome 打开小红书网页版，确保已登录
2. 按 `F12` 打开开发者工具
3. 切到 `Application` 标签（或 `存储`）
4. 左侧点 `Cookies` → `https://www.xiaohongshu.com`
5. 关键字段是 `web_session`，把它复制给我

或者直接把整个 Cookie 字符串（`F12` → `Network` → 随便点个请求 → `Headers` 里的 `Cookie` 字段）全复制也行。

发过来吧。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "openclaw-weixin:1777597623988-6c2b0306",
  "timestamp": "Fri 2026-05-01 09:07 GMT+8"
}
```

0400698f6f54ae5603a390b3c63b4befb4a129
assistant: 收到，存好了。让我试试能不能用：
assistant: **问题来了：小红书检测到云服务器 IP 有风险**

```
error_code=300012
error_msg=IP at risk. Switch to a secure network and retry.
```

---

**原因：**
云服务器的 IP 被小红书风控了，直接拒绝访问。Cookie 对了也没用，IP 先被拦了。

---

**解决方案：**

1. **代理** - 需要一个住宅 IP 代理，绕过数据中心 IP 检测
2. **你本地跑 agent-browser** - 让你本地电脑跑浏览器，把结果发给我
3. **放弃小红书自动化** - 这是最省事的选项

---

你有代理吗？如果有，我可以配置 agent-browser 走代理访问。
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "openclaw-weixin:1777597749924-ed9379ad",
  "timestamp": "Fri 2026-05-01 09:09 GMT+8"
}
```

业界还有方案吗
assistant: 业界的几种方案：

---

## 方案对比

| 方案 | 难度 | 成本 | 稳定性 |
|------|------|------|--------|
| **住宅代理 IP** | ⭐⭐ | 中等（按量付费） | 高 |
| **动态 IP 池** | ⭐⭐⭐ | 高 | 最高 |
| **App 协议逆向** | ⭐⭐⭐⭐ | 低（但维护成本高） | 中 |
| **本地浏览器** | ⭐ | 免费 | 最高 |

---

## 方案一：住宅代理 IP（推荐）

**原理：** 用住宅宽带 IP 替代云服务器 IP，小红书认为是普通家庭用户

**服务商：**
- 快代理、芝麻代理、青果云
- 国外：Bright Data、Oxylabs、IPRoyal

**价格：** 大概 ¥1-5/GB 流量，或者按 IP 数量计费

**agent-browser 配置代理：**
```bash
export HTTPS_PROXY=http://user:pass@proxy-server:port
agent-browser open https://www.xiaohongshu.com
```

---

## 方案二：App 协议逆向

不走网页端，直接逆向小红书 App 的 API 协议：

- MediaCrawler 项目就是这个思路
- 需要 Python 环境，处理加密参数（shield、sign 等）
- 缺点：小红书经常更新协议，需要持续维护

---

## 方案三：你本地跑 agent-browser

**最省钱、最稳定：**

1. 你本地电脑装 agent-browser
2. 本地跑浏览器访问小红书
3. 把采集结果发给我（或者我给你写脚本自动化）

```bash
# 你本地执行
npm install -g agent-browser
agent-browser install
agent-browser open https://www.xiaohongshu.com
# 手动登录一次
agent-browser state save xiaohongshu-auth.json
```

之后我可以给你写个脚本，你本地定时跑，结果同步到服务器。

---

## 我的建议

| 你的需求 | 推荐方案 |
|---------|---------|
| 偶尔看看内容 | 方案三：本地跑 |
| 频繁自动化采集 | 方案一：买住宅代理 |
| 深度数据挖掘 | 方案二：App 协议 |

你有代理吗？或者你想走哪个方案？
user: Conversation info (untrusted metadata):
```json
{
  "message_id": "openclaw-weixin:1777597968548-a1d00bd2",
  "timestamp": "Fri 2026-05-01 09:12 GMT+8"
}
```

跑了，得到的json里，cookie是空数组
assistant: 可能小红书用的是 localStorage 或其他方式存登录态。

**排查一下：**

你本地执行这些命令，把结果发给我：

```bash
# 查看 cookies
agent-browser cookies

# 查看 localStorage
agent-browser storage local

# 查看 sessionStorage
agent-browser storage session
```

或者更直接的方式：

**用浏览器开发者工具导出：**

1. Chrome 打开小红书，确保已登录
2. `F12` → `Application` → `Storage` → `Cookies`
3. 看看有没有 `web_session` 或其他关键 Cookie

如果 Cookies 确实是空的，看 `Local Storage` 里有没有登录信息。

把你看到的内容截图或复制给我。
