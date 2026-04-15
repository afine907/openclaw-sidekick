/**
 * OpenClaw Sidekick - 键盘快捷键系统
 * 提供丰富的键盘操作支持
 */

// 快捷键配置
const DEFAULT_SHORTCUTS = {
  // 发送消息
  'Enter': 'sendMessage',
  'Ctrl+Enter': 'insertNewline',
  
  // 导航
  'Ctrl+ArrowUp': 'scrollToPreviousMessage',
  'Ctrl+ArrowDown': 'scrollToNextMessage',
  'Ctrl+Home': 'scrollToFirstMessage',
  'Ctrl+End': 'scrollToLastMessage',
  
  // 编辑
  'Ctrl+A': 'selectAll',
  'Ctrl+Z': 'undo',
  'Ctrl+Shift+Z': 'redo',
  'Ctrl+K': 'clearInput',
  
  // 工具
  'Ctrl+Shift+T': 'toggleTheme',
  'Ctrl+Shift+S': 'toggleSettings',
  'Ctrl+Shift+L': 'toggleThemeSwitcher',
  'Ctrl+Shift+P': 'togglePlugins',
  
  // 消息操作
  'Ctrl+D': 'deleteLastMessage',
  'Ctrl+Shift+C': 'copyLastMessage',
  'Alt+ArrowUp': 'editPreviousMessage',
  'Alt+ArrowDown': 'editNextMessage',
  
  // 快速回复
  'Ctrl+1': 'quickReply1',
  'Ctrl+2': 'quickReply2',
  'Ctrl+3': 'quickReply3',
  'Ctrl+4': 'quickReply4',
  'Ctrl+5': 'quickReply5',
  
  // 页面操作
  'Ctrl+Tab': 'nextTab',
  'Ctrl+Shift+Tab': 'previousTab',
  'Ctrl+W': 'closeTab',
  'Ctrl+T': 'newTab',
  
  // 搜索
  'Ctrl+F': 'toggleSearch',
  'Escape': 'closeSearch'
};

// 快捷键管理器
class ShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
    this.listeners = new Map();
    
    // 加载默认快捷键
    this.loadDefaults();
    
    // 加载用户自定义
    this.loadUserShortcuts();
    
    // 绑定事件
    this.bindEvents();
  }

  loadDefaults() {
    for (const [keys, action] of Object.entries(DEFAULT_SHORTCUTS)) {
      this.register(keys, action);
    }
  }

  loadUserShortcuts() {
    try {
      const saved = localStorage.getItem('openclaw_shortcuts');
      if (saved) {
        const userShortcuts = JSON.parse(saved);
        for (const [keys, action] of Object.entries(userShortcuts)) {
          this.register(keys, action);
        }
      }
    } catch (e) {
      console.error('Load shortcuts error:', e);
    }
  }

  saveUserShortcuts() {
    const userShortcuts = {};
    for (const [keys, action] of this.shortcuts) {
      if (!DEFAULT_SHORTCUTS[keys]) {
        userShortcuts[keys] = action;
      }
    }
    localStorage.setItem('openclaw_shortcuts', JSON.stringify(userShortcuts));
  }

  register(keys, action) {
    this.shortcuts.set(keys.toLowerCase(), action);
  }

  unregister(keys) {
    this.shortcuts.delete(keys.toLowerCase());
  }

  getAction(keys) {
    return this.shortcuts.get(keys.toLowerCase());
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      
      const keys = this.getKeys(e);
      const action = this.getAction(keys);
      
      if (action) {
        e.preventDefault();
        this.execute(action, e);
      }
    });
  }

  getKeys(e) {
    const parts = [];
    
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Meta');
    
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    parts.push(key);
    
    return parts.join('+');
  }

  async execute(action, event) {
    // 触发监听器
    if (this.listeners.has(action)) {
      for (const listener of this.listeners.get(action)) {
        try {
          await listener(event);
        } catch (e) {
          console.error(`Shortcut ${action} error:`, e);
        }
      }
    }
    
    // 触发全局事件
    window.dispatchEvent(new CustomEvent('shortcut', {
      detail: { action, event }
    }));
  }

  on(action, callback) {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, []);
    }
    this.listeners.get(action).push(callback);
  }

  off(action, callback) {
    if (this.listeners.has(action)) {
      const callbacks = this.listeners.get(action);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  reset() {
    this.shortcuts.clear();
    this.loadDefaults();
  }

  list() {
    return Array.from(this.shortcuts.entries()).map(([keys, action]) => ({
      keys,
      action,
      isDefault: !!DEFAULT_SHORTCUTS[keys]
    }));
  }
}

// 动作处理器
class ActionHandler {
  constructor(sidepanel) {
    this.sidepanel = sidepanel;
  }

  async sendMessage() {
    this.sidepanel.sendMessage();
  }

  insertNewline(e) {
    const input = document.getElementById('input');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    input.value = value.substring(0, start) + '\n' + value.substring(end);
    input.selectionStart = input.selectionEnd = start + 1;
  }

  scrollToPreviousMessage() {
    const messages = document.querySelectorAll('.message');
    if (messages.length === 0) return;
    
    const current = document.querySelector('.message.focused');
    if (!current) {
      messages[messages.length - 1].classList.add('focused');
      return;
    }
    
    const index = Array.from(messages).indexOf(current);
    if (index > 0) {
      current.classList.remove('focused');
      messages[index - 1].classList.add('focused');
      messages[index - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  scrollToNextMessage() {
    const messages = document.querySelectorAll('.message');
    if (messages.length === 0) return;
    
    const current = document.querySelector('.message.focused');
    if (!current) {
      messages[0].classList.add('focused');
      return;
    }
    
    const index = Array.from(messages).indexOf(current);
    if (index < messages.length - 1) {
      current.classList.remove('focused');
      messages[index + 1].classList.add('focused');
      messages[index + 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  scrollToFirstMessage() {
    const first = document.querySelector('.message');
    if (first) {
      first.scrollIntoView({ behavior: 'smooth' });
    }
  }

  scrollToLastMessage() {
    const messages = document.querySelectorAll('.message');
    if (messages.length > 0) {
      messages[messages.length - 1].scrollIntoView({ behavior: 'smooth' });
    }
  }

  selectAll() {
    const input = document.getElementById('input');
    input.setSelectionRange(0, input.value.length);
  }

  undo() {
    document.execCommand('undo');
  }

  redo() {
    document.execCommand('redo');
  }

  clearInput() {
    const input = document.getElementById('input');
    input.value = '';
    input.focus();
  }

  toggleTheme() {
    const themeManager = window.themeManager;
    const themes = themeManager.listThemes();
    const current = themeManager.currentTheme;
    const allThemes = [...themes.builtIn, ...themes.custom];
    const currentIndex = allThemes.findIndex(t => t.id === current);
    const nextIndex = (currentIndex + 1) % allThemes.length;
    themeManager.setTheme(allThemes[nextIndex].id);
  }

  toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
  }

  toggleThemeSwitcher() {
    if (window.themeSwitcher) {
      if (window.themeSwitcherContainer) {
        window.themeSwitcherContainer.remove();
      } else {
        const container = window.themeSwitcher.render();
        document.getElementById('app').appendChild(container);
        window.themeSwitcherContainer = container;
      }
    }
  }

  togglePlugins() {
    // 打开插件面板
    console.log('Toggle plugins');
  }

  deleteLastMessage() {
    const messages = document.querySelectorAll('.message.user');
    if (messages.length > 0) {
      messages[messages.length - 1].remove();
    }
  }

  copyLastMessage() {
    const messages = document.querySelectorAll('.message.assistant');
    if (messages.length > 0) {
      const text = messages[messages.length - 1].textContent;
      navigator.clipboard.writeText(text);
    }
  }

  async quickReply1() { await this.quickReply(1); }
  async quickReply2() { await this.quickReply(2); }
  async quickReply3() { await this.quickReply(3); }
  async quickReply4() { await this.quickReply(4); }
  async quickReply5() { await this.quickReply(5); }

  async quickReply(index) {
    const replies = [
      '谢谢！',
      '好的，了解了',
      '可以详细说说吗？',
      '太棒了！',
      '明白了'
    ];
    
    if (replies[index - 1]) {
      this.sidepanel.addMessage('user', replies[index - 1]);
      await this.sidepanel.sendToOpenClaw(replies[index - 1]);
    }
  }

  toggleSearch() {
    const searchPanel = document.getElementById('search-panel');
    if (searchPanel) {
      searchPanel.classList.toggle('hidden');
      if (!searchPanel.classList.contains('hidden')) {
        searchPanel.querySelector('input').focus();
      }
    }
  }

  closeSearch() {
    const searchPanel = document.getElementById('search-panel');
    if (searchPanel) {
      searchPanel.classList.add('hidden');
    }
  }
}

// 快捷键提示 UI
class ShortcutHint {
  constructor(shortcutManager) {
    this.manager = shortcutManager;
    this.hints = new Map();
  }

  render() {
    const container = document.createElement('div');
    container.className = 'shortcut-hints';
    container.innerHTML = `
      <div class="hints-header">
        <h3>⌨️ 快捷键</h3>
        <button class="close-hints">&times;</button>
      </div>
      <div class="hints-content">
        ${this.renderHintGroups()}
      </div>
    `;
    
    return container;
  }

  renderHintGroups() {
    const groups = {
      '发送': ['Enter', 'Ctrl+Enter'],
      '导航': ['Ctrl+↑', 'Ctrl+↓', 'Ctrl+Home', 'Ctrl+End'],
      '编辑': ['Ctrl+A', 'Ctrl+Z', 'Ctrl+K'],
      '工具': ['Ctrl+Shift+T', 'Ctrl+Shift+S'],
      '快速回复': ['Ctrl+1~5'],
      '搜索': ['Ctrl+F', 'Esc']
    };
    
    let html = '';
    for (const [group, keys] of Object.entries(groups)) {
      html += `<div class="hint-group">
        <h4>${group}</h4>
        <div class="hint-keys">${keys.join(', ')}</div>
      </div>`;
    }
    
    return html;
  }

  show() {
    const existing = document.querySelector('.shortcut-hints');
    if (existing) {
      existing.remove();
      return;
    }
    
    const hints = this.render();
    document.body.appendChild(hints);
    
    hints.querySelector('.close-hints').addEventListener('click', () => {
      hints.remove();
    });
  }
}

// 导出
window.ShortcutManager = ShortcutManager;
window.ActionHandler = ActionHandler;
window.ShortcutHint = ShortcutHint;