# 工作区仓库索引

> 最后更新：2026-05-01

---

## 活跃项目

### ai-native-pipeline

**路径**: `ai-native-pipeline/`
**远程**: https://github.com/afine907/ai-native-pipeline
**当前分支**: feature/design-principles
**描述**: 从需求到代码，全自动 AI 开发流水线

**主要功能**:
- 5 节点 Pipeline：impact-analyzer → prd-agent → spec-agent → coding-agent → verification-agent
- Planning Gate 关键节点确认
- Task Spec 单一事实源
- 自动验证与评估

**技术栈**: Python, LangGraph, Claude Code Plugin

---

### jojo-code

**路径**: `jojo-code/`
**远程**: https://github.com/afine907/jojo-code
**当前分支**: feat/radon-and-gitpython
**描述**: AI 编码助手，20+ 工具集

**主要功能**:
- 文件读写、代码搜索
- Shell 执行、Git 操作
- Web 搜索、多模型支持

**技术栈**: TypeScript (CLI), Python (Core), LangGraph

---

### afine907.github.io / afine907-blog

**路径**: `afine907-blog/`
**远程**: https://github.com/afine907/afine907.github.io
**当前分支**: feature/ai-native-pipeline-principles
**描述**: jojo 的技术空间 — AI Agent 架构设计与 LangGraph 工程实践

**主要内容**:
- Agent 架构设计文章
- AI Native Pipeline 文档
- LangGraph 实践指南

**技术栈**: Docusaurus, React, TypeScript

---

### react-tracescope

**路径**: `react-tracescope/`
**远程**: https://github.com/afine907/react-tracescope
**当前分支**: main
**描述**: Agent 执行轨迹可视化组件，支持 SSE 流式渲染

**主要功能**:
- 高性能轨迹渲染
- SSE 流式更新
- 可视化标准组件

**技术栈**: React, TypeScript, SSE

---

## 其他项目

### skills

**路径**: `skills/`
**远程**: https://github.com/afine907/skills
**当前分支**: master
**描述**: OpenClaw Skills 集合

---

### study_ast

**路径**: `study_ast/`
**远程**: https://github.com/afine907/study_ast
**当前分支**: master
**描述**: AST 学习项目

---

### job-spider

**路径**: `job-spider/`
**远程**: https://github.com/afine907/job-spider
**当前分支**: master
**描述**: 职位爬虫

---

### behavior-sense

**路径**: `behavior-sense/`
**远程**: https://github.com/afine907/behavior-sense
**当前分支**: master
**描述**: 行为感知

---

## 配置仓库

### openclaw-sidekick (workspace 根目录)

**路径**: `.`
**远程**: https://github.com/afine907/openclaw-sidekick
**当前分支**: master
**描述**: OpenClaw workspace 配置

**主要文件**:
- `IDENTITY.md` - Agent 身份定义
- `USER.md` - 用户信息
- `MEMORY.md` - 长期记忆
- `TOOLS.md` - 工具配置

---

## 快速导航

| 项目 | 路径 | 用途 |
|------|------|------|
| AI Native Pipeline | `ai-native-pipeline/` | Agent 开发流水线 |
| jojo-code | `jojo-code/` | AI 编码助手 |
| 博客 | `afine907-blog/` | 技术文章 |
| TraceScope | `react-tracescope/` | Agent 轨迹可视化 |
| Skills | `skills/` | OpenClaw Skills |

---

## 常用命令

```bash
# 查看所有仓库状态
for d in */; do echo "=== $d ===" && cd "$d" && git status -s && cd ..; done

# 更新所有仓库
for d in */; do cd "$d" && git pull origin $(git branch --show-current) && cd ..; done

# 查看当前分支
for d in */; do echo "$d: $(cd $d && git branch --show-current)"; done
```

---

## 备注

- `afine907.github.io` 和 `afine907-blog` 是同一个仓库的两个 clone
- 工作区根目录 (`.`) 是 `openclaw-sidekick` 配置仓库
- 部分仓库的远程地址包含 token，已在此索引中移除
