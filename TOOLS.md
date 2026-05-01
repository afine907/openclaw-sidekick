# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## Coding Agent 默认设置

- **Agent**: Claude Code
- **权限**: --permission-mode bypassPermissions (默认允许所有权限)
- **用法**: 使用 sessions_spawn 发起 Claude Code 任务时，加上这些参数

## OpenCode (免费 Coding Agent)

- **版本**: 1.14.17
- **安装**: `curl -fsSL https://opencode.ai/install | bash`
- **用法**: `cd <项目> && opencode`
- **免费模型**:
  - `opencode/big-pickle`
  - `opencode/gpt-5-nano`
  - `opencode/minimax-m2.5-free`
  - `opencode/nemotron-3-super-free`
- **指定模型**: `opencode -m opencode/gpt-5-nano`
- **单次运行**: `opencode run "帮我写个函数"`

**省 token 策略**: 代码任务优先用 OpenCode 的免费模型，节省当前会话 token

## 联网搜索

- 只要联网搜索，优先使用 searxng skill

## OCR 图片识别

- **Skill**: `~/.openclaw/workspace/skills/ocr/SKILL.md`
- **工具**: Tesseract 4.1.1 + 中文 (chi_sim) + 英文 (eng)
- **用法**: `tesseract <图片路径> stdout -l chi_sim+eng`
- **场景**: 模型不支持图片时，用 OCR 提取文字

## 代码提交原则

**提交 PR 之前必须先检查项目的 CI 配置，执行相应的检查命令。**

步骤：
1. 读取 `.github/workflows/ci.yml` 或类似的 CI 配置文件
2. 找出 CI 中定义的检查步骤（lint、format、test、type check 等)
3. 本地执行这些检查，全部通过后再提交

**经验教训**: 之前只运行了部分检查，漏掉了 `ruff format --check`，导致 CI 失败。必须完整模拟 CI 流程！

## GitHub Token
- Token: 环境变量 `GH_TOKEN` 或 `GITHUB_TOKEN`
- 用途: 推送代码到 GitHub 仓库

## Proactive Tool Use

- Prefer safe internal work, drafts, checks, and preparation before escalating
- Use tools to keep work moving when the next step is clear and reversible
- Try multiple approaches and alternative tools before asking for help
- Use tools to test assumptions, verify mechanisms, and uncover blockers early
- For send, spend, delete, reschedule, or contact actions, stop and ask first
- If a tool result changes active work, update ~/proactivity/session-state.md