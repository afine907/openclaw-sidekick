/**
 * OpenClaw Sidekick - 主题系统模块
 *
 * 模块化后的主题系统，包含以下子模块：
 * - definitions.js - 主题定义
 * - ThemeManager.js - 主题管理器
 * - AnimationManager.js - 动画效果
 * - NotificationSystem.js - 通知系统
 * - KeyboardManager.js - 快捷键管理
 * - ThemeSwitcher.js - 主题切换 UI
 *
 * @module themes
 */

// 导入所有子模块（用于模块化）
import { Themes } from "./definitions.js";
import { ThemeManager } from "./ThemeManager.js";
import { AnimationManager } from "./AnimationManager.js";
import { NotificationSystem } from "./NotificationSystem.js";
import { KeyboardManager } from "./KeyboardManager.js";
import { ThemeSwitcher } from "./ThemeSwitcher.js";

// 导出所有模块
export {
  Themes,
  ThemeManager,
  AnimationManager,
  NotificationSystem,
  KeyboardManager,
  ThemeSwitcher,
};

// 为了向后兼容，将类挂载到 window 对象
// 这样原来直接引用全局变量的代码仍然可以工作
if (typeof window !== "undefined") {
  window.Themes = Themes;
  window.ThemeManager = ThemeManager;
  window.AnimationManager = AnimationManager;
  window.NotificationSystem = NotificationSystem;
  window.KeyboardManager = KeyboardManager;
  window.ThemeSwitcher = ThemeSwitcher;
}
