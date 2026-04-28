只要联网搜索，优先使用searxng skill

## 代码开发偏好

**写代码任务优先使用 OpenCode CLI**：
- 版本: 1.14.17
- 安装路径: `/home/admin/.opencode/bin/opencode`
- 免费模型: `opencode/big-pickle`, `opencode/gpt-5-nano`
- 用法: `cd <项目> && opencode` 或 `opencode run "任务描述"`

**优势**：
- 免费，不消耗当前会话 token
- 支持 TTY 交互
- 可指定免费模型节省成本

## 工作流程规范

**所有代码改动必须走 feature 分支 + PR 流程**：
1. 创建 feature 分支
2. 开发 + 测试
3. 提交 PR
4. Code Review
5. 合并到 master

**汇报格式**：摘要 + PR 链接，不要废话

## API Keys
- **LongCat API Key**: `ak_2Cn4wg4B92dL4kz8Vu95T6Tw2S36T`
- **Base URL**: `https://api.longcat.chat/openai/v1`
- **Model**: `LongCat-Flash-Chat`

## GitHub 仓库
- **我们的仓库**: afine907/jojo-code (https://github.com/afine907/jojo-code)
- 项目已从 nano-code 改名为 jojo-code (2026-04-21)

## jojo-code 项目

### 架构（2026-04 实现）
TypeScript CLI (ink) + Python Core (LangGraph):

```
jojo-code/
├── packages/
│   └── cli/                    # TypeScript CLI (ink + React)
│       ├── src/
│       │   ├── index.tsx       # 入口
│       │   ├── app.tsx         # 主应用
│       │   ├── client/         # JSON-RPC 客户端
│       │   ├── components/     # UI 组件
│       │   └── hooks/          # React Hooks
│       ├── tests/              # 测试
│       └── package.json
│
└── src/jojo_code/
    ├── server/                 # JSON-RPC Server (stdio)
    ├── agent/                  # LangGraph Agent
    ├── tools/                  # 工具集
    └── core/                   # 核心配置
```

### 启动方式
```bash
# 安装依赖
pnpm install

# 开发模式 (TypeScript CLI)
cd packages/cli && pnpm dev

# Python CLI (Rich)
uv run jojo-code
```

### 已实现的功能

#### TypeScript CLI (ink)
- ✅ ChatView - 消息列表显示
- ✅ InputBox - 多行输入
- ✅ StatusBar - 状态栏
- ✅ useAgent Hook - Agent 状态管理
- ✅ JSON-RPC 客户端 - stdio 通信
- ✅ 7 个 TypeScript 测试通过

#### Python Server
- ✅ JSON-RPC Server - stdio 通信
- ✅ Agent handlers - chat/clear/get_model
- ✅ 流式响应支持

## Agent 并发调用规则

**可以用 sessions_spawn 并发多个 Agent 同时执行任务，token 充足，无需节省。**

适用场景：
- 多个独立子任务需要同时处理
- 需要并行查询/获取不同来源的信息
- 代码编写和测试可以并行

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
