---
name: ai-native-pipeline
description: AI Native 开发流水线。从需求到代码，全自动执行 impact-analyzer → prd-agent → spec-agent → coding-agent → verification-agent 五步流程。

触发方式：
  用户说: "/pipeline <任务描述>"
  或: "执行 pipeline <任务描述>"
---

# AI Native Pipeline

## 触发命令

```
/pipeline <任务描述>
```

## 固定流程（5 步）

### Step 1: impact-analyzer（代码影响分析）

**动作**：
1. 读取 `~/.claude/agents/impact-analyzer.md`
2. 判断场景：全新模块 or 增量开发
3. 执行代码分析（grep/read/ctags）
4. 生成 Impact Map

**输出格式**：
```markdown
[Step 1/5] 🔍 代码影响分析...

**类型**: 增量开发 / 全新模块

**Impact Map**:
- Core Files: src/auth/session.py, src/auth/middleware.py
- Dependent Files: src/api/routes/*.py (12 callers)
- Boundary: src/payments/, src/admin/auth.py
- Risks: 🔴 authenticate() 被 12 处调用

✅ 输出: .harness/sessions/session-{timestamp}/00-impact-map.md
```

**保存**：`.harness/sessions/session-{timestamp}/00-impact-map.md`

---

### Step 2: prd-agent（需求分析）

**动作**：
1. 读取 `~/.claude/agents/prd-agent.md`
2. 基于 Impact Map 生成需求规格
3. 定义功能优先级（P0/P1）
4. 定义验收标准（可执行命令）

**输出格式**：
```markdown
[Step 2/5] 📝 需求分析...

**Task Spec**: JWT 认证

**Scope**:
- 修改: src/auth/session.py, src/auth/middleware.py
- 参考: src/api_keys/jwt_util.py
- 禁止: src/payments/, src/admin/auth.py

**功能优先级**:
| 功能 | 优先级 |
|------|--------|
| JWT Token 生成 | P0 |
| JWT Token 验证 | P0 |
| Token 刷新 | P1 |

**验收标准**:
- [ ] `pytest tests/auth/ -v` 全部通过
- [ ] `ruff check src/auth/` 无错误
- [ ] `grep "Session" src/auth/` 无匹配

✅ 输出: .harness/sessions/session-{timestamp}/01-task-spec.md

⏸️  **[Planning Gate]** 确认需求范围？
- 输入 `y` 继续
- 输入 `n` 修改需求
```

**Planning Gate**：等待用户确认
- `y` → 继续 Step 3
- `n` → 返回修改 Task Spec

**保存**：`.harness/sessions/session-{timestamp}/01-task-spec.md`

---

### Step 3: spec-agent（技术设计）

**动作**：
1. 读取 `~/.claude/agents/spec-agent.md`
2. 基于 Task Spec 设计技术方案
3. 定义 API、数据模型、技术选型
4. 定义兼容性策略

**输出格式**：
```markdown
[Step 3/5] 🏗️ 技术设计...

**Technical Spec**: JWT 认证

**API 设计**:
```
POST /api/auth/login
  Request:  { phone, code }
  Response: { token, user }
```

**数据模型**:
```
User { jwt_secret: string }  # 新增
```

**技术选型**:
| 决策点 | 选择 | 理由 |
|--------|------|------|
| JWT 库 | PyJWT | 项目已有 |
| 算法 | HS256 | 与 api_keys 一致 |

**兼容性**:
- authenticate() 签名保持不变

✅ 输出: .harness/sessions/session-{timestamp}/03-spec.md
```

**保存**：`.harness/sessions/session-{timestamp}/03-spec.md`

---

### Step 4: coding-agent（代码实现）

**动作**：
1. 读取 `~/.claude/agents/coding-agent.md`
2. **TDD 模式**：先写测试，再写实现
3. 创建/修改文件
4. 运行测试确保通过

**输出格式**：
```markdown
[Step 4/5] 💻 代码实现（TDD）...

**TDD 流程**:
1. ✅ 先写测试: tests/auth/test_jwt_manager.py
2. ✅ 再写实现: src/auth/jwt_manager.py
3. ✅ 运行测试: pytest tests/auth/ -v

**修改文件**:
- `src/auth/jwt_manager.py` (新建)
- `src/auth/middleware.py` (修改)
- `tests/auth/test_jwt_manager.py` (新建)

**关键代码**:
```python
class JWTManager:
    def create(self, user_id: int) -> str:
        payload = {"user_id": user_id, "exp": datetime.utcnow() + timedelta(hours=2)}
        return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm="HS256")
```

**测试结果**:
✅ 23 tests passed

✅ 输出: .harness/sessions/session-{timestamp}/04-code.md

⏸️  **[Planning Gate]** 确认代码改动？
- 输入 `y` 继续验证
- 输入 `n` 修改代码
```

**Planning Gate**：等待用户确认
- `y` → 继续 Step 5
- `n` → 返回修改代码

**保存**：`.harness/sessions/session-{timestamp}/04-code.md`

---

### Step 5: verification-agent（验收验证）

**动作**：
1. 读取 `~/.claude/agents/verification-agent.md`
2. 运行 Task Spec 中定义的验收标准
3. 收集所有验证结果
4. 输出最终报告

**输出格式**：
```markdown
[Step 5/5] ✅ 验收验证...

**验证结果**:
| 检查项 | 命令 | 状态 |
|--------|------|------|
| 测试 | `pytest tests/auth/ -v` | ✅ 23 passed |
| Lint | `ruff check src/auth/` | ✅ No issues |
| Session 检查 | `grep "Session" src/auth/` | ✅ 无匹配 |

**Summary**:
| 状态 | 数量 |
|------|------|
| ✅ Pass | 3 |
| ❌ Fail | 0 |

✅ 输出: .harness/sessions/session-{timestamp}/05-verification.md

──────────────────────────────────
🎉 **Pipeline 完成！**

所有文件已保存到: `.harness/sessions/session-{timestamp}/`
──────────────────────────────────
```

**保存**：`.harness/sessions/session-{timestamp}/05-verification.md`

---

## 复杂任务拆解

**触发条件**：API > 3 或跨模块

**动作**：
1. 在 Step 3 后自动触发
2. 读取 `~/.claude/skills/task-breakdown/SKILL.md`
3. 拆解为多个子任务
4. 按阶段并行/串行执行

**输出格式**：
```markdown
[Step 3.5] 📊 任务拆解...

**任务拆解**:
| ID | 任务 | 依赖 | 执行 |
|----|------|------|------|
| T1 | 后端 - 登录 API | - | 并行 |
| T2 | 后端 - 验证码 API | - | 并行 |
| T3 | 前端 - 登录页 | - | 并行 |
| T4 | 集成测试 | T1, T2, T3 | 串行 |

**执行计划**:
- 阶段 1（并行）: T1, T2, T3
- 阶段 2（串行）: T4
```

---

## 会话文件结构

```
.harness/sessions/session-20260429-074500/
├── 00-impact-map.md      # 代码影响分析
├── 01-task-spec.md       # 任务规格
├── 02-prd.md             # PRD（可选）
├── 03-spec.md            # 技术规格
├── 04-code.md            # 代码实现
├── 05-verification.md    # 验证结果
└── meta.json             # 元数据
```

---

## 关键原则

1. **固定流程** - 严格按照 5 步执行
2. **精简输出** - 每步只展示关键信息
3. **即时反馈** - 进度条 + 状态
4. **可干预** - Planning Gate 随时可介入
5. **文件留痕** - 所有输出保存到 .harness/

---

## 错误处理

### Step 1 失败
- 无法分析代码 → 提示用户手动提供 Impact Map

### Step 4 测试失败
- 展示失败测试 → 返回修改代码 → 重新运行测试

### Step 5 验证失败
- 展示失败项 → 给出修复建议 → 返回 Step 4

---

## 使用示例

**示例 1：增量开发**
```
用户: /pipeline 在现有登录模块基础上，增加 JWT 认证
```

**示例 2：全新项目**
```
用户: /pipeline 用户需要一个待办事项 API，包含增删改查功能
```

**示例 3：复杂任务**
```
用户: /pipeline 实现一个完整的电商下单流程，包含购物车、订单、支付
```
