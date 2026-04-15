/**
 * KeyboardManager - 快捷键管理器
 * 管理全局键盘快捷键
 */

class KeyboardManager {
  constructor() {
    this.shortcuts = {};
    this.enabled = true;
    this.init();
  }

  init() {
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  /**
   * 注册快捷键
   * @param {string} key - 快捷键组合，如 'ctrl+shift+o'
   * @param {Function} handler - 处理函数
   * @param {string} [description=''] - 描述
   */
  register(key, handler, description = "") {
    const combo = key.toLowerCase().replace(/\s+/g, "");
    this.shortcuts[combo] = { handler, description, key };
  }

  /**
   * 注销快捷键
   * @param {string} key - 快捷键组合
   */
  unregister(key) {
    const combo = key.toLowerCase().replace(/\s+/g, "");
    delete this.shortcuts[combo];
  }

  /**
   * 处理键盘事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleKeyDown(e) {
    if (!this.enabled) return;

    // 构建快捷键组合
    const parts = [];
    if (e.ctrlKey) parts.push("ctrl");
    if (e.altKey) parts.push("alt");
    if (e.shiftKey) parts.push("shift");
    if (e.metaKey) parts.push("meta");

    const key = e.key.toLowerCase();
    if (
      key !== "control" &&
      key !== "alt" &&
      key !== "shift" &&
      key !== "meta"
    ) {
      parts.push(key);
    }

    const combo = parts.join("+");

    if (this.shortcuts[combo]) {
      e.preventDefault();
      this.shortcuts[combo].handler(e);
    }
  }

  /**
   * 列出所有已注册的快捷键
   * @returns {Array} 快捷键列表
   */
  list() {
    return Object.values(this.shortcuts).map((s) => ({
      key: s.key,
      description: s.description,
    }));
  }

  /**
   * 启用快捷键
   */
  enable() {
    this.enabled = true;
  }

  /**
   * 禁用快捷键
   */
  disable() {
    this.enabled = false;
  }
}

// 导出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { KeyboardManager };
} else {
  window.KeyboardManager = KeyboardManager;
}
