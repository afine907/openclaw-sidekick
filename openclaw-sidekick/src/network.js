/**
 * OpenClaw Sidekick - 网络请求模块
 * 提供 Fetch、WebSocket、GraphQL 等网络功能
 */

// HTTP 客户端
class HTTPClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.defaultHeaders = options.headers || {};
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.interceptors = {
      request: [],
      response: []
    };
  }

  // 拦截器
  addRequestInterceptor(callback) {
    this.interceptors.request.push(callback);
  }

  addResponseInterceptor(callback) {
    this.interceptors.response.push(callback);
  }

  async _processRequest(config) {
    let result = config;
    for (const interceptor of this.interceptors.request) {
      result = await interceptor(result) || result;
    }
    return result;
  }

  async _processResponse(response) {
    let result = response;
    for (const interceptor of this.interceptors.response) {
      result = await interceptor(result) || result;
    }
    return result;
  }

  // 请求方法
  async request(config) {
    config = {
      method: 'GET',
      headers: {},
      body: null,
      ...config
    };

    // 处理请求拦截器
    config = await this._processRequest(config);

    // 构建完整 URL
    const url = config.url.startsWith('http') 
      ? config.url 
      : this.baseURL + config.url;

    // 合并 headers
    const headers = {
      ...this.defaultHeaders,
      ...config.headers
    };

    // 发送请求，带重试
    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: config.method,
          headers,
          body: config.body,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // 处理响应
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        const processedResponse = await this._processResponse({
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data
        });

        if (!response.ok) {
          throw new APIError(response.status, processedResponse.data);
        }

        return processedResponse;

      } catch (error) {
        lastError = error;
        
        if (attempt < this.retries && this._shouldRetry(error)) {
          await this._sleep(this.retryDelay * (attempt + 1));
          continue;
        }
        
        throw error;
      }
    }

    throw lastError;
  }

  _shouldRetry(error) {
    if (error instanceof TypeError) return true;
    if (error instanceof APIError) {
      return error.status >= 500 || error.status === 429;
    }
    return false;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 便捷方法
  get(url, config = {}) {
    return this.request({ url, method: 'GET', ...config });
  }

  post(url, data, config = {}) {
    return this.request({
      url,
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', ...config.headers },
      ...config
    });
  }

  put(url, data, config = {}) {
    return this.request({
      url,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', ...config.headers },
      ...config
    });
  }

  patch(url, data, config = {}) {
    return this.request({
      url,
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', ...config.headers },
      ...config
    });
  }

  delete(url, config = {}) {
    return this.request({ url, method: 'DELETE', ...config });
  }
}

// API 错误
class APIError extends Error {
  constructor(status, data) {
    super(data.message || data.error || 'API Error');
    this.status = status;
    this.data = data;
  }
}

// WebSocket 客户端
class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.listeners = new Map();
    this.messageQueue = [];
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this._flushMessageQueue();
          this.emit('open');
          resolve();
        };

        this.ws.onmessage = (event) => {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch {
            data = event.data;
          }
          this.emit('message', data);
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };

        this.ws.onclose = () => {
          this.connected = false;
          this.emit('close');
          this._attemptReconnect();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  _attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', this.reconnectAttempts);

    setTimeout(() => {
      this.connect().catch(() => {});
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  send(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
    }
  }

  _flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }

  close() {
    this.maxReconnectAttempts = 0;
    if (this.ws) {
      this.ws.close();
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(cb => cb(data));
  }
}

// GraphQL 客户端
class GraphQLClient {
  constructor(url, options = {}) {
    this.url = url;
    this.httpClient = new HTTPClient({
      baseURL: url,
      ...options
    });
  }

  async query(queryString, variables = {}) {
    return this.httpClient.post('', {
      query: queryString,
      variables
    });
  }

  async mutation(mutationString, variables = {}) {
    return this.httpClient.post('', {
      query: mutationString,
      variables
    });
  }

  // 订阅（使用 WebSocket）
  subscribe(queryString, variables = {}, onData) {
    const wsUrl = this.url.replace('http', 'ws') + '/graphql';
    const ws = new WebSocketClient(wsUrl);
    
    ws.connect().then(() => {
      ws.send({
        type: 'start',
        payload: {
          query: queryString,
          variables
        }
      });

      ws.on('message', (response) => {
        if (response.type === 'data') {
          onData(response.payload.data);
        }
      });
    });

    return () => ws.close();
  }
}

// 请求缓存
class RequestCache {
  constructor(options = {}) {
    this.ttl = options.ttl || 60000; // 1 minute
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

// 轮询管理器
class PollingManager {
  constructor() {
    this.intervals = new Map();
  }

  start(id, callback, interval) {
    if (this.intervals.has(id)) {
      this.stop(id);
    }

    const intervalId = setInterval(callback, interval);
    this.intervals.set(id, intervalId);
  }

  stop(id) {
    if (this.intervals.has(id)) {
      clearInterval(this.intervals.get(id));
      this.intervals.delete(id);
    }
  }

  stopAll() {
    for (const id of this.intervals.keys()) {
      this.stop(id);
    }
  }
}

// SSE 客户端 (Server-Sent Events)
class SSEClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.eventSource = null;
    this.listeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.eventSource = new EventSource(this.url);

      this.eventSource.onopen = () => {
        resolve();
      };

      this.eventSource.onmessage = (event) => {
        this.emit('message', JSON.parse(event.data));
      };

      this.eventSource.onerror = (error) => {
        this.emit('error', error);
        reject(error);
      };

      // 监听自定义事件
      if (this.options.events) {
        for (const eventName of this.options.events) {
          this.eventSource.addEventListener(eventName, (event) => {
            this.emit(eventName, JSON.parse(event.data));
          });
        }
      }
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(cb => cb(data));
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// 导出模块
window.HTTPClient = HTTPClient;
window.APIError = APIError;
window.WebSocketClient = WebSocketClient;
window.GraphQLClient = GraphQLClient;
window.RequestCache = RequestCache;
window.PollingManager = PollingManager;
window.SSEClient = SSEClient;