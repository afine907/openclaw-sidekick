/**
 * Theme Definitions - 主题定义
 * 预定义的主题颜色配置
 */

/**
 * 内置主题定义
 * @typedef {Object} Theme
 * @property {string} name - 主题显示名称
 * @property {Object} colors - 颜色配置
 * @property {string} colors.background - 主背景色
 * @property {string} colors.backgroundSecondary - 次级背景色
 * @property {string} colors.backgroundTertiary - 三级背景色
 * @property {string} colors.text - 主文字色
 * @property {string} colors.textSecondary - 次级文字色
 * @property {string} colors.accent - 强调色
 * @property {string} colors.accentLight - 浅强调色
 * @property {string} colors.border - 边框色
 * @property {string} colors.success - 成功色
 * @property {string} colors.warning - 警告色
 * @property {string} colors.error - 错误色
 * @property {string} colors.info - 信息色
 */

/** @type {Object<string, Theme>} */
const Themes = {
  // 深色主题（默认）
  dark: {
    name: "深色",
    colors: {
      background: "#1a1a2e",
      backgroundSecondary: "#16213e",
      backgroundTertiary: "#0f3460",
      text: "#eee",
      textSecondary: "#888",
      accent: "#e94560",
      accentLight: "#ff6b8a",
      border: "#0f3460",
      success: "#4ade80",
      warning: "#fbbf24",
      error: "#ef4444",
      info: "#60a5fa",
    },
  },

  // 浅色主题
  light: {
    name: "浅色",
    colors: {
      background: "#ffffff",
      backgroundSecondary: "#f3f4f6",
      backgroundTertiary: "#e5e7eb",
      text: "#1f2937",
      textSecondary: "#6b7280",
      accent: "#e94560",
      accentLight: "#ff6b8a",
      border: "#e5e7eb",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },

  // 赛博朋克主题
  cyberpunk: {
    name: "赛博朋克",
    colors: {
      background: "#0d0d0d",
      backgroundSecondary: "#1a1a2e",
      backgroundTertiary: "#16213e",
      text: "#00ff41",
      textSecondary: "#008f11",
      accent: "#ff00ff",
      accentLight: "#00ffff",
      border: "#ff00ff",
      success: "#00ff41",
      warning: "#ffff00",
      error: "#ff0000",
      info: "#00ffff",
    },
  },

  // 海洋主题
  ocean: {
    name: "海洋",
    colors: {
      background: "#0a192f",
      backgroundSecondary: "#112240",
      backgroundTertiary: "#233554",
      text: "#ccd6f6",
      textSecondary: "#8892b0",
      accent: "#64ffda",
      accentLight: "#a8ffea",
      border: "#233554",
      success: "#64ffda",
      warning: "#ffd700",
      error: "#ff6b6b",
      info: "#64ffda",
    },
  },

  // 柔和主题
  pastel: {
    name: "柔和",
    colors: {
      background: "#1e1e2e",
      backgroundSecondary: "#2d2d44",
      backgroundTertiary: "#3d3d5c",
      text: "#e0e0e0",
      textSecondary: "#a0a0a0",
      accent: "#c792ea",
      accentLight: "#e0c0ff",
      border: "#3d3d5c",
      success: "#c3e88d",
      warning: "#ffcb6b",
      error: "#ff5370",
      info: "#82aaff",
    },
  },
};

// 导出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Themes };
}
