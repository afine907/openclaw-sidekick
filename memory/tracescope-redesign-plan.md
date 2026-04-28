# TraceScope 重设计实施计划

## 目标
借鉴 AgentPrism 设计语言，全面提升 TraceScope 节点视觉效果。

## 实施步骤

### Phase 1: 主题系统升级
- [ ] 创建 Oklch 色彩变量系统
- [ ] 定义 7 种节点类型的语义色
- [ ] 添加 Dark Mode 支持

### Phase 2: 基础组件重构
- [ ] Badge 组件（带图标 + 变体）
- [ ] Status 组件（Dot + Badge 变体）
- [ ] Avatar 组件（节点类型图标）

### Phase 3: 新增组件
- [ ] Timeline 组件（Gantt 风格时间条）
- [ ] TokensBadge 组件
- [ ] PriceBadge 组件

### Phase 4: 节点卡片重构
- [ ] TraceNode 组件升级
- [ ] NodeHeader 组件升级
- [ ] 集成所有新组件

### Phase 5: 测试与文档
- [ ] 更新 Demo 页面
- [ ] 添加组件 Storybook
- [ ] 编写使用文档

## 节点类型映射

| TraceScope Type | AgentPrism Style | Color | Icon |
|-----------------|------------------|-------|------|
| user_input | - | indigo | User |
| assistant_thought | llm_call | purple | Zap |
| tool_call | tool_execution | orange | Wrench |
| code_execution | chain_operation | cyan | Code |
| execution_result | event | emerald | Terminal |
| final_output | - | sky | CheckCircle |
| error | guardrail | red | AlertCircle |

## 文件结构

```
src/
├── components/
│   ├── primitives/          # 新增：基础组件
│   │   ├── Badge.tsx
│   │   ├── Status.tsx
│   │   ├── Avatar.tsx
│   │   ├── Timeline.tsx
│   │   ├── TokensBadge.tsx
│   │   └── PriceBadge.tsx
│   ├── TraceNode.tsx        # 升级
│   ├── NodeHeader.tsx       # 升级
│   └── ...
├── styles/
│   ├── theme.css            # 新增：主题变量
│   └── tailwind.css         # 升级
└── types/
    └── node.ts              # 新增类型定义
```
