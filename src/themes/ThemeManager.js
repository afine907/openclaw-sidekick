/**
 * ThemeManager - 主题管理器
 * 负责主题的加载、应用、切换和自定义
 */

import { Themes } from "./definitions.js";

/**
 * 主题管理器类
 * 管理主题的切换、存储和事件通知
 */
class ThemeManager {
  /**
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.currentTheme = "dark";
    this.customThemes = {};
    this.listeners = [];
    this.storageKey = options.storageKey || "openclaw-theme";
    this.customThemesKey = options.customThemesKey || "openclaw-custom-themes";

    // 加载保存的主题
    this.loadSavedTheme();
    this.loadCustomThemes();
  }

  /**
   * 从 localStorage 加载保存的主题
   */
  loadSavedTheme() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved && (Themes[saved] || this.customThemes[saved])) {
      this.currentTheme = saved;
    }
  }

  /**
   * 获取指定主题
   * @param {string} [name=this.currentTheme] - 主题名称
   * @returns {Object|null} 主题对象
   */
  getTheme(name = this.currentTheme) {
    return Themes[name] || this.customThemes[name] || null;
  }

  /**
   * 获取当前主题
   * @returns {Object} 当前主题对象
   */
  getCurrentTheme() {
    return this.getTheme(this.currentTheme);
  }

  /**
   * 设置当前主题
   * @param {string} name - 主题名称
   * @returns {Promise<boolean>} 是否成功
   */
  async setTheme(name) {
    const theme = this.getTheme(name);
    if (!theme) {
      console.error(`Theme "${name}" not found`);
      return false;
    }

    this.currentTheme = name;
    this.applyTheme(theme);
    localStorage.setItem(this.storageKey, name);

    // 通知监听器
    this.notifyListeners();

    return true;
  }

  /**
   * 应用主题到页面
   * @param {Object} theme - 主题对象
   */
  applyTheme(theme) {
    const root = document.documentElement;
    const colors = theme.colors;

    // 设置 CSS 变量
    root.style.setProperty("--bg-primary", colors.background);
    root.style.setProperty("--bg-secondary", colors.backgroundSecondary);
    root.style.setProperty("--bg-tertiary", colors.backgroundTertiary);
    root.style.setProperty("--text-primary", colors.text);
    root.style.setProperty("--text-secondary", colors.textSecondary);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--accent-light", colors.accentLight);
    root.style.setProperty("--border", colors.border);
    root.style.setProperty("--success", colors.success);
    root.style.setProperty("--warning", colors.warning);
    root.style.setProperty("--error", colors.error);
    root.style.setProperty("--info", colors.info);

    // 更新 body 样式
    document.body.style.background = colors.background;
    document.body.style.color = colors.text;
  }

  /**
   * 注册自定义主题
   * @param {string} name - 主题名称
   * @param {Object} colors - 颜色配置
   */
  registerCustomTheme(name, colors) {
    this.customThemes[name] = {
      name,
      colors,
      isCustom: true,
    };

    // 保存到 localStorage
    const saved = JSON.parse(
      localStorage.getItem(this.customThemesKey) || "{}",
    );
    saved[name] = colors;
    localStorage.setItem(this.customThemesKey, JSON.stringify(saved));
  }

  /**
   * 加载自定义主题
   */
  loadCustomThemes() {
    const saved = JSON.parse(
      localStorage.getItem(this.customThemesKey) || "{}",
    );
    for (const [name, colors] of Object.entries(saved)) {
      this.registerCustomTheme(name, colors);
    }
  }

  /**
   * 删除自定义主题
   * @param {string} name - 主题名称
   */
  deleteCustomTheme(name) {
    if (this.customThemes[name]?.isCustom) {
      delete this.customThemes[name];

      // 从 localStorage 删除
      const saved = JSON.parse(
        localStorage.getItem(this.customThemesKey) || "{}",
      );
      delete saved[name];
      localStorage.setItem(this.customThemesKey, JSON.stringify(saved));
    }
  }

  /**
   * 列出所有可用主题
   * @returns {Object} 包含内置主题和自定义主题的列表
   */
  listThemes() {
    return {
      builtIn: Object.entries(Themes).map(([key, theme]) => ({
        id: key,
        name: theme.name,
      })),
      custom: Object.entries(this.customThemes)
        .filter(([_, theme]) => theme.isCustom)
        .map(([key, theme]) => ({
          id: key,
          name: theme.name,
        })),
    };
  }

  /**
   * 添加主题变更监听器
   * @param {Function} callback - 回调函数
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * 移除主题变更监听器
   * @param {Function} callback - 回调函数
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   */
  notifyListeners() {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentTheme, this.getCurrentTheme());
      } catch (e) {
        console.error("Theme listener error:", e);
      }
    });
  }

  /**
   * 导出主题为 JSON
   * @param {string} [name=this.currentTheme] - 主题名称
   * @returns {string} JSON 字符串
   */
  exportTheme(name = this.currentTheme) {
    const theme = this.getTheme(name);
    return JSON.stringify(theme, null, 2);
  }

  /**
   * 从 JSON 导入主题
   * @param {string} jsonString - JSON 字符串
   * @returns {Object} 导入结果
   */
  importTheme(jsonString) {
    try {
      const theme = JSON.parse(jsonString);

      if (!theme.name || !theme.colors) {
        throw new Error("Invalid theme format");
      }

      // 验证必要颜色
      const requiredColors = [
        "background",
        "backgroundSecondary",
        "text",
        "textSecondary",
        "accent",
        "border",
      ];

      for (const color of requiredColors) {
        if (!theme.colors[color]) {
          throw new Error(`Missing required color: ${color}`);
        }
      }

      // 生成唯一 ID
      const id = "custom-" + Date.now();
      this.registerCustomTheme(id, theme.colors);

      return { success: true, id, name: theme.name };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// 导出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ThemeManager };
} else {
  window.ThemeManager = ThemeManager;
}
