/**
 * 日志查看器 - 实时查看扩展运行日志
 */

class LogViewer {
  constructor() {
    this.logs = [];
    this.filter = 'all';
    this.maxDisplay = 100;
    this.autoScroll = true;
  }

  init(container) {
    this.container = container;
    this.subscribeToLogs();
    this.render();
  }

  // 订阅日志事件
  subscribeToLogs() {
    // 从 DiagnoseTool 获取日志
    if (window.diagnoseTool) {
      const originalLog = window.diagnoseTool.log.bind(window.diagnoseTool);
      window.diagnoseTool.log = (level, message, data) => {
        originalLog(level, message, data);
        this.addLog({ level, message, data, timestamp: Date.now() });
      };
    }
  }

  // 添加日志
  addLog(entry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxDisplay) {
      this.logs = this.logs.slice(-this.maxDisplay);
    }
    this.updateDisplay();
  }

  // 设置过滤器
  setFilter(filter) {
    this.filter = filter;
    this.updateDisplay();
  }

  // 清空日志
  clear() {
    this.logs = [];
    this.updateDisplay();
  }

  // 导出日志
  export() {
    const filtered = this.getFilteredLogs();
    const content = filtered.map(log =>
      `[${new Date(log.timestamp).toISOString()}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-logs-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  getFilteredLogs() {
    if (this.filter === 'all') return this.logs;
    return this.logs.filter(log => log.level === this.filter);
  }

  updateDisplay() {
    const contentEl = document.getElementById('log-viewer-content');
    if (!contentEl) return;

    const logs = this.getFilteredLogs();
    contentEl.innerHTML = logs.map(log => `
      <div class="log-entry log-${log.level}">
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="log-level">${log.level}</span>
        <span class="log-message">${this.escapeHtml(log.message)}</span>
      </div>
    `).join('');

    // 自动滚动到底部
    if (this.autoScroll) {
      contentEl.scrollTop = contentEl.scrollHeight;
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  render() {
    const html = `
      <div class="log-viewer">
        <div class="log-viewer-header">
          <h4>📋 日志查看器</h4>
          <div class="log-viewer-filters">
            <button class="log-filter-btn ${this.filter === 'all' ? 'active' : ''}" data-filter="all">全部</button>
            <button class="log-filter-btn ${this.filter === 'debug' ? 'active' : ''}" data-filter="debug">调试</button>
            <button class="log-filter-btn ${this.filter === 'info' ? 'active' : ''}" data-filter="info">信息</button>
            <button class="log-filter-btn ${this.filter === 'warn' ? 'active' : ''}" data-filter="warn">警告</button>
            <button class="log-filter-btn ${this.filter === 'error' ? 'active' : ''}" data-filter="error">错误</button>
          </div>
          <div class="log-viewer-actions">
            <label class="log-auto-scroll">
              <input type="checkbox" checked="${this.autoScroll}" />
              自动滚动
            </label>
            <button class="log-action-btn" id="log-export">导出</button>
            <button class="log-action-btn" id="log-clear">清空</button>
          </div>
        </div>
        <div class="log-viewer-content" id="log-viewer-content">
          <div class="log-empty">暂无日志</div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // 绑定事件
    document.querySelectorAll('.log-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setFilter(btn.dataset.filter);
        document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('log-export')?.addEventListener('click', () => this.export());
    document.getElementById('log-clear')?.addEventListener('click', () => this.clear());

    document.querySelector('.log-auto-scroll input')?.addEventListener('change', (e) => {
      this.autoScroll = e.target.checked;
    });
  }
}

// 导出
window.LogViewer = LogViewer;