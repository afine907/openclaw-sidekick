/**
 * 对话历史管理 - 搜索、标记、导出
 */

class HistoryManager {
  constructor() {
    this.history = [];
    this.maxHistory = 100;
  }

  async init() {
    await this.loadHistory();
  }

  async loadHistory() {
    try {
      const data = await browser.storage.local.get("history");
      this.history = data.history || [];
    } catch (e) {
      this.history = [];
    }
  }

  async saveHistory() {
    // 限制历史数量
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
    await browser.storage.local.set({ history: this.history });
  }

  // 添加消息到历史
  async addMessage(message) {
    const entry = {
      id: `msg_${Date.now()}`,
      timestamp: Date.now(),
      role: message.role,
      content: message.content,
      marked: false,
      tags: [],
    };
    this.history.push(entry);
    await this.saveHistory();
    return entry;
  }

  // 搜索历史
  search(query) {
    if (!query) return this.history.slice(-20).reverse();

    const lowerQuery = query.toLowerCase();
    return this.history
      .filter((entry) => entry.content.toLowerCase().includes(lowerQuery))
      .reverse()
      .slice(0, 50);
  }

  // 标记/取消标记消息
  async toggleMark(id) {
    const entry = this.history.find((h) => h.id === id);
    if (entry) {
      entry.marked = !entry.marked;
      await this.saveHistory();
      return entry.marked;
    }
    return false;
  }

  // 添加标签
  async addTag(id, tag) {
    const entry = this.history.find((h) => h.id === id);
    if (entry && !entry.tags.includes(tag)) {
      entry.tags.push(tag);
      await this.saveHistory();
    }
  }

  // 获取标记的消息
  getMarked() {
    return this.history.filter((h) => h.marked).reverse();
  }

  // 按日期分组
  getGroupedByDate() {
    const groups = {};
    this.history.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString("zh-CN");
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  }

  // 导出对话
  export(format = "json") {
    const data = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      count: this.history.length,
      messages: this.history,
    };

    switch (format) {
      case "json":
        return JSON.stringify(data, null, 2);

      case "markdown":
        return this.toMarkdown(data);

      case "txt":
        return this.toText(data);

      default:
        return JSON.stringify(data);
    }
  }

  toMarkdown(data) {
    let md = `# OpenClaw 对话历史\n\n`;
    md += `导出时间: ${data.exportedAt}\n`;
    md += `消息数量: ${data.count}\n\n---\n\n`;

    let currentDate = "";
    data.messages.forEach((msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString("zh-CN");
      if (date !== currentDate) {
        currentDate = date;
        md += `## ${date}\n\n`;
      }

      const time = new Date(msg.timestamp).toLocaleTimeString("zh-CN");
      const role = msg.role === "user" ? "👤 用户" : "🤖 AI";
      md += `### ${role} - ${time}\n\n`;
      md += `${msg.content}\n\n`;
    });

    return md;
  }

  toText(data) {
    let text = `OpenClaw 对话历史\n${"=".repeat(30)}\n\n`;

    let currentDate = "";
    data.messages.forEach((msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString("zh-CN");
      if (date !== currentDate) {
        currentDate = date;
        text += `\n${date}\n${"-".repeat(30)}\n`;
      }

      const time = new Date(msg.timestamp).toLocaleTimeString("zh-CN");
      const role = msg.role === "user" ? "用户" : "AI";
      text += `[${role} ${time}]\n${msg.content}\n\n`;
    });

    return text;
  }

  // 清理历史
  async clearHistory() {
    this.history = [];
    await this.saveHistory();
  }
}

// 导出
window.HistoryManager = HistoryManager;
