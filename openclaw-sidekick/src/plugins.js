/**
 * OpenClaw Sidekick - 插件系统
 * 支持扩展功能的插件架构
 */

// 插件管理器
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.loading = false;
  }

  // 注册插件
  register(plugin) {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} already registered`);
      return false;
    }

    this.plugins.set(plugin.id, plugin);
    console.log(`Registered plugin: ${plugin.id}`);
    return true;
  }

  // 卸载插件
  unregister(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin && plugin.onUnload) {
      plugin.onUnload();
    }
    this.plugins.delete(pluginId);
    console.log(`Unregistered plugin: ${pluginId}`);
  }

  // 获取插件
  get(pluginId) {
    return this.plugins.get(pluginId);
  }

  // 列出所有插件
  list() {
    return Array.from(this.plugins.values()).map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      enabled: p.enabled
    }));
  }

  // 启用插件
  async enable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    if (plugin.onEnable) {
      await plugin.onEnable();
    }
    plugin.enabled = true;
    return true;
  }

  // 禁用插件
  async disable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    if (plugin.onDisable) {
      await plugin.onDisable();
    }
    plugin.enabled = false;
    return true;
  }

  // 注册钩子
  registerHook(event, handler) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push(handler);
  }

  // 触发钩子
  async triggerHook(event, ...args) {
    const handlers = this.hooks.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(...args);
      } catch (e) {
        console.error(`Hook error (${event}):`, e);
      }
    }
  }
}

// 基础插件类
class Plugin {
  constructor(id, name, version) {
    this.id = id;
    this.name = name;
    this.version = version;
    this.enabled = false;
    this.settings = {};
  }

  async onLoad() {}
  async onUnload() {}
  async onEnable() {}
  async onDisable() {}
  async onMessage(message) {}
  async onSendMessage(text) {}
}

// 示例插件：翻译功能
class TranslationPlugin extends Plugin {
  constructor() {
    super('translation', '翻译助手', '1.0.0');
    this.languages = ['en', 'zh', 'ja', 'ko', 'es', 'fr'];
  }

  async onLoad() {
    console.log('Translation plugin loaded');
    this.registerCommands();
  }

  registerCommands() {
    this.commands = {
      '/translate': this.handleTranslate.bind(this),
      '/detect': this.handleDetect.bind(this)
    };
  }

  async handleTranslate(text, targetLang = 'en') {
    // 简单的翻译模拟
    const translations = {
      'en': text,
      'zh': `[ZH] ${text}`,
      'ja': `[JA] ${text}`,
      'ko': `[KO] ${text}`,
      'es': `[ES] ${text}`,
      'fr': `[FR] ${text}`
    };
    return translations[targetLang] || text;
  }

  async handleDetect(text) {
    // 简单的语言检测
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    return 'en';
  }

  async onMessage(message) {
    // 处理消息
    return null;
  }
}

// 示例插件：代码格式化
class CodeFormatterPlugin extends Plugin {
  constructor() {
    super('code-formatter', '代码格式化', '1.0.0');
  }

  async onLoad() {
    console.log('Code formatter plugin loaded');
  }

  format(code, language) {
    const formatters = {
      'javascript': this.formatJS.bind(this),
      'python': this.formatPython.bind(this),
      'html': this.formatHTML.bind(this),
      'css': this.formatCSS.bind(this),
      'json': this.formatJSON.bind(this)
    };

    const formatter = formatters[language] || formatters['javascript'];
    return formatter(code);
  }

  formatJS(code) {
    // 简单的格式化
    try {
      // 使用 Function 构造函数进行基本的格式化
      const fn = new Function(code);
      // 返回格式化后的代码
      return code
        .replace(/;\s*/g, ';\n')
        .replace(/{\s*/g, ' {\n')
        .replace(/}\s*/g, '\n}\n');
    } catch (e) {
      return code;
    }
  }

  formatPython(code) {
    return code
      .replace(/:\s*/g, ':\n')
      .replace(/\n\n+/g, '\n\n');
  }

  formatHTML(code) {
    let indent = 0;
    return code
      .replace(/(<[^>]+>)/g, '\n$1\n')
      .replace(/\n\s+/g, '\n')
      .replace(/>\s+</g, '>\n<');
  }

  formatCSS(code) {
    return code
      .replace(/\s*{\s*/g, ' {\n  ')
      .replace(/\s*}\s*/g, '\n}\n\n')
      .replace(/;\s*/g, ';\n  ');
  }

  formatJSON(code) {
    try {
      return JSON.stringify(JSON.parse(code), null, 2);
    } catch (e) {
      return code;
    }
  }
}

// 示例插件：快捷回复
class QuickReplyPlugin extends Plugin {
  constructor() {
    super('quick-reply', '快捷回复', '1.0.0');
    this.replies = new Map();
    this.loadDefaultReplies();
  }

  loadDefaultReplies() {
    this.replies.set('hello', '你好！有什么可以帮助你的吗？');
    this.replies.set('help', '我可以帮你：\n1. 翻译文字\n2. 格式化代码\n3. 快速回复\n输入 /help 查看更多');
    this.replies.set('thanks', '不客气！很高兴能帮到你。');
    this.replies.set('bye', '再见！有需要随时叫我。');
  }

  addReply(keyword, response) {
    this.replies.set(keyword.toLowerCase(), response);
  }

  removeReply(keyword) {
    this.replies.delete(keyword.toLowerCase());
  }

  findReply(text) {
    const lower = text.toLowerCase();
    for (const [keyword, response] of this.replies) {
      if (lower.includes(keyword)) {
        return response;
      }
    }
    return null;
  }

  async onMessage(message) {
    const reply = this.findReply(message.content);
    if (reply) {
      return { role: 'assistant', content: reply };
    }
    return null;
  }
}

// 示例插件：提醒功能
class ReminderPlugin extends Plugin {
  constructor() {
    super('reminder', '提醒助手', '1.0.0');
    this.reminders = [];
  }

  addReminder(time, message) {
    const reminder = {
      id: Date.now(),
      time: new Date(time),
      message,
      triggered: false
    };
    this.reminders.push(reminder);
    this.scheduleReminder(reminder);
    return reminder.id;
  }

  scheduleReminder(reminder) {
    const delay = reminder.time - new Date();
    if (delay > 0) {
      setTimeout(() => {
        this.triggerReminder(reminder);
      }, delay);
    }
  }

  triggerReminder(reminder) {
    if (!reminder.triggered) {
      reminder.triggered = true;
      // 触发通知
      this.onReminderTriggered(reminder);
    }
  }

  onReminderTriggered(reminder) {
    console.log(`Reminder: ${reminder.message}`);
    // 可以通过钩子触发通知
  }

  listReminders() {
    return this.reminders.filter(r => !r.triggered);
  }

  cancelReminder(id) {
    const index = this.reminders.findIndex(r => r.id === id);
    if (index !== -1) {
      this.reminders.splice(index, 1);
      return true;
    }
    return false;
  }
}

// 示例插件：语音合成
class TTSPlugin extends Plugin {
  constructor() {
    super('tts', '语音合成', '1.0.0');
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.loadVoices();
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
    if (this.voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }
  }

  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置选项
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      // 选择语音
      if (options.voice) {
        const voice = this.voices.find(v => v.name === options.voice);
        if (voice) utterance.voice = voice;
      } else {
        // 默认选择中文语音
        const chineseVoice = this.voices.find(v => v.lang.includes('zh'));
        if (chineseVoice) utterance.voice = chineseVoice;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      
      this.synth.speak(utterance);
    });
  }

  stop() {
    this.synth.cancel();
  }

  pause() {
    this.synth.pause();
  }

  resume() {
    this.synth.resume();
  }

  getVoices() {
    return this.voices.map(v => ({
      name: v.name,
      lang: v.lang,
      localService: v.localService
    }));
  }
}

// 全局插件管理器实例
const pluginManager = new PluginManager();

// 注册内置插件
const translationPlugin = new TranslationPlugin();
const codeFormatterPlugin = new CodeFormatterPlugin();
const quickReplyPlugin = new QuickReplyPlugin();
const reminderPlugin = new ReminderPlugin();
const ttsPlugin = new TTSPlugin();

pluginManager.register(translationPlugin);
pluginManager.register(codeFormatterPlugin);
pluginManager.register(quickReplyPlugin);
pluginManager.register(reminderPlugin);
pluginManager.register(ttsPlugin);

// 导出
window.PluginManager = PluginManager;
window.Plugin = Plugin;
window.pluginManager = pluginManager;