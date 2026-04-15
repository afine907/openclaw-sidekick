# OpenClaw Sidekick

在浏览器侧边栏使用 OpenClaw AI 助手，选中文字右键即可发送，无需切换页签。

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-0.2.0-blue.svg)](package.json)

## 功能

- ✅ 侧边栏持久显示 OpenClaw
- ✅ 选中文字右键发送
- ✅ 快捷键 `Ctrl+Shift+S` 快速发送选中内容
- ✅ 快捷键 `Ctrl+Shift+O` 打开侧边栏
- ✅ 图片粘贴支持（Ctrl+V）
- ✅ 对接 OpenClaw 代理 API
- ✅ Markdown 渲染支持
- ✅ 深色主题界面
- ✅ API Key 配置支持
- ✅ XSS 安全防护
- ✅ 请求超时保护
- ✅ 消息历史自动清理

## 安装

### 1. 确保 OpenClaw 代理服务运行

```bash
# 检查服务状态
sudo systemctl status openclaw-claude-code-proxy

# 如果未运行，启动服务
sudo systemctl start openclaw-claude-code-proxy
```

代理默认运行在 `http://localhost:4000`

### 2. 加载浏览器插件

1. 打开 Chrome/Edge，进入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `openclaw-browser-extension` 文件夹

### 3. 使用前配置（可选）

如果代理地址不是 `http://localhost:4000`：

1. 点击侧边栏右上角 ⚙️ 设置按钮
2. 输入你的 OpenClaw 代理地址
3. 保存设置

## 使用方法

### 发送选中文字

**方法一：右键菜单**
1. 在任意网页选中文字
2. 右键 → 「🦞 发送到 OpenClaw」
3. 侧边栏自动打开，文字已发送

**方法二：快捷键**
1. 选中文字
2. 按 `Ctrl+Shift+S`
3. 侧边栏自动打开，文字已发送

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+O` | 打开/关闭侧边栏 |
| `Ctrl+Shift+S` | 发送选中文字 |

### 粘贴图片

1. 复制任意图片到剪贴板
2. 在侧边栏按 `Ctrl+V` 粘贴
3. 图片将发送给 AI 分析

## 项目结构

```
openclaw-sidekick/
├── manifest.json        # 扩展配置 (Manifest V3)
├── src/
│   ├── sidepanel.html   # 侧边栏界面
│   ├── sidepanel.css    # 样式（深色主题）
│   ├── sidepanel.js     # 侧边栏逻辑
│   └── background.js    # Service Worker
├── assets/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 技术栈

- **Manifest V3** - Chrome 扩展最新标准
- **Side Panel API** - 侧边栏持久显示
- **Context Menus API** - 右键菜单
- **Scripting API** - 获取选中文字
- **Storage API** - 保存设置

## 开发

修改代码后，在 `chrome://extensions/` 页面点击刷新按钮即可更新。

## 故障排除

### 侧边栏无法连接

1. 检查代理服务是否运行：
   ```bash
   curl http://localhost:4000/v1/models
   ```

2. 检查浏览器控制台是否有错误

### 右键菜单不显示

1. 确保已正确加载插件
2. 刷新网页后重试

---

🦞 Made with OpenClaw
