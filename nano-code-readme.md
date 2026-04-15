<div align="center">

# 🤖 Nano Code

### A Mini Coding Agent to Understand AI Agent Architecture

[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![AI Agent](https://img.shields.io/badge/AI-Agent-orange?style=for-the-badge)]()

**Learn how AI coding agents like Claude Code, Codex, and Cursor work under the hood**

[English](#overview) · [中文文档](#中文文档)

</div>

---

## 📖 Overview

**Nano Code** is a minimalist coding agent implementation designed for learning and understanding AI Agent architecture. It demonstrates the core concepts behind popular AI coding assistants like:

- 🤖 **Claude Code** - Anthropic's terminal-based coding agent
- 💻 **GitHub Copilot** - AI pair programmer
- 🎯 **Cursor** - AI-first code editor
- ⚡ **Codex** - OpenAI's code generation model

### 🎯 Why Nano Code?

Most AI coding tools are complex and hard to understand. Nano Code strips away the complexity to show you:

```
┌─────────────────────────────────────────────────┐
│            How AI Coding Agents Work             │
├─────────────────────────────────────────────────┤
│  1. 📝 Parse user request (natural language)    │
│  2. 🔍 Understand codebase context              │
│  3. 🧠 Generate code with LLM                   │
│  4. ✅ Validate & apply changes                 │
│  5. 🔄 Iterate based on feedback                │
└─────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **LLM Integration** | Support for OpenAI, Claude, DeepSeek |
| 📁 **Codebase Understanding** | Parse and analyze project structure |
| ✏️ **Code Generation** | Generate code based on natural language |
| 🔧 **Tool Calling** | Execute shell commands, read/write files |
| 🔄 **Iterative Refinement** | Self-correction and improvement loop |
| 📊 **Conversation History** | Maintain context across turns |

---

## 🏗️ Architecture

```
nano-code/
├── agent/                 # Agent core logic
│   ├── __init__.py
│   ├── planner.py        # Task planning
│   ├── executor.py       # Action execution
│   └── memory.py         # Conversation memory
├── tools/                 # Tool implementations
│   ├── file_ops.py       # Read/write files
│   ├── shell.py          # Execute commands
│   └── search.py         # Code search
├── llm/                   # LLM providers
│   ├── openai.py
│   ├── claude.py
│   └── deepseek.py
├── prompts/               # System prompts
│   └── coding_agent.md
└── main.py               # Entry point
```

### Core Components

#### 1. 🎯 Planner
Breaks down complex tasks into actionable steps:
```python
def plan(task: str) -> List[Action]:
    """Convert natural language to structured plan"""
    return [
        Action("read_file", path="src/main.py"),
        Action("analyze_code", focus="function_names"),
        Action("generate_code", spec="add error handling"),
        Action("write_file", path="src/main.py"),
    ]
```

#### 2. ⚡ Executor
Executes actions with proper error handling:
```python
def execute(action: Action) -> Result:
    """Execute action and return result"""
    result = tool_registry.call(action.name, **action.params)
    return result
```

#### 3. 🧠 Memory
Maintains conversation context:
```python
class Memory:
    def __init__(self, max_turns: int = 10):
        self.history: List[Message] = []
    
    def add(self, role: str, content: str):
        self.history.append(Message(role, content))
```

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/afine907/nano-code.git
cd nano-code

# Install dependencies
pip install -r requirements.txt

# Set up environment
export OPENAI_API_KEY="your-api-key"
# or
export ANTHROPIC_API_KEY="your-api-key"
```

### Usage

```bash
# Interactive mode
python main.py

# With specific task
python main.py --task "Add error handling to all API calls in src/api.py"

# With specific model
python main.py --model claude-3-sonnet
```

### Example Session

```
👤 You: Add input validation to the user registration function

🤖 Nano Code: I'll help you add input validation. Let me first read the file...

📝 Reading: src/auth/user.py

🔍 Analyzing: Found `register_user()` function

✏️ Generating validation code...

✅ Changes applied:
   - Added email format validation
   - Added password strength check
   - Added username length validation

📄 Updated: src/auth/user.py

💬 Would you like me to add unit tests for these validations?
```

---

## 🔧 Configuration

### config.yaml

```yaml
llm:
  provider: openai  # openai | claude | deepseek
  model: gpt-4
  temperature: 0.7
  max_tokens: 4096

agent:
  max_iterations: 10
  timeout: 300
  
tools:
  shell:
    enabled: true
    allowed_commands: ["git", "npm", "pytest", "ruff"]
  file:
    enabled: true
    max_file_size: 1MB
```

---

## 📚 Learning Path

### Level 1: Understanding the Basics
- [ ] Read `agent/planner.py` - Learn how tasks are planned
- [ ] Read `agent/executor.py` - Understand action execution
- [ ] Run the agent with simple tasks

### Level 2: Customizing Tools
- [ ] Add a new tool in `tools/` directory
- [ ] Register it in `tool_registry.py`
- [ ] Test with custom prompts

### Level 3: Building Your Own Agent
- [ ] Modify the system prompt
- [ ] Implement custom memory strategy
- [ ] Add multi-agent collaboration

---

## 🤝 Contributing

Contributions are welcome! This project is designed for learning, so:

1. **Keep it simple** - Code should be easy to understand
2. **Add comments** - Explain the "why" behind decisions
3. **Write tests** - Help others verify their understanding

```bash
# Run tests
pytest tests/

# Format code
ruff format .

# Type check
mypy nano_code/
```

---

## 📖 Resources

### Learn More About AI Agents

- [LangChain Documentation](https://python.langchain.com/)
- [Building Agents with LLMs](https://lilianweng.github.io/posts/2023-06-23-agent/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Agent Skills Specification](https://github.com/afine907/skills)

### Related Projects

- [Claude Code](https://claude.ai/code) - Anthropic's official coding agent
- [Aider](https://aider.chat/) - AI pair programming in terminal
- [OpenHands](https://github.com/All-Hands-AI/OpenHands) - Open source Devin alternative

---

## 📄 License

MIT License - feel free to use this for learning and building your own agents!

---

## 🙏 Acknowledgments

Inspired by the amazing work from:
- Anthropic's Claude Code team
- OpenAI's Codex researchers
- The open-source AI agent community

---

<div align="center">

**⭐ If this project helped you understand AI agents, give it a star!**

Made with 🤖 by [afine907](https://github.com/afine907)

</div>
