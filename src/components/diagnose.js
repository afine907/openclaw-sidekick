/**
 * 错误诊断工具 - 问题排查和日志查看
 */

class DiagnoseTool {
  constructor() {
    this.logs = [];
    this.maxLogs = 200;
    this.isExpanded = false;
  }

  init(container) {
    this.container = container;
    this.render();
  }

  // 记录日志
  log(level, message, data = null) {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level, // debug, info, warn, error
      message,
      data
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 通知 UI 更新
    this.updateLogDisplay();
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  // 诊断网络连接
  async diagnoseNetwork(apiEndpoint) {
    const results = {
      dns: 'pending',
      connect: 'pending',
      api: 'pending'
    };

    // 1. DNS 解析
    try {
      const url = new URL(apiEndpoint);
      const start = performance.now();
      await fetch(`https://dns.google/resolve?name=${url.hostname}`, {
        method: 'GET',
        cache: 'no-store'
      });
      results.dns = `${(performance.now() - start).toFixed(0)}ms`;
    } catch (e) {
      results.dns = '失败: ' + e.message;
    }

    // 2. TCP 连接
    try {
      const start = performance.now();
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);

      await fetch(apiEndpoint, {
        method: 'HEAD',
        signal: controller.signal
      });
      results.connect = `${(performance.now() - start).toFixed(0)}ms`;
    } catch (e) {
      results.connect = '失败: ' + e.message;
    }

    // 3. API 响应
    try {
      const start = performance.now();
      const response = await fetch(`${apiEndpoint}/v1/models`, {
        method: 'GET',
        cache: 'no-store'
      });
      results.api = response.ok ? `OK (${response.status}) - ${(performance.now() - start).toFixed(0)}ms` : `HTTP ${response.status}`;
    } catch (e) {
      results.api = '失败: ' + e.message;
    }

    return results;
  }

  // 诊断存储
  async diagnoseStorage() {
    const results = {
      storage: 'unknown',
      quota: 'unknown',
      usage: 'unknown'
    };

    try {
      // 检查存储权限
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        results.storage = '可用';
        results.quota = (estimate.quota / 1024 / 1024).toFixed(2) + ' MB';
        results.usage = (estimate.usage / 1024 / 1024).toFixed(2) + ' MB';
      } else {
        results.storage = '不支持';
      }
    } catch (e) {
      results.storage = '错误: ' + e.message;
    }

    return results;
  }

  // 诊断浏览器环境
  diagnoseEnvironment() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      onLine: navigator.onLine,
      cookiesEnabled: navigator.cookieEnabled,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth
    };
  }

  // 生成诊断报告
  generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      logs: this.logs.slice(-50), // 最近 50 条
      environment: this.diagnoseEnvironment()
    };

    return report;
  }

  // 导出日志
  exportLogs(format = 'json') {
    const data = this.generateReport();

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'text':
        let text = `OpenClaw Sidekick 诊断报告\n`;
        text += `生成时间: ${data.generatedAt}\n`;
        text += `\n=== 环境信息 ===\n`;
        Object.entries(data.environment).forEach(([k, v]) => {
          text += `${k}: ${v}\n`;
        });
        text += `\n=== 最近日志 ===\n`;
        data.logs.forEach(log => {
          text += `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}\n`;
        });
        return text;
      default:
        return JSON.stringify(data);
    }
  }

  // 清空日志
  clearLogs() {
    this.logs = [];
    this.updateLogDisplay();
  }

  // 渲染 UI
  render() {
    const html = `
      <div class="diagnose-panel">
        <div class="diagnose-header">
          <h3>🔧 诊断工具</h3>
          <div class="diagnose-actions">
            <button class="diagnose-btn" id="diagnose-run">运行诊断</button>
            <button class="diagnose-btn" id="diagnose-export">导出日志</button>
            <button class="diagnose-btn" id="diagnose-clear">清空</button>
            <button class="diagnose-btn diagnose-btn-toggle" id="diagnose-toggle">
              ${this.isExpanded ? '收起' : '展开'}
            </button>
          </div>
        </div>

        <div class="diagnose-results" id="diagnose-results">
          <div class="diagnose-empty">点击"运行诊断"开始排查问题</div>
        </div>

        <div class="diagnose-logs ${this.isExpanded ? 'expanded' : ''}" id="diagnose-logs">
          <div class="logs-header">
            <span>日志记录</span>
            <span class="logs-count">${this.logs.length} 条</span>
          </div>
          <div class="logs-content" id="logs-content"></div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // 绑定事件
    document.getElementById('diagnose-run')?.addEventListener('click', () => this.runDiagnose());
    document.getElementById('diagnose-export')?.addEventListener('click', () => this.exportAndDownload());
    document.getElementById('diagnose-clear')?.addEventListener('click', () => this.clearLogs());
    document.getElementById('diagnose-toggle')?.addEventListener('click', () => this.toggleExpand());
  }

  async runDiagnose() {
    const resultsEl = document.getElementById('diagnose-results');
    resultsEl.innerHTML = '<div class="diagnose-loading">诊断中...</div>';

    this.info('开始诊断...');

    try {
      // 获取设置
      const data = await browser.storage.local.get('settings');
      const apiEndpoint = data.settings?.apiEndpoint || 'http://localhost:4000';

      // 网络诊断
      this.info('诊断网络连接...');
      const networkResults = await this.diagnoseNetwork(apiEndpoint);

      // 存储诊断
      this.info('诊断存储空间...');
      const storageResults = await this.diagnoseStorage();

      // 环境信息
      this.info('收集环境信息...');
      const envResults = this.diagnoseEnvironment();

      // 显示结果
      let html = `
        <div class="diagnose-section">
          <h4>🌐 网络连接</h4>
          <table class="diagnose-table">
            <tr><td>DNS 解析</td><td class="${networkResults.dns.includes('失败') ? 'error' : 'success'}">${networkResults.dns}</td></tr>
            <tr><td>TCP 连接</td><td class="${networkResults.connect.includes('失败') ? 'error' : 'success'}">${networkResults.connect}</td></tr>
            <tr><td>API 响应</td><td class="${networkResults.api.includes('失败') ? 'error' : 'success'}">${networkResults.api}</td></tr>
          </table>
        </div>

        <div class="diagnose-section">
          <h4>💾 存储空间</h4>
          <table class="diagnose-table">
            <tr><td>存储状态</td><td>${storageResults.storage}</td></tr>
            <tr><td>配额</td><td>${storageResults.quota}</td></tr>
            <tr><td>已使用</td><td>${storageResults.usage}</td></tr>
          </table>
        </div>

        <div class="diagnose-section">
          <h4>🖥️ 浏览器环境</h4>
          <table class="diagnose-table">
            <tr><td>在线状态</td><td class="${envResults.onLine ? 'success' : 'error'}">${envResults.onLine ? '在线' : '离线'}</td></tr>
            <tr><td>语言</td><td>${envResults.language}</td></tr>
            <tr><td>平台</td><td>${envResults.platform}</td></tr>
          </table>
        </div>
      `;

      resultsEl.innerHTML = html;
      this.info('诊断完成');
    } catch (e) {
      this.error('诊断失败: ' + e.message);
      resultsEl.innerHTML = `<div class="diagnose-error">诊断失败: ${e.message}</div>`;
    }
  }

  exportAndDownload() {
    const content = this.exportLogs('text');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-diagnose-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    this.info('日志已导出');
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    const logsEl = document.getElementById('diagnose-logs');
    const toggleBtn = document.getElementById('diagnose-toggle');
    logsEl?.classList.toggle('expanded', this.isExpanded);
    toggleBtn.textContent = this.isExpanded ? '收起' : '展开';
  }

  updateLogDisplay() {
    const contentEl = document.getElementById('logs-content');
    const countEl = document.querySelector('.logs-count');
    if (!contentEl) return;

    if (countEl) {
      countEl.textContent = `${this.logs.length} 条`;
    }

    contentEl.innerHTML = this.logs.slice(-20).reverse().map(log => `
      <div class="log-item log-${log.level}">
        <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="log-level">${log.level}</span>
        <span class="log-message">${log.message}</span>
      </div>
    `).join('');
  }
}

// 导出
window.DiagnoseTool = DiagnoseTool;