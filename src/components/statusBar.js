/**
 * 状态指示器 - 显示连接状态和错误信息
 */

class StatusIndicator {
  constructor() {
    this.status = "disconnected"; // disconnected, connecting, connected, error
    this.message = "";
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  init(container) {
    this.container = container;
    this.render();
    this.startHeartbeat();
  }

  render() {
    const statusIcon = {
      disconnected: "⚫",
      connecting: "🟡",
      connected: "🟢",
      error: "🔴",
    };

    const statusText = {
      disconnected: "未连接",
      connecting: "连接中...",
      connected: "已连接",
      error: "连接错误",
    };

    const html = `
      <div class="status-indicator" id="status-indicator">
        <div class="status-icon">${statusIcon[this.status]}</div>
        <div class="status-info">
          <div class="status-text">${statusText[this.status]}</div>
          <div class="status-message">${this.message}</div>
        </div>
        <button class="status-retry" id="status-retry" title="重试连接" ${this.status !== "error" ? "hidden" : ""}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>
    `;

    this.container.innerHTML = html;

    // 绑定重试按钮
    document.getElementById("status-retry")?.addEventListener("click", () => {
      this.retry();
    });
  }

  setStatus(status, message = "") {
    this.status = status;
    this.message = message;
    this.render();

    // 自动重试
    if (status === "error" && this.retryCount < this.maxRetries) {
      setTimeout(() => this.retry(), 2000);
    }
  }

  async checkConnection(apiEndpoint) {
    this.setStatus("connecting");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiEndpoint}/v1/models`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        this.setStatus("connected", "服务正常");
        this.retryCount = 0;
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.setStatus("error", error.message || "连接失败");
      return false;
    }
  }

  async retry() {
    this.retryCount++;
    const settings = (await window.Storage?.get("settings")) || {};
    const endpoint = settings.apiEndpoint || "http://localhost:4000";
    await this.checkConnection(endpoint);
  }

  startHeartbeat() {
    // 每 30 秒检查一次连接
    setInterval(async () => {
      const settings = (await window.Storage?.get("settings")) || {};
      const endpoint = settings.apiEndpoint || "http://localhost:4000";
      if (this.status === "connected") {
        await this.checkConnection(endpoint);
      }
    }, 30000);
  }
}

// 导出
window.StatusIndicator = StatusIndicator;
