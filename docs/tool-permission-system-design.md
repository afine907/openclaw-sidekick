# jojo-code 工具权限系统设计方案

> 版本: 2.0  
> 日期: 2026-04-23  
> 设计原则: 基于现有代码增强，轻量化，无沙箱

## 目录

1. [概述](#1-概述)
2. [现有代码分析](#2-现有代码分析)
3. [架构设计](#3-架构设计)
4. [权限模型](#4-权限模型)
5. [权限策略配置](#5-权限策略配置)
6. [审计日志系统](#6-审计日志系统)
7. [动态权限扩展](#7-动态权限扩展)
8. [与现有代码集成](#8-与现有代码集成)
9. [CLI 交互设计](#9-cli-交互设计)
10. [实现计划](#10-实现计划)

---

## 1. 概述

### 1.1 设计原则

jojo-code 是**本地 CLI 工具**，Agent 以用户身份在本地环境执行操作：

| 原则 | 说明 |
|------|------|
| **无沙箱** | 直接在本地环境执行，无需容器隔离 |
| **确认优先** | 防止 Agent 误解意图，敏感操作需用户确认 |
| **审计追溯** | 所有操作记录在案，可回溯 |
| **基于现有代码** | 复用已有的 security 模块，增量增强 |

### 1.2 为什么不需要沙箱？

```
场景分析：

云端 Agent 服务
├── 威胁：恶意用户攻击
├── 需要：沙箱隔离 ✅
└── 例如：ChatGPT Code Interpreter

本地 CLI 工具 ← jojo-code
├── 威胁：Agent 误解用户意图
├── 需要：确认 + 审计 ✅
└── 不需要：沙箱 ❌

理由：
1. 用户已有系统权限，Agent 只是代理执行
2. 沙箱增加复杂度和启动开销
3. 本地开发需要访问本地环境（node、python、git 等）
4. 真正的风险是"误操作"，不是"恶意攻击"
```

---

## 2. 现有代码分析

### 2.1 项目结构

```
jojo-code/
├── src/jojo_code/
│   ├── security/                    # ✅ 已有权限系统
│   │   ├── __init__.py
│   │   ├── permission.py            # PermissionLevel, PermissionResult
│   │   ├── manager.py               # PermissionManager, PermissionConfig
│   │   ├── command_guard.py         # CommandGuard (命令白名单/黑名单)
│   │   ├── path_guard.py            # PathGuard (路径权限)
│   │   └── guards.py                # BaseGuard 基类
│   │
│   ├── agent/                       # ✅ 已有 Agent
│   │   ├── __init__.py
│   │   ├── graph.py                 # LangGraph 图
│   │   ├── nodes.py                 # thinking_node, execute_node
│   │   ├── state.py                 # AgentState
│   │   └── modes.py                 # PlanMode
│   │
│   ├── tools/                       # ✅ 已有工具
│   │   ├── registry.py              # ToolRegistry (已集成权限检查)
│   │   ├── file_tools.py            # read_file, write_file, edit_file
│   │   ├── shell_tools.py           # run_command
│   │   ├── search_tools.py          # grep_search, glob_search
│   │   ├── web_tools.py             # web_search
│   │   ├── git_tools.py             # git 相关工具
│   │   └── ...
│   │
│   ├── server/                      # ✅ 已有 JSON-RPC
│   │   ├── __init__.py
│   │   ├── jsonrpc.py               # JSON-RPC Server
│   │   ├── handlers.py              # chat, clear, get_model
│   │   └── main.py
│   │
│   └── core/                        # ✅ 已有核心模块
│       ├── config.py                # Settings
│       ├── llm.py                   # LLM 客户端
│       └── ...
│
├── packages/cli/                    # ✅ 已有 TypeScript CLI
│   └── src/
│       ├── index.tsx                # 入口
│       ├── app.tsx                  # 主应用
│       ├── client/
│       │   ├── jsonrpc.ts           # JSON-RPC 客户端
│       │   └── types.ts
│       ├── components/
│       │   ├── ChatView.tsx
│       │   └── InputBox.tsx
│       └── hooks/
│           └── useAgent.ts
│
└── tests/
    └── test_security/
        └── test_permission.py       # ✅ 已有测试
```

### 2.2 现有权限系统分析

#### 2.2.1 `security/permission.py`

**已有功能：**
```python
class PermissionLevel(Enum):
    ALLOW = "allow"      # 自动允许
    CONFIRM = "confirm"  # 需要确认
    DENY = "deny"        # 禁止执行

@dataclass
class PermissionResult:
    level: PermissionLevel
    tool_name: str
    args: dict[str, Any]
    reason: str | None = None
```

**优点：**
- 简单清晰的三级权限模型
- PermissionResult 包含原因说明

**不足：**
- 缺少风险等级 (Low/Medium/High/Critical)
- 缺少权限模式 (YOLO/Auto-Approve/Interactive/Strict/ReadOnly)

#### 2.2.2 `security/manager.py`

**已有功能：**
```python
@dataclass
class PermissionConfig:
    workspace_root: Path
    allow_outside: bool
    allowed_paths: list[str]
    denied_paths: list[str]
    confirm_on_write: list[str]
    shell_enabled: bool
    allowed_commands: list[str]
    denied_commands: list[str]
    shell_default: PermissionLevel
    max_timeout: int
    allow_network: bool
    max_tool_calls: int
    audit_log: bool
    audit_log_path: Path

class PermissionManager:
    def __init__(self, config: PermissionConfig)
    def check(self, tool_name: str, args: dict[str, Any]) -> PermissionResult
    def get_audit_log(self) -> list[dict[str, Any]]
```

**优点：**
- 配置结构清晰
- 已有审计日志基础
- 支持从 YAML 加载配置
- 提供开发/生产预设配置

**不足：**
- 审计日志功能简单，缺少结构化查询
- 缺少动态权限扩展
- 缺少用户确认回调机制
- 缺少会话级权限管理

#### 2.2.3 `security/command_guard.py`

**已有功能：**
```python
class CommandGuard(BaseGuard):
    NETWORK_COMMANDS = frozenset(["curl", "wget", "nc", ...])
    
    def __init__(self, enabled, allowed_commands, denied_commands, default, max_timeout, allow_network)
    def check(self, tool_name: str, args: dict[str, Any]) -> PermissionResult
    def _match_command(self, command: str, pattern: str) -> bool
    def _is_network_command(self, command: str) -> bool
```

**优点：**
- 支持通配符模式匹配
- 网络命令检测
- 超时限制

**不足：**
- 缺少风险等级评估
- 危险命令模式硬编码

#### 2.2.4 `tools/registry.py`

**已有功能：**
```python
class ToolRegistry:
    def __init__(self, permission_manager, confirm_callback)
    def execute(self, name: str, args: dict[str, Any]) -> str
        # 1. 权限检查
        # 2. 需要确认时调用 confirm_callback
        # 3. 执行工具
```

**优点：**
- 已集成权限检查
- 支持确认回调
- 工具分类 (read/write)

**不足：**
- confirm_callback 未在 CLI 中实现
- 缺少权限请求的 UI 交互

### 2.3 需要增强的部分

| 模块 | 现状 | 需要增强 |
|------|------|----------|
| `permission.py` | ✅ 基础定义 | ➕ 风险等级、权限模式 |
| `manager.py` | ✅ 核心逻辑 | ➕ 权限模式切换、增强审计 |
| `command_guard.py` | ✅ 命令检查 | ➕ 风险评估、模式扩展 |
| `guards.py` | ✅ 基类 | 保持不变 |
| `path_guard.py` | ✅ 路径检查 | 保持不变 |
| **新增** `risk.py` | ❌ 不存在 | ➕ 风险等级评估 |
| **新增** `audit.py` | ❌ 不存在 | ➕ 增强审计系统 |
| **新增** `expansion.py` | ❌ 不存在 | ➕ 动态权限扩展 |
| **CLI** | ❌ 无权限 UI | ➕ 权限请求组件 |
| **JSON-RPC** | ❌ 无权限 handler | ➕ 权限相关 handler |

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           jojo-code CLI                              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      TypeScript CLI (ink)                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │    │
│  │  │ Permission  │  │  Audit Log  │  │   Operation         │  │    │
│  │  │  Request    │  │   Viewer    │  │   Preview           │  │    │
│  │  │  (新增)     │  │  (新增)     │  │   (新增)            │  │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │    │
│  └─────────┼────────────────┼────────────────────┼─────────────┘    │
│            │ JSON-RPC       │ JSON-RPC          │ JSON-RPC          │
│  ┌─────────▼────────────────▼────────────────────▼─────────────┐    │
│  │                     JSON-RPC Server                           │    │
│  │                 (server/handlers.py 增强权限 handlers)        │    │
│  └─────────────────────────────┬───────────────────────────────┘    │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                      Python Core (LangGraph)                         │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     Security Layer (增强)                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │   │
│  │  │ Permission      │  │   AuditLogger   │  │  Expansion   │   │   │
│  │  │ Manager (增强)  │  │   (新增)        │  │  Manager     │   │   │
│  │  │                 │  │                 │  │  (新增)      │   │   │
│  │  └────────┬────────┘  └────────┬────────┘  └──────┬───────┘   │   │
│  │           │                    │                   │           │   │
│  │           └────────────────────┴───────────────────┘           │   │
│  │                              │                                  │   │
│  │  ┌───────────────────────────▼───────────────────────────────┐ │   │
│  │  │                Tool Registry (已有)                        │ │   │
│  │  │  execute() 时调用 PermissionManager.check()               │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                 │                                      │
│  ┌──────────────────────────────▼──────────────────────────────────┐   │
│  │                     Agent Layer (已有)                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐   │   │
│  │  │   Graph     │  │   Nodes     │  │   State Manager       │   │   │
│  │  │  (graph.py) │  │  (nodes.py) │  │   (state.py)          │   │   │
│  │  └─────────────┘  └─────────────┘  └───────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 文件变更清单

```
src/jojo_code/security/
├── __init__.py              # 更新导出
├── permission.py            # ✅ 保持不变
├── manager.py               # 📝 增强: 添加权限模式
├── command_guard.py         # 📝 增强: 添加风险评估
├── path_guard.py            # ✅ 保持不变
├── guards.py                # ✅ 保持不变
├── risk.py                  # 🆕 新增: 风险等级评估
├── audit.py                 # 🆕 新增: 增强审计系统
├── expansion.py             # 🆕 新增: 动态权限扩展
└── modes.py                 # 🆕 新增: 权限模式定义

src/jojo_code/tools/
└── registry.py              # 📝 增强: 更好的确认回调

src/jojo_code/server/
└── handlers.py              # 📝 增强: 添加权限 handlers

packages/cli/src/
├── components/
│   ├── PermissionRequest.tsx    # 🆕 新增: 权限请求组件
│   └── AuditLogViewer.tsx       # 🆕 新增: 审计日志查看器
└── hooks/
    └── usePermission.ts         # 🆕 新增: 权限状态管理
```

---

## 4. 权限模型

### 4.1 权限层级 (增强现有 PermissionLevel)

```python
# src/jojo_code/security/modes.py (新增)

from enum import Enum


class PermissionMode(Enum):
    """权限模式 - 控制整体的权限策略"""
    
    YOLO = "yolo"                  # 允许一切，无确认
    AUTO_APPROVE = "auto-approve"  # 低风险自动批准，中高风险需确认
    INTERACTIVE = "interactive"    # 默认，安全操作自动批准，敏感操作需确认
    STRICT = "strict"              # 所有操作都需要确认
    READONLY = "readonly"          # 只允许读操作


class RiskLevel(Enum):
    """风险等级 - 用于评估单个操作的风险"""
    
    LOW = "low"           # 绿色，自动批准
    MEDIUM = "medium"     # 黄色，需确认 (Auto-Approve 模式自动批准)
    HIGH = "high"         # 橙色，需确认
    CRITICAL = "critical" # 红色，强制确认 + 二次确认
```

### 4.2 与现有 PermissionLevel 的关系

```python
# 现有 PermissionLevel (permission.py)
class PermissionLevel(Enum):
    ALLOW = "allow"      # 决策: 允许执行
    CONFIRM = "confirm"  # 决策: 需要确认
    DENY = "deny"        # 决策: 拒绝执行

# 关系:
# RiskLevel + PermissionMode → PermissionLevel
#
# 示例:
# RiskLevel.LOW + PermissionMode.INTERACTIVE → PermissionLevel.ALLOW
# RiskLevel.HIGH + PermissionMode.INTERACTIVE → PermissionLevel.CONFIRM
# RiskLevel.CRITICAL + PermissionMode.AUTO_APPROVE → PermissionLevel.CONFIRM
```

### 4.3 风险评估规则

```python
# src/jojo_code/security/risk.py (新增)

import re
from typing import Any


# 风险模式定义
RISK_PATTERNS = {
    "critical": [
        r"rm\s+-rf\s+/",          # rm -rf /
        r"rm\s+-rf\s+~",          # rm -rf ~
        r"sudo\s+",               # sudo
        r"chmod\s+777",           # chmod 777
        r">\s*/dev/sd",           # 写入磁盘设备
        r"mkfs",                  # 格式化
        r"dd\s+if=",              # dd 命令
        r"fork\s*bomb",           # fork bomb
    ],
    "high": [
        r"\brm\b",                # rm 命令
        r"\bgit\s+push\s+--force\b",  # 强制推送
        r"\bcurl\b.*\|\s*bash",   # curl | bash
        r"\bwget\b.*\|\s*bash",   # wget | bash
        r"\bdocker\s+run\b",      # docker run
        r"\bnpm\s+publish\b",     # npm publish
        r"\bgit\s+push\b",        # git push
    ],
    "medium": [
        r"\bwrite_file\b",        # 写文件
        r"\bedit_file\b",         # 编辑文件
        r"\bnpm\s+install\b",     # npm install
        r"\bpip\s+install\b",     # pip install
        r"\buv\s+install\b",      # uv install
        r"\bpython\b",            # python
        r"\bnode\b",              # node
        r"\bgit\s+commit\b",      # git commit
    ],
    "low": [
        r"\bread_file\b",         # 读文件
        r"\bgrep\b",              # grep
        r"\bls\b",                # ls
        r"\bcat\b",               # cat
        r"\bgit\s+status\b",      # git status
        r"\bgit\s+log\b",         # git log
        r"\bgit\s+diff\b",        # git diff
    ],
}


def assess_risk(tool_name: str, args: dict[str, Any]) -> str:
    """评估操作风险等级
    
    Args:
        tool_name: 工具名称
        args: 工具参数
        
    Returns:
        风险等级: "low" | "medium" | "high" | "critical"
    """
    # 1. 直接根据工具名称判断
    if tool_name in ("read_file", "list_directory", "grep_search", "glob_search", 
                     "git_status", "git_log", "git_diff", "git_blame", "git_info"):
        return "low"
    
    if tool_name in ("write_file", "edit_file"):
        # 文件写入: 检查路径
        path = args.get("path", "")
        if any(p in path for p in ["/etc/", "/usr/", "/var/", "/root/"]):
            return "high"
        return "medium"
    
    if tool_name == "run_command":
        command = args.get("command", "")
        
        # 检查危险模式
        for pattern in RISK_PATTERNS["critical"]:
            if re.search(pattern, command, re.IGNORECASE):
                return "critical"
        
        for pattern in RISK_PATTERNS["high"]:
            if re.search(pattern, command, re.IGNORECASE):
                return "high"
        
        for pattern in RISK_PATTERNS["medium"]:
            if re.search(pattern, command, re.IGNORECASE):
                return "medium"
        
        return "low"
    
    # 默认中等风险
    return "medium"
```

### 4.4 权限决策矩阵

```
                    YOLO  Auto-Approve  Interactive  Strict  ReadOnly
                    ──────────────────────────────────────────────────
Low Risk            ✓     ✓             ✓            确认    ✓
Medium Risk         ✓     ✓             确认         确认    ✗
High Risk           ✓     确认          确认         确认    ✗
Critical Risk       ✓     确认          确认+二次    确认+2次 ✗

在 Deny List 中    ✗     ✗             ✗            ✗       ✗
```

---

## 5. 权限策略配置

### 5.1 增强现有 PermissionConfig

```python
# src/jojo_code/security/manager.py (增强)

@dataclass
class PermissionConfig:
    """权限配置 (增强版)"""
    
    # ─── 现有字段保持不变 ───
    workspace_root: Path = field(default_factory=lambda: Path("."))
    allow_outside: bool = False
    allowed_paths: list[str] = field(default_factory=lambda: ["*"])
    denied_paths: list[str] = field(default_factory=list)
    confirm_on_write: list[str] = field(default_factory=list)
    shell_enabled: bool = True
    allowed_commands: list[str] = field(default_factory=list)
    denied_commands: list[str] = field(default_factory=lambda: ["rm -rf /", "sudo"])
    shell_default: PermissionLevel = PermissionLevel.CONFIRM
    max_timeout: int = 300
    allow_network: bool = False
    max_tool_calls: int = 100
    audit_log: bool = True
    audit_log_path: Path = field(default_factory=lambda: Path(".jojo-code/audit.log"))
    
    # ─── 新增字段 ───
    mode: str = "interactive"  # yolo | auto-approve | interactive | strict | readonly
    
    # 敏感文件保护
    protected_files: list[str] = field(default_factory=lambda: [
        "**/.env",
        "**/.env.*",
        "**/credentials.json",
        "**/secrets.yaml",
        "**/*.pem",
        "**/*.key",
    ])
    
    # 操作预览
    preview_enabled: bool = True
    preview_max_lines: int = 50
```

### 5.2 YAML 配置文件示例

```yaml
# ~/.config/jojo-code/permissions.yaml

# 全局设置
version: 1
mode: interactive  # yolo | auto-approve | interactive | strict | readonly

# Workspace 配置
workspace:
  root: "."
  allow_outside: false

# 文件权限
file:
  allowed_paths:
    - "**"
  denied_paths:
    - ".env"
    - "*.pem"
    - "*.key"
  confirm_on_write:
    - "**"

# Shell 权限
shell:
  enabled: true
  allowed_commands: []
  denied_commands:
    - "rm -rf /"
    - "rm -rf ~"
    - "sudo *"
  default: confirm
  max_timeout: 300
  allow_network: false

# 敏感文件保护
protected_files:
  - "**/.env"
  - "**/credentials.json"
  - "**/secrets.yaml"
  - "**/*.pem"
  - "**/*.key"

# 全局设置
global:
  max_tool_calls: 100
  audit_log: true
  audit_log_path: "~/.local/share/jojo-code/audit.log"
  preview_enabled: true
  preview_max_lines: 50
```

---

## 6. 审计日志系统

### 6.1 增强现有审计功能

```python
# src/jojo_code/security/audit.py (新增)

import json
from dataclasses import dataclass, asdict, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
import uuid
import logging

logger = logging.getLogger(__name__)


@dataclass
class AuditEvent:
    """审计事件"""
    id: str
    timestamp: str
    session_id: str
    
    # 事件详情
    event_type: str          # tool_call | permission_change | mode_change
    tool: str
    action: str
    params: dict[str, Any]
    
    # 权限决策
    allowed: bool
    mode: str
    reason: str
    risk_level: str
    matched_rule: Optional[str] = None
    
    # 用户交互
    prompt_shown: bool = False
    user_response: Optional[str] = None
    response_time_ms: Optional[int] = None
    
    # 执行结果
    execution_status: Optional[str] = None
    duration_ms: Optional[int] = None
    exit_code: Optional[int] = None
    error_message: Optional[str] = None
    
    # 上下文
    agent_task: Optional[str] = None
    working_directory: Optional[str] = None


class AuditLogger:
    """增强版审计日志记录器"""
    
    def __init__(
        self,
        log_dir: Optional[Path] = None,
        session_id: Optional[str] = None,
    ):
        self.log_dir = log_dir or Path.home() / ".local/share/jojo-code/audit"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.session_id = session_id or str(uuid.uuid4())[:8]
        self._current_file: Optional[Path] = None
        self._file_handle = None
        
    def log_event(self, event: AuditEvent):
        """记录审计事件"""
        log_file = self._get_log_file()
        
        if self._current_file != log_file:
            if self._file_handle:
                self._file_handle.close()
            self._file_handle = open(log_file, "a", encoding="utf-8")
            self._current_file = log_file
        
        line = json.dumps(asdict(event), ensure_ascii=False)
        self._file_handle.write(line + "\n")
        self._file_handle.flush()
    
    def log_tool_call(
        self,
        tool: str,
        action: str,
        params: dict,
        decision: dict,
        execution: Optional[dict] = None,
        context: Optional[dict] = None,
    ) -> str:
        """记录工具调用"""
        event_id = f"audit_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        
        event = AuditEvent(
            id=event_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
            session_id=self.session_id,
            event_type="tool_call",
            tool=tool,
            action=action,
            params=params,
            allowed=decision.get("allowed", False),
            mode=decision.get("mode", "unknown"),
            reason=decision.get("reason", ""),
            risk_level=decision.get("risk_level", "unknown"),
            matched_rule=decision.get("matched_rule"),
            prompt_shown=decision.get("prompt_shown", False),
            user_response=decision.get("user_response"),
            response_time_ms=decision.get("response_time_ms"),
            execution_status=execution.get("status") if execution else None,
            duration_ms=execution.get("duration_ms") if execution else None,
            exit_code=execution.get("exit_code") if execution else None,
            error_message=execution.get("error") if execution else None,
            agent_task=context.get("task") if context else None,
            working_directory=context.get("cwd") if context else None,
        )
        
        self.log_event(event)
        return event_id
    
    def _get_log_file(self) -> Path:
        """获取当天日志文件"""
        today = datetime.now().strftime("%Y-%m-%d")
        return self.log_dir / f"{today}.jsonl"
    
    def close(self):
        """关闭日志文件"""
        if self._file_handle:
            self._file_handle.close()
            self._file_handle = None


class AuditQuery:
    """审计日志查询"""
    
    def __init__(self, log_dir: Optional[Path] = None):
        self.log_dir = log_dir or Path.home() / ".local/share/jojo-code/audit"
    
    def query(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        tool: Optional[str] = None,
        allowed: Optional[bool] = None,
        risk_level: Optional[str] = None,
        limit: int = 100,
    ) -> list[dict]:
        """查询审计日志"""
        from datetime import datetime, timedelta
        
        results = []
        
        if not start_date:
            start_date = datetime.now().strftime("%Y-%m-%d")
        if not end_date:
            end_date = start_date
        
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        dates = []
        current = start
        while current <= end:
            dates.append(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)
        
        for date in dates:
            log_file = self.log_dir / f"{date}.jsonl"
            if not log_file.exists():
                continue
            
            with open(log_file, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    
                    if tool and event.get("tool") != tool:
                        continue
                    if allowed is not None and event.get("allowed") != allowed:
                        continue
                    if risk_level and event.get("risk_level") != risk_level:
                        continue
                    
                    results.append(event)
                    if len(results) >= limit:
                        return results
        
        return results
    
    def get_statistics(self, date: Optional[str] = None) -> dict:
        """获取统计数据"""
        from datetime import datetime
        date = date or datetime.now().strftime("%Y-%m-%d")
        events = self.query(start_date=date, end_date=date, limit=10000)
        
        return {
            "total_calls": len(events),
            "allowed": sum(1 for e in events if e.get("allowed")),
            "denied": sum(1 for e in events if not e.get("allowed")),
            "by_tool": self._count_by(events, "tool"),
            "by_risk": self._count_by(events, "risk_level"),
        }
    
    def _count_by(self, events: list[dict], key: str) -> dict:
        """按字段统计"""
        counts = {}
        for event in events:
            value = event.get(key, "unknown")
            counts[value] = counts.get(value, 0) + 1
        return counts
```

---

## 7. 动态权限扩展

### 7.1 概念

当工具执行因为权限不足失败时，系统可以：

1. 自动检测失败原因
2. 识别需要扩展的权限
3. 向用户请求临时授权
4. 执行操作后自动撤销

### 7.2 实现

```python
# src/jojo_code/security/expansion.py (新增)

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional
import time


class ExpansionTrigger(Enum):
    COMMAND_PATTERN = "command_pattern"
    ERROR_DETECTION = "error_detection"


@dataclass
class ExpansionRule:
    """权限扩展规则"""
    name: str
    trigger: ExpansionTrigger
    pattern: str
    required_permissions: list[str]
    reason: str
    expires_in: Optional[int] = None  # 秒


# 预定义规则
EXPANSION_RULES = [
    ExpansionRule(
        name="npm_install",
        trigger=ExpansionTrigger.COMMAND_PATTERN,
        pattern=r"^(npm|pnpm|yarn)\s+(install|add|i)\b",
        required_permissions=["run_command:npm*"],
        reason="Package installation requires permission",
        expires_in=300,
    ),
    ExpansionRule(
        name="pip_install",
        trigger=ExpansionTrigger.COMMAND_PATTERN,
        pattern=r"^(pip|uv)\s+install\b",
        required_permissions=["run_command:pip*"],
        reason="Python package installation requires permission",
        expires_in=300,
    ),
    ExpansionRule(
        name="git_remote",
        trigger=ExpansionTrigger.COMMAND_PATTERN,
        pattern=r"^git\s+(clone|fetch|pull|push)\b",
        required_permissions=["run_command:git*"],
        reason="Git remote operations require permission",
        expires_in=600,
    ),
    ExpansionRule(
        name="permission_denied",
        trigger=ExpansionTrigger.ERROR_DETECTION,
        pattern=r"Permission denied|EACCES",
        required_permissions=[],
        reason="Detected permission error",
    ),
]


class ExpansionManager:
    """权限扩展管理器"""
    
    def __init__(self):
        self.rules = EXPANSION_RULES.copy()
        self._temporary_permissions: dict[str, tuple[list[str], Optional[int]]] = {}
    
    def detect_expansion_need(
        self,
        tool_name: str,
        args: dict,
        error_output: Optional[str] = None,
    ) -> Optional[dict]:
        """检测是否需要权限扩展"""
        command = args.get("command", "") if tool_name == "run_command" else ""
        
        # 检查命令模式
        for rule in self.rules:
            if rule.trigger == ExpansionTrigger.COMMAND_PATTERN:
                if re.search(rule.pattern, command):
                    return {
                        "rule": rule,
                        "permissions": rule.required_permissions.copy(),
                    }
        
        # 检查错误输出
        if error_output:
            for rule in self.rules:
                if rule.trigger == ExpansionTrigger.ERROR_DETECTION:
                    if re.search(rule.pattern, error_output):
                        return {
                            "rule": rule,
                            "permissions": rule.required_permissions.copy(),
                            "error": error_output,
                        }
        
        return None
    
    def apply_expansion(self, request: dict, user_approved: bool) -> dict:
        """应用权限扩展"""
        if not user_approved:
            return {"granted": False, "message": "Denied by user"}
        
        rule = request["rule"]
        permissions = request["permissions"]
        
        if rule.expires_in:
            expires_at = int(time.time()) + rule.expires_in
            self._temporary_permissions[rule.name] = (permissions, expires_at)
        
        return {
            "granted": True,
            "permissions": permissions,
            "expires_in": rule.expires_in,
        }
    
    def check_temporary_permission(self, permission: str) -> bool:
        """检查临时权限"""
        import fnmatch
        current_time = int(time.time())
        
        for key, (permissions, expires_at) in list(self._temporary_permissions.items()):
            if expires_at and current_time > expires_at:
                del self._temporary_permissions[key]
                continue
            
            for p in permissions:
                if fnmatch.fnmatch(permission, p):
                    return True
        
        return False
```

---

## 8. 与现有代码集成

### 8.1 增强 PermissionManager

```python
# src/jojo_code/security/manager.py (增强)

from .modes import PermissionMode
from .risk import assess_risk


class PermissionManager:
    """权限管理器 (增强版)"""
    
    def __init__(self, config: PermissionConfig):
        self.config = config
        self.mode = PermissionMode(config.mode)  # 新增
        self.guards: list[BaseGuard] = []
        self._call_count = 0
        self._audit_log: list[dict[str, Any]] = []
        
        self._init_guards()
    
    def check(self, tool_name: str, args: dict[str, Any]) -> PermissionResult:
        """检查工具调用权限 (增强版)"""
        
        # 1. YOLO 模式直接放行
        if self.mode == PermissionMode.YOLO:
            return PermissionResult(PermissionLevel.ALLOW, tool_name, args)
        
        # 2. ReadOnly 模式检查
        if self.mode == PermissionMode.READONLY:
            risk = assess_risk(tool_name, args)
            if risk in ("medium", "high", "critical"):
                return PermissionResult(
                    PermissionLevel.DENY,
                    tool_name,
                    args,
                    reason=f"ReadOnly mode denies {risk} risk operation",
                )
        
        # 3. 调用守卫检查
        final_result = PermissionResult(PermissionLevel.ALLOW, tool_name, args)
        
        for guard in self.guards:
            result = guard.check(tool_name, args)
            if result.level > final_result.level:
                final_result = result
            if result.denied:
                return result
        
        # 4. 根据权限模式和风险等级调整决策
        if final_result.level == PermissionLevel.ALLOW:
            risk = assess_risk(tool_name, args)
            
            # Strict 模式: 所有操作都需确认
            if self.mode == PermissionMode.STRICT:
                return PermissionResult(
                    PermissionLevel.CONFIRM,
                    tool_name,
                    args,
                    reason=f"Strict mode requires confirmation for all operations (risk: {risk})",
                )
            
            # Interactive 模式: 中高风险需确认
            if self.mode == PermissionMode.INTERACTIVE:
                if risk in ("medium", "high", "critical"):
                    return PermissionResult(
                        PermissionLevel.CONFIRM,
                        tool_name,
                        args,
                        reason=f"Operation requires confirmation (risk: {risk})",
                    )
            
            # Auto-Approve 模式: 高风险需确认
            if self.mode == PermissionMode.AUTO_APPROVE:
                if risk in ("high", "critical"):
                    return PermissionResult(
                        PermissionLevel.CONFIRM,
                        tool_name,
                        args,
                        reason=f"High risk operation requires confirmation (risk: {risk})",
                    )
        
        return final_result
    
    def set_mode(self, mode: str) -> None:
        """设置权限模式"""
        self.mode = PermissionMode(mode)
        self.config.mode = mode
```

### 8.2 增强 ToolRegistry

```python
# src/jojo_code/tools/registry.py (增强)

# 现有代码保持不变，只需增强 execute 方法

def execute(self, name: str, args: dict[str, Any]) -> str:
    """执行工具 (增强版)"""
    
    # 权限检查
    if self._permission_manager is not None:
        result = self._permission_manager.check(name, args)
        
        if result.denied:
            raise PermissionError(f"权限拒绝: {result.reason}", result)
        
        if result.needs_confirm:
            if self._confirm_callback is not None:
                # 调用 CLI 确认回调
                approved = self._confirm_callback(result)
                if not approved:
                    raise PermissionError("用户拒绝执行", result)
            else:
                raise PermissionError(f"操作需要确认: {result.reason}", result)
    
    # 执行工具
    tool = self.get(name)
    if tool is None:
        raise ValueError(f"Unknown tool: {name}")
    
    return str(tool.invoke(args))
```

### 8.3 增强 JSON-RPC Handlers

```python
# src/jojo_code/server/handlers.py (增强)

from jojo_code.security.audit import AuditLogger, AuditQuery
from jojo_code.security.manager import get_permission_manager


# 全局审计日志记录器
_audit_logger: AuditLogger | None = None


def get_audit_logger() -> AuditLogger:
    """获取审计日志记录器"""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = AuditLogger()
    return _audit_logger


def handle_permission_confirm(params: dict) -> dict:
    """处理权限确认响应"""
    session_id = params.get("session_id")
    approved = params.get("approved", False)
    return {"status": "ok", "approved": approved}


def handle_permission_mode(params: dict) -> dict:
    """获取/设置权限模式"""
    pm = get_permission_manager()
    if pm is None:
        return {"status": "error", "error": "Permission manager not initialized"}
    
    mode = params.get("mode")
    if mode:
        pm.set_mode(mode)
        return {"status": "ok", "mode": mode}
    
    return {"status": "ok", "mode": pm.mode.value}


def handle_audit_query(params: dict) -> dict:
    """查询审计日志"""
    query = AuditQuery()
    results = query.query(
        start_date=params.get("start_date"),
        end_date=params.get("end_date"),
        tool=params.get("tool"),
        allowed=params.get("allowed"),
        risk_level=params.get("risk_level"),
        limit=params.get("limit", 100),
    )
    return {"status": "ok", "results": results, "count": len(results)}


def handle_audit_stats(params: dict) -> dict:
    """获取审计统计"""
    query = AuditQuery()
    stats = query.get_statistics(params.get("date"))
    return {"status": "ok", "statistics": stats}


def register_handlers():
    """注册所有处理器 (增强版)"""
    server = get_server()
    
    # 现有 handlers
    server.register("chat", handle_chat)
    server.register("clear", handle_clear)
    server.register("get_model", handle_get_model)
    server.register("get_stats", handle_get_stats)
    
    # 新增权限 handlers
    server.register("permission/confirm", handle_permission_confirm)
    server.register("permission/mode", handle_permission_mode)
    server.register("audit/query", handle_audit_query)
    server.register("audit/stats", handle_audit_stats)
```

---

## 9. CLI 交互设计

### 9.1 新增 TypeScript 组件

```typescript
// packages/cli/src/components/PermissionRequest.tsx (新增)

import React from 'react';
import { Box, Text, useInput } from 'ink';

interface PermissionRequestProps {
  tool: string;
  action: string;
  params: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  onDecision: (decision: 'allow' | 'deny' | 'always') => void;
}

const riskColors = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
};

const riskLabels = {
  low: '🟢 Low',
  medium: '🟡 Medium',
  high: '🟠 High',
  critical: '🔴 Critical',
};

export function PermissionRequest({
  tool,
  action,
  params,
  riskLevel,
  reason,
  onDecision,
}: PermissionRequestProps) {
  useInput((input) => {
    if (input === 'y') onDecision('allow');
    else if (input === 'a') onDecision('always');
    else if (input === 'n') onDecision('deny');
  });

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={riskColors[riskLevel]}>
      <Box>
        <Text bold>🔒 Permission Request</Text>
      </Box>
      
      <Box>
        <Text bold>Tool:</Text>
        <Text> {tool}</Text>
        <Text bold>  Risk:</Text>
        <Text color={riskColors[riskLevel]}> {riskLabels[riskLevel]}</Text>
      </Box>
      
      {params.command && (
        <Box>
          <Text bold>Command: </Text>
          <Text dimColor>{params.command}</Text>
        </Box>
      )}
      
      <Box>
        <Text dimColor>Reason: {reason}</Text>
      </Box>
      
      <Box marginTop={1}>
        <Text>[Y] Yes  </Text>
        <Text>[A] Always  </Text>
        <Text>[N] No</Text>
      </Box>
    </Box>
  );
}
```

### 9.2 新增 JSON-RPC 客户端方法

```typescript
// packages/cli/src/client/jsonrpc.ts (增强)

export class JsonRpcClient {
  // 现有方法...
  
  // 新增权限相关方法
  async permissionConfirm(sessionId: string, approved: boolean): Promise<void> {
    await this.call('permission/confirm', { session_id: sessionId, approved });
  }
  
  async setPermissionMode(mode: string): Promise<void> {
    await this.call('permission/mode', { mode });
  }
  
  async getPermissionMode(): Promise<string> {
    const result = await this.call('permission/mode', {});
    return result.mode;
  }
  
  async queryAudit(params: {
    start_date?: string;
    end_date?: string;
    tool?: string;
    allowed?: boolean;
    risk_level?: string;
    limit?: number;
  }): Promise<any[]> {
    const result = await this.call('audit/query', params);
    return result.results;
  }
  
  async getAuditStats(date?: string): Promise<any> {
    const result = await this.call('audit/stats', { date });
    return result.statistics;
  }
}
```

---

## 10. 实现计划

### 10.1 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `security/modes.py` | 🆕 新增 | 权限模式和风险等级定义 |
| `security/risk.py` | 🆕 新增 | 风险评估逻辑 |
| `security/audit.py` | 🆕 新增 | 增强审计系统 |
| `security/expansion.py` | 🆕 新增 | 动态权限扩展 |
| `security/manager.py` | 📝 增强 | 添加权限模式支持 |
| `security/command_guard.py` | 📝 增强 | 集成风险评估 |
| `tools/registry.py` | 📝 增强 | 更好的确认回调 |
| `server/handlers.py` | 📝 增强 | 添加权限 handlers |
| `security/__init__.py` | 📝 更新 | 导出新模块 |
| `components/PermissionRequest.tsx` | 🆕 新增 | 权限请求组件 |
| `client/jsonrpc.ts` | 📝 增强 | 权限相关方法 |

### 10.2 分阶段实现

#### Phase 1: Python 核心 (2 天)

```python
# 任务清单
□ security/modes.py      - PermissionMode, RiskLevel 枚举
□ security/risk.py       - assess_risk() 函数
□ security/audit.py      - AuditLogger, AuditQuery
□ security/manager.py    - 增强: 权限模式支持
□ 更新 tests/test_security/test_permission.py
```

#### Phase 2: JSON-RPC 集成 (1 天)

```python
# 任务清单
□ server/handlers.py     - 添加 permission/audit handlers
□ tests/test_server/     - 添加测试
```

#### Phase 3: CLI 组件 (2 天)

```typescript
// 任务清单
□ PermissionRequest.tsx  - 权限请求组件
□ 更新 app.tsx           - 集成权限组件
□ client/jsonrpc.ts      - 添加权限方法
□ packages/cli/tests/    - 添加测试
```

#### Phase 4: 动态权限扩展 (1 天)

```python
# 任务清单
□ security/expansion.py  - ExpansionManager
□ 集成到 ToolRegistry
□ 添加测试
```

### 10.3 测试覆盖

```python
# tests/test_security/

test_modes.py            # PermissionMode, RiskLevel 测试
test_risk.py             # assess_risk() 测试
test_audit.py            # AuditLogger, AuditQuery 测试
test_expansion.py        # ExpansionManager 测试
test_permission.py       # 增强现有测试
```

---

## 附录

### A. API 参考

#### Python API

```python
from jojo_code.security import (
    PermissionManager,
    PermissionConfig,
    PermissionMode,
    RiskLevel,
    assess_risk,
    AuditLogger,
    AuditQuery,
    ExpansionManager,
)

# 初始化
config = PermissionConfig.development()
pm = PermissionManager(config)

# 设置模式
pm.set_mode("strict")

# 检查权限
result = pm.check("run_command", {"command": "npm install"})

# 评估风险
risk = assess_risk("run_command", {"command": "rm -rf /"})

# 审计日志
logger = AuditLogger()
logger.log_tool_call(...)

query = AuditQuery()
stats = query.get_statistics()
```

#### JSON-RPC API

```
permission/mode          GET/POST  获取/设置权限模式
permission/confirm       POST      确认权限请求
audit/query              POST      查询审计日志
audit/stats              GET       获取审计统计
```

---

**文档结束**
