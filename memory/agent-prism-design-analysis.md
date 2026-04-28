# AgentPrism 设计系统分析报告

## 一、AgentPrism 设计亮点

### 1. 颜色系统 (Oklch 色彩空间)

使用 Oklch 色彩空间，支持 Light/Dark 主题自动切换：

```css
/* 示例：LLM Call 节点的颜色定义 */
--agentprism-avatar-llm: 62.7% 0.265 303.9;     /* purple.500 */
--agentprism-badge-llm: 97.7% 0.014 308.299;    /* purple.50 */
--agentprism-timeline-llm: 71.4% 0.203 305.504; /* purple.400 */
```

**特点**：
- 每个节点类型都有 Avatar、Badge、Timeline 三种颜色变体
- 颜色饱和度、亮度统一设计
- 自动支持 Light/Dark 模式

### 2. 节点分类体系

AgentPrism 定义了 11 种节点分类：

| Category | Label | Theme | Icon |
|----------|-------|-------|------|
| llm_call | LLM | purple | Zap ⚡ |
| tool_execution | TOOL | orange | Wrench 🔧 |
| agent_invocation | AGENT INVOCATION | indigo | Bot 🤖 |
| chain_operation | CHAIN | teal | Link 🔗 |
| retrieval | RETRIEVAL | cyan | Search 🔍 |
| embedding | EMBEDDING | emerald | BarChart2 📊 |
| create_agent | CREATE AGENT | sky | Plus ➕ |
| span | SPAN | cyan | MoveHorizontal ↔️ |
| event | EVENT | emerald | CircleDot ⚪ |
| guardrail | GUARDRAIL | red | ShieldCheck 🛡️ |
| unknown | UNKNOWN | gray | HelpCircle ❓ |

### 3. 组件设计

#### Badge 组件
- 支持 4 种尺寸 (4/5/6/7)
- 支持起始/结束图标
- 圆角设计 (rounded-md)
- 字体：medium weight

```tsx
<Badge
  iconStart={<Zap className="size-2.5" />}
  size="4"
  label="LLM"
/>
```

#### Status 组件
- 两种变体：`dot` 和 `badge`
- 状态类型：success, error, warning, pending
- Badge 变体带图标

```tsx
// Dot 变体
<span className="size-1.5 rounded-full bg-agentprism-success" />

// Badge 变体
<span className="h-3.5 w-4 rounded bg-agentprism-success-muted">
  <Check className="size-2.5" />
</span>
```

#### Avatar 组件
- 8 种尺寸 (4/6/8/9/10/11/12/16)
- 支持图片、字母、自定义内容
- 根据节点类型自动着色
- 圆角可配置

#### Timeline 组件
- Gantt 风格时间线
- 颜色与节点类型对应
- 显示执行时长

### 4. 树形布局设计

AgentPrism 的 SpanCard 使用 Grid 布局：

```
[连接线列] [内容区域] [展开按钮(可选)]
```

**连接线设计**：
- vertical (垂直线)
- t-right (T型转右)
- corner-top-right (直角转弯)

**选中状态**：
- 背景渐变高亮
- 上方有指示条

### 5. 信息展示优先级

每个节点卡片包含：
1. **Avatar** - 节点类型图标
2. **Title** - 节点名称
3. **Badges** - Token 数量、成本、类型徽章
4. **Timeline** - 执行时间可视化
5. **Duration** - 精确执行时长
6. **Status** - 状态指示器

---

## 二、TraceScope 当前设计对比

### 当前问题

1. **颜色系统不统一**
   - 只使用 Tailwind 默认颜色
   - 缺乏语义化的颜色变量
   - Dark mode 支持不完善

2. **Badge 设计单调**
   - 只有纯色背景
   - 没有图标
   - 缺少层次感

3. **节点卡片缺少视觉层次**
   - 左侧边框样式简单
   - 缺少时间线可视化
   - 没有成本/Token 展示

4. **状态指示器过于简单**
   - 只有 dot 样式
   - 没有图标增强

### TraceScope 当前的节点类型

| Type | Label | 颜色方案 |
|------|-------|---------|
| user_input | User Input | 未明确定义 |
| assistant_thought | Assistant Thought | 未明确定义 |
| tool_call | Tool Call | 未明确定义 |
| code_execution | Code Generation | 未明确定义 |
| execution_result | Execution Result | 未明确定义 |
| final_output | Final Output | 未明确定义 |
| error | Error | 未明确定义 |

---

## 三、改进建议

### 方案 A：借鉴 AgentPrism 设计语言

#### 1. 升级颜色系统

```css
/* Light mode */
--ts-node-user: 58.5% 0.233 277.117;      /* indigo - 用户输入 */
--ts-node-thought: 62.7% 0.265 303.9;     /* purple - AI 思考 */
--ts-node-tool: 70.5% 0.213 47.604;       /* orange - 工具调用 */
--ts-node-code: 71.5% 0.143 215.221;      /* cyan - 代码执行 */
--ts-node-result: 69.6% 0.17 162.48;      /* emerald - 执行结果 */
--ts-node-output: 68.5% 0.169 237.323;    /* sky - 最终输出 */
--ts-node-error: 63.7% 0.237 25.331;      /* red - 错误 */
```

#### 2. 新 Badge 设计

```tsx
// 改进前
<span className="ts-badge">Tool Call</span>

// 改进后
<Badge
  iconStart={<Wrench className="size-2.5" />}
  category="tool_call"
  label="TOOL"
/>
```

#### 3. 新 Status 设计

```tsx
// Dot 变体 (紧凑)
<span className="size-1.5 rounded-full bg-ts-success" />

// Badge 变体 (带图标)
<span className="h-3.5 w-4 rounded bg-ts-success-muted">
  <Check className="size-2.5" />
</span>
```

#### 4. 添加 Timeline 可视化

```tsx
// 在节点卡片中添加时间条
<div className="ts-timeline">
  <div 
    className="ts-timeline-bar ts-timeline-tool"
    style={{ width: '60%', left: '20%' }}
  />
</div>
```

#### 5. 添加 Token/Cost 展示

```tsx
<div className="flex gap-1">
  <TokensBadge tokensCount={250} />
  <PriceBadge cost={0.003} />
</div>
```

---

### 方案 B：最小化改动（快速见效）

#### 只改动 3 个关键点：

1. **为 Badge 添加图标**
   - 从 lucide-react 引入图标
   - 与节点类型对应

2. **改进颜色方案**
   - 参考上面的颜色定义
   - 使用 CSS 变量

3. **添加 Status Badge 变体**
   - 成功：绿色 + ✓ 图标
   - 错误：红色 + ⚠ 图标
   - 流式：紫色 + ⋯ 图标

---

## 四、推荐实施路径

### 第一阶段：设计稿（推荐）

1. 在 Figma 中设计新版节点
2. 确定颜色系统
3. 设计所有组件变体
4. 与团队评审

### 第二阶段：组件开发

1. 升级主题 CSS
2. 重构 Badge 组件
3. 添加 Status Badge 变体
4. 添加 Timeline 组件
5. 添加 Token/Cost 组件

### 第三阶段：集成测试

1. 更新 TraceNode 组件
2. 更新 Demo 页面
3. 添加 Storybook

---

## 五、参考资源

- AgentPrism GitHub: https://github.com/evilmartians/agent-prism
- AgentPrism Figma: https://www.figma.com/community/file/1557718585517042786
- AgentPrism Storybook: https://storybook.agent-prism.evilmartians.io/
- Lucide Icons: https://lucide.dev/

---

## 六、下一步行动

**需要老板决策**：
1. 是否采用 AgentPrism 的设计语言？
2. 是先出交互稿，还是直接改代码？
3. 是否需要添加 Timeline 视图？
4. 是否需要 Token/Cost 可视化？
