# OpenClaw Sidekick 🦞

> 在浏览器侧边栏中使用 OpenClaw AI 助手，选中文字快速发送，不离开当前页面。

[![CI](https://github.com/openclaw/openclaw-sidekick/actions/workflows/ci.yml/badge.svg)](https://github.com/openclaw/openclaw-sidekick/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.2.0-blue)](https://github.com/openclaw/openclaw-sidekick/releases)

## ✨ 特性

- �️ **侧边栏对话** - 在浏览器侧边栏直接与 OpenClaw AI 对话
- 📝 **快速发送** - 选中文字，右键或快捷键快速发送到 AI
- 🖼️ **图片支持** - 选中图片可直接发送给 AI 分析
- 🎨 **主题定制** - 5 种内置主题可选
- ⌨️ **快捷指令** - `/` 命令快速触发预设功能
- 📦 **插件系统** - 支持自定义插件扩展
- 🔧 **调试工具** - 内置日志查看器、网络调试、错误诊断

## 🚀 快速开始

### 安装

1. 克隆项目到本地：
```bash
git clone https://github.com/openclaw/openclaw-sidekick.git
cd openclaw-sidekick
```

2. 安装依赖：
```bash
npm install
```

3. 构建扩展：
```bash
npm run build
```

4. 加载到 Chrome/Edge：
   - 打开 `chrome://extensions/`
   - 开启「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择 `dist` 目录

### 使用

1. 点击浏览器工具栏的 🦞 图标打开侧边栏
2. 或使用快捷键 `Ctrl+Shift+O` (Mac: `Cmd+Shift+O`)
3. 在设置中配置 OpenClaw 服务器地址

#### 快速发送文本

- 选中网页上的文字
- 右键 → 「发送到 OpenClaw」
- 或使用快捷键 `Ctrl+Shift+S`

#### 快速发送图片

- 右键点击图片
- 选择「发送图片到 OpenClaw」

## 📖 命令列表

| 命令 | 说明 |
|------|------|
| `/help` | 显示帮助信息 |
| `/clear` | 清除对话历史 |
| `/theme` | 切换主题 |
| `/preset [名称]` | 使用预设提示词 |
| `/export` | 导出对话记录 |
| `/diagnose` | 运行诊断工具 |

## 🎨 主题

内置 5 种主题：
- 🌙 Dark (深色)
- ☀️ Light (浅色)
- 🌿 Green (护眼绿)
- 🌊 Ocean (海洋蓝)
- 💜 Purple (浪漫紫)

## 📁 项目结构

```
openclaw-sidekick/
├── src/
│   ├── background.js      # Service Worker
│   ├── sidepanel.js       # 侧边栏主逻辑
│   ├── sidepanel.html     # 侧边栏 HTML
│   ├── sidepanel.css      # 侧边栏样式
│   ├── components/        # UI 组件
│   │   ├── codeBlock.js
│   │   ├── commandPalette.js
│   │   ├── diagnose.js
│   │   ├── logViewer.js
│   │   ├── networkDebugger.js
│   │   ├── onboarding.js
│   │   ├── setupWizard.js
│   │   └── statusBar.js
│   └── features/          # 功能模块
│       ├── history.js
│       ├── pluginManager.js
│       ├── presets.js
│       └── themeManager.js
├── tests/                 # 测试文件
├── .github/workflows/     # CI 配置
├── manifest.json          # 扩展清单
└── package.json           # 项目配置
```

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 运行 lint
npm run lint

# 格式化代码
npm run format

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 🤝 贡献

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 📄 许可证

MIT License - 见 [LICENSE](LICENSE) 文件

## 📝 更新日志

见 [CHANGELOG.md](CHANGELOG.md)