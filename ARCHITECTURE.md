# OpenClaw Sidekick 架构设计

## 📁 项目结构

```
openclaw-sidekick/
├── src/
│   ├── background.js          # Chrome Extension Service Worker
│   ├── sidepanel.js           # 侧边栏主逻辑
│   ├── sidepanel.html         # 侧边栏 HTML
│   ├── sidepanel.css          # 侧边栏样式
│   ├── editor.js              # 代码编辑器组件
│   ├── network.js             # 网络请求模块
│   ├── storage.js             # 本地存储模块
│   ├── shortcuts.js           # 快捷键管理
│   ├── plugins.js             # 插件系统
│   ├── components/            # UI 组件
│   │   ├── codeBlock.js       # 代码块高亮 + 复制
│   │   ├── commandPalette.js  # 命令面板 (/命令)
│   │   ├── diagnose.js        # 错误诊断工具
│   │   ├── logViewer.js       # 日志查看器
│   │   ├── networkDebugger.js # 网络调试
│   │   ├── onboarding.js      # 新手引导
│   │   ├── setupWizard.js     # 配置向导
│   │   ├── statusBar.js       # 状态栏
│   │   └── styles.css         # 组件样式
│   ├── features/              # 功能模块
│   │   ├── history.js         # 历史消息管理
│   │   ├── pluginManager.js   # 插件管理器
│   │   ├── presets.js         # 预设提示词
│   │   └── themeManager.js    # 主题管理
│   └── themes/                # 主题系统（模块化）
│       ├── index.js           # 导出入口
│       ├── definitions.js     # 主题定义
│       ├── ThemeManager.js    # 主题管理器
│       ├── ThemeSwitcher.js   # 主题切换 UI
│       ├── AnimationManager.js# 动画效果
│       ├── NotificationSystem.js # 通知系统
│       └── KeyboardManager.js # 快捷键管理
├── tests/                     # 测试文件
├── .github/workflows/         # CI 配置
├── manifest.json              # 扩展清单 (MV3)
└── package.json               # 项目配置
```

---

## 🏗️ 核心架构

### 1. 扩展架构 (Manifest V3)

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Browser                        │
├─────────────────────────────────────────────────────────┤
│  Side Panel (sidepanel.html + sidepanel.js)            │
│  ├── 组件层 (components/)                               │
│  ├── 功能层 (features/)                                 │
│  └── 主题系统 (themes/)                                 │
├─────────────────────────────────────────────────────────┤
│  Background Service Worker (background.js)              │
│  ├── Context Menu (右键菜单)                            │
│  ├── Keyboard Shortcuts (快捷键)                        │
│  └── Message Handling (消息传递)                        │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   OpenClaw Server                        │
│              (默认 http://localhost:4000)               │
└─────────────────────────────────────────────────────────┘
```

### 2. 模块依赖关系

```
┌──────────────────────────────────────────────┐
│                 UI Components                 │
│  (commandPalette, statusBar, codeBlock...)   │
└────────────────────┬─────────────────────────┘
                     ↓
┌──────────────────────────────────────────────┐
│               Feature Modules                │
│  (history, presets, pluginManager...)        │
└────────────────────┬─────────────────────────┘
                     ↓
┌──────────────────────────────────────────────┐
│                Core Modules                  │
│  (network, storage, themes, shortcuts...)    │
└────────────────────┬─────────────────────────┘
                     ↓
┌──────────────────────────────────────────────┐
│           Chrome Extension APIs              │
│  (storage, runtime, tabs, scripting...)      │
└──────────────────────────────────────────────┘
```

---

## 🔧 核心模块说明

### Network Module (network.js)

负责与 OpenClaw 服务器通信：

- `sendMessage(text)` - 发送消息
- `setServerUrl(url)` - 设置服务器地址
- `setApiKey(key)` - 设置 API Key
- 自动重试机制
- 请求超时处理

### Storage Module (storage.js)

管理本地数据：

- 服务器配置存储
- API Key 安全存储
- 对话历史持久化
- 用户偏好设置

### Theme System (themes/)

模块化的主题系统：

- `definitions.js` - 内置 5 种主题定义
- `ThemeManager.js` - 主题切换和管理
- `ThemeSwitcher.js` - 主题选择 UI
- `AnimationManager.js` - 动画效果
- `NotificationSystem.js` - 通知提示

### Plugin System (plugins.js)

插件扩展机制：

- 插件加载/卸载
- 生命周期管理
- API 桥接

---

## 🔄 数据流

```
User Input → Sidepanel.js → Network.js → OpenClaw Server
                ↓                              ↓
           UI Update ← Response ←────────────┘
```

---

## 🎯 扩展能力

| 功能 | 实现方式 |
|------|----------|
| 右键菜单 | `chrome.contextMenus` |
| 快捷键 | `chrome.commands` |
| 侧边栏 | `chrome.sidePanel` |
| 消息通信 | `chrome.runtime.onMessage` |
| 本地存储 | `chrome.storage.local` |
| 代码注入 | `chrome.scripting.executeScript` |

---

## 🧪 测试策略

```
tests/
├── storage.test.js   # 存储模块测试
├── themes.test.js    # 主题系统测试
└── network.test.js   # 网络模块测试
```

使用 Vitest + jsdom 进行单元测试。

---

**最后更新**: 2026-04-15