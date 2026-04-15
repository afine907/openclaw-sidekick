# 贡献指南

感谢你对 OpenClaw Sidekick 的兴趣！欢迎贡献代码。

## 🤝 如何贡献

### 报告 Bug

1. 在 [Issues](https://github.com/openclaw/openclaw-sidekick/issues) 中搜索是否已有类似问题
2. 创建新 Issue，包含：
   - 清晰的问题描述
   - 复现步骤
   - 浏览器版本和操作系统
   - 如有截图也请附上

### 提出新功能

1. 先在 Issues 中搜索是否已有建议
2. 创建新 Issue，描述：
   - 功能需求背景
   - 期望的行为
   - 可能的实现方案

### 提交代码 (Pull Request)

1. Fork 本仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 进行修改并提交
4. 推送分支：`git push origin feature/your-feature`
5. 创建 Pull Request

## 📐 代码规范

### 命名规范

- **文件命名**: 使用小写字母 + 连字符，如 `sidepanel.js`
- **类名**: 使用 PascalCase，如 `OpenClawSidepanel`
- **函数/方法**: 使用 camelCase，如 `init()`
- **常量**: 使用 UPPER_SNAKE_CASE

### 注释规范

- 每个文件顶部添加文件说明注释
- 每个导出的函数/类添加 JSDoc 注释
- 复杂逻辑添加行内注释说明

示例：
```javascript
/**
 * 初始化侧边栏
 * @param {Object} options - 配置选项
 * @returns {Promise<void>}
 */
async function initSidepanel(options) {
  // TODO: 实现逻辑
}
```

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

类型 (type):
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档修改
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(theme): 添加自定义主题支持

添加用户自定义 CSS 主题的功能

Closes #123
```

## 🧪 测试规范

- 新功能必须包含测试
- 测试文件放在 `tests/` 目录
- 运行测试：`npm test`

## 📋 审核标准

PR 会被审核以下几点：

- [ ] 代码风格符合规范
- [ ] 有必要的注释和文档
- [ ] 有对应的测试
- [ ] 所有测试通过
- [ ] lint 检查通过

## 💬 交流方式

- GitHub Issues: 问题反馈
- GitHub Discussions: 讨论区

---

感谢你的贡献！ 🎉