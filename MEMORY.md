只要联网搜索，优先使用searxng skill

## 代码提交原则

**提交 PR 之前必须先检查项目的 CI 配置，执行相应的检查命令。**

步骤：
1. 读取 `.github/workflows/ci.yml` 或类似的 CI 配置文件
2. 找出 CI 中定义的检查步骤（lint、format、test、type check 等）
3. 本地执行这些检查，全部通过后再提交

**经验教训**: 之前只运行了部分检查，漏掉了 `ruff format --check`，导致 CI 失败。必须完整模拟 CI 流程！

## GitHub Token
- Token: ${GH_TOKEN}
- 用途: 推送代码到 GitHub 仓库
