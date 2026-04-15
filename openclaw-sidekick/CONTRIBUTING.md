# OpenClaw Sidekick - 开发指南

## 项目概述

OpenClaw Sidekick 是一个 Chrome 浏览器扩展，提供侧边栏 AI 助手功能。

## 技术架构

### 技术栈
- **Manifest V3** - Chrome 扩展最新标准
- **ES6+** - 现代 JavaScript
- **CSS3** - 深色主题样式

### 模块结构

```
src/
├── background.js    # Service Worker，处理右键菜单、快捷键
├── sidepanel.html   # 侧边栏界面结构
├── sidepanel.css    # 样式定义（深色主题）
└── sidepanel.js     # 侧边栏核心逻辑
```

## 开发指南

### 环境准备

1. 安装 Node.js 18+
2. 克隆项目

### 构建命令

```bash
# 运行测试
npm test

# 代码检查
npm run lint

# 代码格式化
npm run format
```

### 添加新功能

1. 在 `src/sidepanel.js` 中添加方法
2. 在对应的 HTML 中添加 UI 元素
3. 在 `tests/` 中添加测试用例
4. 更新 `CHANGELOG.md`

## API 参考

### OpenClawSidepanel 类

#### 构造函数
```javascript
new OpenClawSidepanel()
```

#### 方法

##### init()
初始化侧边栏。

##### loadSettings()
从 storage 加载设置。

##### sendMessage()
发送用户消息。

##### sendToOpenClaw(text, imageData?)
发送消息到 OpenClaw API。

##### saveSettings()
保存设置到 storage。

##### clearHistory()
清空对话历史。

## 安全指南

### XSS 防护
所有用户输入必须经过 HTML 转义：
```javascript
const escaped = text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
```

### API Key 管理
- API Key 存储在 `chrome.storage.local`
- 不应硬编码在任何文件中
- 定期轮换 API Key

### 输入验证
- URL 必须通过 `new URL()` 验证
- 消息长度限制 10000 字符
- 图片大小限制 5MB

## 测试指南

### 单元测试
```bash
node tests/run.js
```

### 集成测试
在浏览器控制台中运行 `tests/integration.test.js`

### E2E 测试
使用 Chrome 扩展开发者工具手动测试

## 发布流程

1. 更新版本号 `package.json`
2. 更新 `CHANGELOG.md`
3. 构建并测试
4. 打包扩展为 ZIP
5. 在 Chrome Web Store 发布

## 常见问题

### Q: 侧边栏无法连接
A: 检查代理服务是否运行 `curl http://localhost:4000/ping`

### Q: 快捷键不生效
A: 在 `chrome://extensions/shortcuts` 中检查快捷键配置

### Q: 图片上传失败
A: 检查图片大小是否超过 5MB

## 贡献指南

欢迎提交 PR！请确保：

1. 通过所有测试
2. 通过 ESLint 检查
3. 更新相关文档
4. 遵循代码风格

## 许可证

MIT License - see LICENSE file