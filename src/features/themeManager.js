/**
 * 主题管理器 - 自定义主题颜色和样式
 */

class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.currentTheme = "dark";
    this.customThemes = {};
  }

  init() {
    this.registerBuiltinThemes();
    this.loadUserTheme();
  }

  registerBuiltinThemes() {
    // 深色主题 (默认)
    this.themes.set("dark", {
      id: "dark",
      name: "深色主题",
      colors: {
        background: "#1a1a1a",
        backgroundSecondary: "#252525",
        backgroundTertiary: "#2d2d2d",
        text: "#e0e0e0",
        textSecondary: "#aaa",
        textMuted: "#666",
        accent: "#4caf50",
        accentHover: "#45a049",
        border: "#333",
        borderLight: "#444",
        success: "#4caf50",
        warning: "#ff9800",
        error: "#f44336",
        info: "#2196f3",
      },
    });

    // 浅色主题
    this.themes.set("light", {
      id: "light",
      name: "浅色主题",
      colors: {
        background: "#ffffff",
        backgroundSecondary: "#f5f5f5",
        backgroundTertiary: "#eeeeee",
        text: "#333333",
        textSecondary: "#666666",
        textMuted: "#999999",
        accent: "#4caf50",
        accentHover: "#45a049",
        border: "#ddd",
        borderLight: "#eee",
        success: "#4caf50",
        warning: "#ff9800",
        error: "#f44336",
        info: "#2196f3",
      },
    });

    // 深夜主题
    this.themes.set("midnight", {
      id: "midnight",
      name: "深夜主题",
      colors: {
        background: "#0d1117",
        backgroundSecondary: "#161b22",
        backgroundTertiary: "#21262d",
        text: "#c9d1d9",
        textSecondary: "#8b949e",
        textMuted: "#6e7681",
        accent: "#58a6ff",
        accentHover: "#79b8ff",
        border: "#30363d",
        borderLight: "#21262d",
        success: "#3fb950",
        warning: "#d29922",
        error: "#f85149",
        info: "#58a6ff",
      },
    });

    // 绿色护眼主题
    this.themes.set("forest", {
      id: "forest",
      name: "森林主题",
      colors: {
        background: "#1a1f1a",
        backgroundSecondary: "#232923",
        backgroundTertiary: "#2d332d",
        text: "#d4e5d4",
        textSecondary: "#a8c4a8",
        textMuted: "#6b806b",
        accent: "#7cb87c",
        accentHover: "#8cc88c",
        border: "#3a4a3a",
        borderLight: "#4a5a4a",
        success: "#7cb87c",
        warning: "#d4a84c",
        error: "#d47c7c",
        info: "#7cb8d4",
      },
    });

    // 紫罗兰主题
    this.themes.set("violet", {
      id: "violet",
      name: "紫罗兰",
      colors: {
        background: "#1a1625",
        backgroundSecondary: "#251f32",
        backgroundTertiary: "#302840",
        text: "#e0d8f0",
        textSecondary: "#b8a8c8",
        textMuted: "#7a6888",
        accent: "#a87cd4",
        accentHover: "#b89ce4",
        border: "#443a54",
        borderLight: "#544a64",
        success: "#9b7cd4",
        warning: "#d4a87c",
        error: "#d47c9c",
        info: "#7ca4d4",
      },
    });
  }

  async loadUserTheme() {
    try {
      const data = await browser.storage.local.get("theme");
      if (data.theme) {
        this.currentTheme = data.theme.id || "dark";
      }

      // 加载自定义主题
      const customData = await browser.storage.local.get("customThemes");
      if (customData.customThemes) {
        this.customThemes = customData.customThemes;
        Object.entries(this.customThemes).forEach(([id, theme]) => {
          this.themes.set(id, theme);
        });
      }
    } catch (e) {
      console.error("加载主题失败:", e);
    }
  }

  async saveTheme() {
    await browser.storage.local.set({
      theme: { id: this.currentTheme },
    });
  }

  async saveCustomThemes() {
    await browser.storage.local.set({
      customThemes: this.customThemes,
    });
  }

  // 应用主题
  applyTheme(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) return false;

    this.currentTheme = themeId;
    const root = document.documentElement;

    // 设置 CSS 变量
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    this.saveTheme();
    return true;
  }

  // 获取当前主题
  getCurrentTheme() {
    return this.themes.get(this.currentTheme);
  }

  // 获取所有主题
  getAllThemes() {
    return Array.from(this.themes.values());
  }

  // 创建自定义主题
  async createCustomTheme(name, colors) {
    const id = `custom_${Date.now()}`;
    const theme = {
      id,
      name,
      colors,
      isCustom: true,
    };

    this.themes.set(id, theme);
    this.customThemes[id] = theme;
    await this.saveCustomThemes();

    return theme;
  }

  // 删除自定义主题
  async deleteCustomTheme(id) {
    if (!this.customThemes[id]) return false;

    this.themes.delete(id);
    delete this.customThemes[id];

    // 如果当前使用该主题，切换到默认主题
    if (this.currentTheme === id) {
      this.applyTheme("dark");
    }

    await this.saveCustomThemes();
    return true;
  }

  // 导出主题为 CSS
  exportThemeAsCSS(themeId) {
    const theme = this.themes.get(themeId);
    if (!theme) return "";

    let css = `/* ${theme.name} */\n`;
    css += `:root {\n`;

    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  --color-${key}: ${value};\n`;
    });

    css += `}\n`;
    return css;
  }

  // 从 CSS 导入主题
  async importThemeFromCSS(name, css) {
    const colorMatch = css.match(/--color-(\w+):\s*([^;]+);/g);
    if (!colorMatch) {
      throw new Error("无效的 CSS 主题格式");
    }

    const colors = {};
    colorMatch.forEach((match) => {
      const [, key, value] = match.match(/--color-(\w+):\s*([^;]+);/);
      colors[key] = value.trim();
    });

    return this.createCustomTheme(name, colors);
  }
}

// 导出
window.ThemeManager = ThemeManager;
