/**
 * 网络调试工具 - 调试 API 请求和响应
 */

class NetworkDebugger {
  constructor() {
    this.requests = [];
    this.isRecording = false;
    this.maxRequests = 50;
  }

  init() {
    this.isRecording = true;
    this.interceptFetch();
  }

  // 拦截 fetch 请求
  interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const url = typeof args[0] === "string" ? args[0] : args[0].url;
      const options = args[1] || {};

      const requestEntry = {
        id: requestId,
        url,
        method: options.method || "GET",
        headers: options.headers || {},
        body: options.body,
        startTime: Date.now(),
        status: "pending",
      };

      self.recordRequest(requestEntry);

      try {
        const response = await originalFetch.apply(this, args);
        const clonedResponse = response.clone();

        // 记录响应
        clonedResponse.text().then((text) => {
          self.recordResponse(requestId, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: text,
            duration: Date.now() - requestEntry.startTime,
          });
        });

        return response;
      } catch (error) {
        self.recordResponse(requestId, {
          status: 0,
          statusText: error.message,
          error: true,
          duration: Date.now() - requestEntry.startTime,
        });
        throw error;
      }
    };
  }

  recordRequest(request) {
    this.requests.unshift(request);
    if (this.requests.length > this.maxRequests) {
      this.requests.pop();
    }
    this.notifyUpdate();
  }

  recordResponse(requestId, response) {
    const request = this.requests.find((r) => r.id === requestId);
    if (request) {
      Object.assign(request, response);
      this.notifyUpdate();
    }
  }

  notifyUpdate() {
    window.dispatchEvent(
      new CustomEvent("network:update", {
        detail: this.requests,
      }),
    );
  }

  // 清空记录
  clear() {
    this.requests = [];
    this.notifyUpdate();
  }

  // 获取请求详情
  getRequest(id) {
    return this.requests.find((r) => r.id === id);
  }

  // 重新发送请求
  async replayRequest(id) {
    const request = this.getRequest(id);
    if (!request) return null;

    const options = {
      method: request.method,
      headers: request.headers,
    };

    if (request.body) {
      options.body = request.body;
    }

    return fetch(request.url, options);
  }

  // 导出请求记录
  export() {
    return JSON.stringify(this.requests, null, 2);
  }

  // 生成 cURL 命令
  toCurl(request) {
    let curl = `curl -X ${request.method} '${request.url}'`;

    if (request.headers) {
      Object.entries(request.headers).forEach(([key, value]) => {
        curl += ` \\\n  -H '${key}: ${value}'`;
      });
    }

    if (request.body) {
      curl += ` \\\n  -d '${request.body}'`;
    }

    return curl;
  }

  // 创建 UI
  createUI() {
    return `
      <div class="network-debugger">
        <div class="network-debugger-header">
          <h4>🌐 网络调试</h4>
          <div class="network-debugger-actions">
            <button class="debug-btn" id="network-clear">清空</button>
            <button class="debug-btn" id="network-export">导出</button>
          </div>
        </div>
        <div class="network-requests" id="network-requests">
          <div class="network-empty">暂无请求记录</div>
        </div>
      </div>
    `;
  }

  // 渲染请求列表
  renderRequests() {
    const container = document.getElementById("network-requests");
    if (!container) return;

    if (this.requests.length === 0) {
      container.innerHTML = '<div class="network-empty">暂无请求记录</div>';
      return;
    }

    container.innerHTML = this.requests
      .map((req) => {
        const statusClass =
          req.status >= 200 && req.status < 300
            ? "success"
            : req.status >= 400
              ? "error"
              : "pending";
        const duration = req.duration ? `${req.duration}ms` : "...";

        return `
        <div class="network-request" data-id="${req.id}">
          <div class="request-row">
            <span class="request-method ${req.method.toLowerCase()}">${req.method}</span>
            <span class="request-url">${this.truncateUrl(req.url)}</span>
            <span class="request-status ${statusClass}">${req.status || "pending"}</span>
            <span class="request-duration">${duration}</span>
          </div>
        </div>
      `;
      })
      .join("");

    // 绑定点击事件
    container.querySelectorAll(".network-request").forEach((el) => {
      el.addEventListener("click", () => this.showRequestDetail(el.dataset.id));
    });
  }

  truncateUrl(url) {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname + parsed.search;
      return path.length > 40 ? path.slice(0, 40) + "..." : path;
    } catch {
      return url.slice(0, 40);
    }
  }

  showRequestDetail(id) {
    const request = this.getRequest(id);
    if (!request) return;

    const detail = `
      <div class="network-detail">
        <h5>请求详情</h5>
        <div class="detail-section">
          <h6>基本信息</h6>
          <pre>URL: ${request.url}
Method: ${request.method}
Status: ${request.status || "pending"}
Duration: ${request.duration || "N/A"}ms</pre>
        </div>
        <div class="detail-section">
          <h6>请求头</h6>
          <pre>${JSON.stringify(request.headers, null, 2)}</pre>
        </div>
        ${
          request.body
            ? `
        <div class="detail-section">
          <h6>请求体</h6>
          <pre>${request.body}</pre>
        </div>
        `
            : ""
        }
        ${
          request.response?.body
            ? `
        <div class="detail-section">
          <h6>响应体</h6>
          <pre>${request.response.body.slice(0, 1000)}${request.response.body.length > 1000 ? "..." : ""}</pre>
        </div>
        `
            : ""
        }
        <div class="detail-section">
          <h6>cURL</h6>
          <pre class="curl-command">${this.toCurl(request)}</pre>
          <button class="copy-curl" data-curl="${this.escapeHtml(this.toCurl(request))}">复制</button>
        </div>
      </div>
    `;

    // 显示详情弹窗
    const modal = document.createElement("div");
    modal.className = "network-detail-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h4>请求详情</h4>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">${detail}</div>
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector(".modal-close")
      .addEventListener("click", () => modal.remove());
    modal
      .querySelector(".modal-backdrop")
      ?.addEventListener("click", () => modal.remove());
    modal.querySelector(".copy-curl")?.addEventListener("click", async (e) => {
      await navigator.clipboard.writeText(e.target.dataset.curl);
      e.target.textContent = "已复制!";
      setTimeout(() => (e.target.textContent = "复制"), 2000);
    });
  }

  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

// 导出
window.NetworkDebugger = NetworkDebugger;
