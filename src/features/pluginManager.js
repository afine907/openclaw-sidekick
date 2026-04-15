/**
 * 插件管理器 - 插件加载、卸载、启用/禁用
 */

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.enabledPlugins = new Set();
  }

  init() {
    this.loadEnabledPlugins();
  }

  async loadEnabledPlugins() {
    try {
      const data = await browser.storage.local.get("enabledPlugins");
      this.enabledPlugins = new Set(data.enabledPlugins || []);
    } catch (e) {
      this.enabledPlugins = new Set();
    }
  }

  async saveEnabledPlugins() {
    await browser.storage.local.set({
      enabledPlugins: Array.from(this.enabledPlugins),
    });
  }

  // 注册插件
  register(plugin) {
    if (!plugin.id || !plugin.name) {
      throw new Error("插件必须包含 id 和 name");
    }

    const pluginData = {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version || "1.0.0",
      description: plugin.description || "",
      author: plugin.author || "",
      hooks: plugin.hooks || {},
      settings: plugin.settings || {},
      enabled: this.enabledPlugins.has(plugin.id),
    };

    this.plugins.set(plugin.id, pluginData);

    // 如果已启用，自动加载
    if (pluginData.enabled) {
      this.enablePlugin(plugin.id);
    }

    return pluginData;
  }

  // 启用插件
  async enablePlugin(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    try {
      // 执行 onLoad 钩子
      if (plugin.hooks.onLoad) {
        await plugin.hooks.onLoad();
      }

      plugin.enabled = true;
      this.enabledPlugins.add(id);
      await this.saveEnabledPlugins();

      // 执行 onEnable 钩子
      if (plugin.hooks.onEnable) {
        await plugin.hooks.onEnable();
      }

      return true;
    } catch (e) {
      console.error(`启用插件 ${id} 失败:`, e);
      return false;
    }
  }

  // 禁用插件
  async disablePlugin(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    try {
      // 执行 onDisable 钩子
      if (plugin.hooks.onDisable) {
        await plugin.hooks.onDisable();
      }

      // 执行 onUnload 钩子
      if (plugin.hooks.onUnload) {
        await plugin.hooks.onUnload();
      }

      plugin.enabled = false;
      this.enabledPlugins.delete(id);
      await this.saveEnabledPlugins();

      return true;
    } catch (e) {
      console.error(`禁用插件 ${id} 失败:`, e);
      return false;
    }
  }

  // 卸载插件
  async uninstallPlugin(id) {
    await this.disablePlugin(id);
    this.plugins.delete(id);
  }

  // 获取所有插件
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  // 获取已启用插件
  getEnabledPlugins() {
    return this.getAllPlugins().filter((p) => p.enabled);
  }

  // 获取单个插件
  getPlugin(id) {
    return this.plugins.get(id);
  }

  // 触发钩子
  async triggerHook(hookName, ...args) {
    const enabledPlugins = this.getEnabledPlugins();

    for (const plugin of enabledPlugins) {
      if (plugin.hooks[hookName]) {
        try {
          await plugin.hooks[hookName](...args);
        } catch (e) {
          console.error(`插件 ${plugin.id} 钩子 ${hookName} 执行失败:`, e);
        }
      }
    }
  }

  // 创建内置插件
  createBuiltinPlugins() {
    // 1. 代码格式化插件
    this.register({
      id: "code-formatter",
      name: "代码格式化",
      description: "自动格式化 AI 返回的代码",
      hooks: {
        onResponse: (response) => {
          // 检测代码块并格式化
          return response.replace(
            /```(\w+)?\n([\s\S]*?)```/g,
            (match, lang, code) => {
              return `\`\`\`${lang || "javascript"}\n${this.formatCode(code, lang)}\n\`\`\``;
            },
          );
        },
      },
    });

    // 2. 翻译插件
    this.register({
      id: "translate",
      name: "智能翻译",
      description: "支持多语言翻译",
      hooks: {
        onCommand: async (command, args) => {
          if (command === "translate") {
            return {
              prompt: `请将以下内容翻译成 ${args.targetLang || "中文"}:\n${args.text}`,
            };
          }
        },
      },
    });

    // 3. 书签插件
    this.register({
      id: "bookmark",
      name: "对话书签",
      description: "标记重要对话",
      hooks: {
        onMessage: (message, role) => {
          // 添加书签功能
          return message;
        },
      },
    });
  }

  // 简单代码格式化
  formatCode(code, language) {
    // 这里可以集成更复杂的格式化逻辑
    // 目前只是简单的缩进整理
    const lines = code.split("\n");
    const formatted = [];
    let indent = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 减少缩进
      if (
        trimmed.startsWith("}") ||
        trimmed.startsWith("]") ||
        trimmed.startsWith(")")
      ) {
        indent = Math.max(0, indent - 1);
      }

      formatted.push("  ".repeat(indent) + trimmed);

      // 增加缩进
      if (
        trimmed.endsWith("{") ||
        trimmed.startsWith("if") ||
        trimmed.startsWith("for") ||
        trimmed.startsWith("while") ||
        trimmed.startsWith("function") ||
        trimmed.startsWith("class") ||
        trimmed.startsWith("async")
      ) {
        indent++;
      }
    }

    return formatted.join("\n");
  }
}

// 导出
window.PluginManager = PluginManager;
