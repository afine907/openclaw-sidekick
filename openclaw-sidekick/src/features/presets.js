/**
 * 预设提示词管理
 */

class PresetManager {
  constructor() {
    this.presets = [];
    this.activePreset = null;
  }

  init() {
    this.loadPresets();
    this.registerDefaultPresets();
  }

  async loadPresets() {
    try {
      const data = await browser.storage.local.get('presets');
      this.presets = data.presets || [];
    } catch (e) {
      this.presets = [];
    }
  }

  async savePresets() {
    await browser.storage.local.set({ presets: this.presets });
  }

  registerDefaultPresets() {
    const defaults = [
      {
        id: 'explain',
        name: '📖 解释代码',
        description: '解释选中的代码',
        prompt: '请详细解释以下代码的功能、原理和实现方式。如果有不清楚的地方，请指出。\n\n```\n{selection}\n```\n\n请用通俗易懂的语言解释。'
      },
      {
        id: 'refactor',
        name: '🔧 重构代码',
        description: '优化和重构选中的代码',
        prompt: '请重构以下代码，使其更加：\n1. 可读性更强\n2. 性能更好\n3. 符合最佳实践\n\n原始代码：\n```\n{selection}\n```\n\n请提供重构后的代码，并解释改动原因。'
      },
      {
        id: 'review',
        name: '👀 代码审查',
        description: '审查代码并提出改进建议',
        prompt: '请对以下代码进行全面审查，包括：\n1. 潜在 bug\n2. 安全问题\n3. 性能问题\n4. 代码风格\n5. 改进建议\n\n代码：\n```\n{selection}\n```'
      },
      {
        id: 'test',
        name: '🧪 生成测试',
        description: '为代码生成单元测试',
        prompt: '请为以下代码生成完整的单元测试：\n1. 覆盖主要场景\n2. 包含边界情况\n3. 使用合适的测试框架\n\n代码：\n```\n{selection}\n```\n\n请只提供测试代码。'
      },
      {
        id: 'document',
        name: '📝 生成文档',
        description: '为代码生成文档注释',
        prompt: '请为以下代码生成详细的文档注释（JSDoc/文档字符串格式）：\n\n代码：\n```\n{selection}\n```'
      },
      {
        id: 'debug',
        name: '🐛 调试分析',
        description: '分析代码中的 bug',
        prompt: '请分析以下代码中的潜在 bug 和问题：\n1. 逻辑错误\n2. 边界条件\n3. 竞态条件\n4. 内存泄漏\n\n代码：\n```\n{selection}\n```'
      },
      {
        id: 'translate',
        name: '🌐 翻译代码',
        description: '将代码翻译成另一种语言',
        prompt: '请将以下代码翻译成 Python（保持相同的功能和逻辑）：\n\n代码：\n```\n{selection}\n```'
      },
      {
        id: 'summarize',
        name: '📋 总结内容',
        description: '总结选中的内容',
        prompt: '请用简洁的语言总结以下内容（不超过 100 字）：\n\n{selection}'
      },
      {
        id: 'improve',
        name: '✨ 改进建议',
        description: '提供改进建议',
        prompt: '请分析以下内容，并提供具体的改进建议：\n\n{selection}'
      },
      {
        id: 'compare',
        name: '⚖️ 对比分析',
        description: '对比分析两种方案',
        prompt: '请对比分析以下两种方案（如果提供了两种）：\n\n{selection}\n\n从性能、可维护性、可扩展性等角度进行分析。'
      }
    ];

    // 只添加不存在的
    defaults.forEach(preset => {
      if (!this.presets.find(p => p.id === preset.id)) {
        this.presets.push(preset);
      }
    });

    this.savePresets();
  }

  // 获取预设
  getPreset(id) {
    return this.presets.find(p => p.id === id);
  }

  // 获取所有预设
  getAllPresets() {
    return this.presets;
  }

  // 添加预设
  async addPreset(preset) {
    const newPreset = {
      id: preset.id || `custom_${Date.now()}`,
      ...preset,
      createdAt: Date.now()
    };
    this.presets.push(newPreset);
    await this.savePresets();
    return newPreset;
  }

  // 更新预设
  async updatePreset(id, updates) {
    const index = this.presets.findIndex(p => p.id === id);
    if (index !== -1) {
      this.presets[index] = { ...this.presets[index], ...updates, updatedAt: Date.now() };
      await this.savePresets();
      return this.presets[index];
    }
    return null;
  }

  // 删除预设
  async deletePreset(id) {
    const index = this.presets.findIndex(p => p.id === id);
    if (index !== -1) {
      this.presets.splice(index, 1);
      await this.savePresets();
      return true;
    }
    return false;
  }

  // 应用预设到选中文本
  applyPreset(presetId, selection) {
    const preset = this.getPreset(presetId);
    if (!preset) return selection;

    return preset.prompt.replace(/{selection}/g, selection);
  }
}

// 导出
window.PresetManager = PresetManager;