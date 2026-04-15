# 更新日志

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-15

### Added
- 插件系统 (pluginManager.js)
- 主题管理系统 (themeManager.js) - 5 种内置主题
- 预设提示词模板 (presets.js) - 10+ 模板
- 命令面板 (commandPalette.js) - `/` 命令支持
- 网络调试器 (networkDebugger.js)
- 日志查看器 (logViewer.js)
- 错误诊断工具 (diagnose.js)
- 完整的开源文档 (README, CONTRIBUTING, CHANGELOG, ARCHITECTURE)
- Vitest 测试框架配置

### Changed
- 优化代码块语法高亮
- 改进消息历史管理
- 重构主题系统为模块化结构

### Fixed
- 修复侧边栏打开延迟问题

---

## [0.1.0] - 2024-04-14

### Added
- 初始版本发布
- 侧边栏基本功能
- 选中文字快速发送
- 图片发送支持
- 新手引导
- 配置向导
- 快捷键支持 (Ctrl+Shift+O, Ctrl+Shift+S)
- 连接状态指示器
- 代码高亮 + 一键复制

---

## [Unreleased]

### Planned
- [ ] TypeScript 支持
- [ ] 单元测试覆盖
- [ ] 移动端适配
- [ ] 更多预设模板

---

## 升级指南

### 0.1.x → 0.2.x
1. 重新构建扩展：`npm run build`
2. 在 Chrome 扩展管理页面刷新
3. 如有问题，点击「重新加载」

---

*更新日志格式参考 [Keep a Changelog](https://keepachangelog.com)*