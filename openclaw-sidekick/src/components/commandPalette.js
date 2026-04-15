/**
 * 命令面板 - 支持 / 命令快速调用预设
 */

class CommandPalette {
  constructor() {
    this.commands = [];
    this.isOpen = false;
    this.selectedIndex = 0;
    this.input = null;
    this.list = null;
  }

  init() {
    this.registerDefaultCommands();
    this.createUI();
    this.bindEvents();
  }

  registerDefaultCommands() {
    this.commands = [
      {
        id: 'explain',
        name: '解释代码',
        description: '解释选中的代码',
        prompt: '请解释以下代码的功能和原理：\n',
        icon: '📖'
      },
      {
        id: 'refactor',
        name: '重构代码',
        description: '优化和重构选中的代码',
        prompt: '请重构以下代码，使其更加简洁和高效：\n',
        icon: '🔧'
      },
      {
        id: 'review',
        name: '代码审查',
        description: '审查代码并提出改进建议',
        prompt: '请审查以下代码，指出潜在问题和改进建议：\n',
        icon: '👀'
      },
      {
        id: 'test',
        name: '生成测试',
        description: '为代码生成单元测试',
        prompt: '请为以下代码生成单元测试：\n',
        icon: '🧪'
      },
      {
        id: 'translate',
        name: '翻译代码',
        description: '将代码翻译成另一种语言',
        prompt: '请将以下代码翻译成 Python：\n',
        icon: '🌐'
      },
      {
        id: 'debug',
        name: '调试分析',
        description: '分析代码中的 bug',
        prompt: '请分析以下代码中的潜在 bug 和问题：\n',
        icon: '🐛'
      },
      {
        id: 'document',
        name: '生成文档',
        description: '为代码生成文档注释',
        prompt: '请为以下代码生成详细的文档注释：\n',
        icon: '📝'
      },
      {
        id: 'summarize',
        name: '总结内容',
        description: '总结选中的内容',
        prompt: '请用简洁的语言总结以下内容：\n',
        icon: '📋'
      }
    ];
  }

  createUI() {
    // 创建命令面板容器
    const palette = document.createElement('div');
    palette.id = 'command-palette';
    palette.className = 'command-palette hidden';
    palette.innerHTML = `
      <div class="command-palette-backdrop"></div>
      <div class="command-palette-content">
        <input type="text" class="command-palette-input" placeholder="输入命令或搜索..." />
        <div class="command-palette-list"></div>
        <div class="command-palette-footer">
          <span>↑↓ 选择</span>
          <span>Enter 执行</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    `;
    document.body.appendChild(palette);

    this.input = palette.querySelector('.command-palette-input');
    this.list = palette.querySelector('.command-palette-list');
  }

  bindEvents() {
    // 点击遮罩关闭
    const backdrop = document.querySelector('.command-palette-backdrop');
    backdrop?.addEventListener('click', () => this.close());

    // 输入搜索
    this.input?.addEventListener('input', (e) => this.search(e.target.value));

    // 键盘导航
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectPrev();
          break;
        case 'Enter':
          e.preventDefault();
          this.executeSelected();
          break;
      }
    });
  }

  open() {
    this.isOpen = true;
    this.selectedIndex = 0;
    this.input.value = '';
    document.getElementById('command-palette')?.classList.remove('hidden');
    this.input?.focus();
    this.renderList(this.commands);
  }

  close() {
    this.isOpen = false;
    document.getElementById('command-palette')?.classList.add('hidden');
  }

  search(query) {
    const filtered = query
      ? this.commands.filter(cmd =>
          cmd.name.toLowerCase().includes(query.toLowerCase()) ||
          cmd.description.toLowerCase().includes(query.toLowerCase())
        )
      : this.commands;
    this.selectedIndex = 0;
    this.renderList(filtered);
  }

  renderList(commands) {
    if (!this.list) return;
    this.list.innerHTML = commands.map((cmd, idx) => `
      <div class="command-item ${idx === this.selectedIndex ? 'selected' : ''}" data-id="${cmd.id}">
        <span class="command-icon">${cmd.icon}</span>
        <div class="command-info">
          <div class="command-name">${cmd.name}</div>
          <div class="command-description">${cmd.description}</div>
        </div>
      </div>
    `).join('');

    // 点击事件
    this.list.querySelectorAll('.command-item').forEach(item => {
      item.addEventListener('click', () => {
        this.selectedIndex = [...this.list.children].indexOf(item);
        this.executeSelected();
      });
    });
  }

  selectNext() {
    const items = this.list?.children;
    if (!items?.length) return;
    this.selectedIndex = (this.selectedIndex + 1) % items.length;
    this.updateSelection();
  }

  selectPrev() {
    const items = this.list?.children;
    if (!items?.length) return;
    this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
    this.updateSelection();
  }

  updateSelection() {
    this.list?.children[this.selectedIndex]?.scrollIntoView({ block: 'nearest' });
    this.renderList(this.filteredCommands || this.commands);
  }

  executeSelected() {
    const command = this.commands[this.selectedIndex];
    if (command) {
      // 触发命令执行事件
      window.dispatchEvent(new CustomEvent('command-palette:execute', {
        detail: command
      }));
      this.close();
    }
  }

  // 添加自定义命令
  addCommand(command) {
    if (!this.commands.find(c => c.id === command.id)) {
      this.commands.push(command);
    }
  }
}

// 导出
window.CommandPalette = CommandPalette;