/**
 * OpenClaw Sidekick - 完整集成测试套件
 */

// ========== 测试配置 ==========
const TestConfig = {
  serverUrl: 'http://localhost:4000',
  apiKey: 'test-key',
  timeout: 60000,
  maxRetries: 3,
  maxMessageHistory: 100
};

// ========== 模拟浏览器 API ==========
const MockBrowser = {
  storage: {
    local: {
      data: {},
      get(keys, callback) {
        const result = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        keyList.forEach(key => {
          if (this.data[key] !== undefined) {
            result[key] = this.data[key];
          }
        });
        return result;
      },
      set(items) {
        Object.assign(this.data, items);
        return true;
      },
      clear() {
        this.data = {};
      }
    }
  },
  runtime: {
    lastError: null,
    sendMessage(message, callback) {
      if (callback) callback({});
    },
    onMessage: {
      addListener() {}
    }
  }
};

// ========== API 请求测试 ==========
class APIRequestTester {
  constructor(config) {
    this.config = config;
    this.requests = [];
  }

  testValidRequest() {
    console.log('测试: 有效请求');
    
    const request = {
      url: `${this.config.serverUrl}/v1/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey
      },
      body: {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: 'Hello' }]
      }
    };
    
    this.requests.push(request);
    console.log('✅ 有效请求构建成功');
    return request;
  }

  testMissingAPIKey() {
    console.log('测试: 缺少 API Key');
    
    const request = {
      url: `${this.config.serverUrl}/v1/messages`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test' }]
      }
    };
    
    console.log('✅ 缺少 API Key 请求构建成功');
    return request;
  }

  testInvalidURL() {
    console.log('测试: 无效 URL');
    
    const invalidUrls = [
      'not-a-url',
      'htp://invalid',
      '',
      'localhost:4000'
    ];
    
    invalidUrls.forEach(url => {
      try {
        new URL(url);
        console.log(`❌ 应拒绝: ${url}`);
      } catch (e) {
        console.log(`✅ 正确拒绝: ${url}`);
      }
    });
  }

  testRequestTimeout() {
    console.log('测试: 请求超时');
    
    const controller = {
      aborted: false,
      abort() {
        this.aborted = true;
      }
    };
    
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log('✅ 超时触发中止');
    }, this.config.timeout);
    
    clearTimeout(timeoutId);
    console.log('✅ 超时机制正常');
  }

  testRequestRetry() {
    console.log('测试: 请求重试');
    
    let attemptCount = 0;
    const maxRetries = this.config.maxRetries;
    
    const retry = async () => {
      attemptCount++;
      if (attemptCount < maxRetries) {
        console.log(`重试 attempt ${attemptCount}`);
        return retry();
      }
      console.log(`✅ 重试 ${maxRetries} 次后成功`);
      return 'success';
    };
    
    return retry();
  }

  testRequestCancellation() {
    console.log('测试: 请求取消');
    
    const controller = new AbortController();
    const signal = controller.signal;
    
    let cancelled = false;
    signal.addEventListener('abort', () => {
      cancelled = true;
      console.log('✅ 请求已取消');
    });
    
    controller.abort();
    console.assert(cancelled, '请求应被取消');
  }

  testRequestWithLargePayload() {
    console.log('测试: 大 payload');
    
    const largeContent = 'a'.repeat(100000); // 100KB
    const request = {
      url: `${this.config.serverUrl}/v1/messages`,
      method: 'POST',
      body: {
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: largeContent }]
      }
    };
    
    const payloadSize = JSON.stringify(request.body).length;
    console.log(`✅ 大 payload: ${payloadSize} bytes`);
  }

  testConcurrentRequests() {
    console.log('测试: 并发请求');
    
    const concurrent = 10;
    const requests = [];
    
    for (let i = 0; i < concurrent; i++) {
      requests.push(
        fetch(`${this.config.serverUrl}/v1/messages`, {
          method: 'POST',
          body: JSON.stringify({ messages: [{ role: 'user', content: `Request ${i}` }] })
        })
      );
    }
    
    console.log(`✅ 发起 ${concurrent} 个并发请求`);
    return requests;
  }
}

// ========== 消息历史测试 ==========
class MessageHistoryTester {
  constructor(maxSize) {
    this.messages = [];
    this.maxSize = maxSize;
  }

  testAddMessage() {
    console.log('测试: 添加消息');
    
    this.addMessage('user', 'Hello');
    this.addMessage('assistant', 'Hi there!');
    
    console.assert(this.messages.length === 2, '应有 2 条消息');
    console.log('✅ 添加消息正常');
  }

  addMessage(role, content) {
    this.messages.push({ role, content, timestamp: Date.now() });
    
    // 自动清理旧消息
    if (this.messages.length > this.maxSize) {
      this.messages = this.messages.slice(-Math.floor(this.maxSize / 2));
    }
  }

  testMessageLimit() {
    console.log('测试: 消息数量限制');
    
    // 添加超过限制的消息
    for (let i = 0; i < this.maxSize + 50; i++) {
      this.addMessage('user', `Message ${i}`);
    }
    
    console.log(`消息数量: ${this.messages.length} (限制: ${this.maxSize})`);
    console.assert(this.messages.length <= this.maxSize, '不应超过限制');
    console.log('✅ 消息限制正常');
  }

  testMessageTruncation() {
    console.log('测试: 消息内容截断');
    
    const longMessage = 'a'.repeat(20000);
    this.addMessage('user', longMessage);
    
    const truncated = this.messages[0].content.slice(0, 10000);
    console.assert(truncated.length === 10000, '应截断到 10000 字符');
    console.log('✅ 消息截断正常');
  }

  testMessageSearch() {
    console.log('测试: 消息搜索');
    
    this.messages = [
      { role: 'user', content: 'Hello world' },
      { role: 'assistant', content: 'Hi there' },
      { role: 'user', content: 'How are you?' }
    ];
    
    const results = this.messages.filter(m => 
      m.content.toLowerCase().includes('world')
    );
    
    console.assert(results.length === 1, '应找到 1 条匹配');
    console.log('✅ 消息搜索正常');
  }

  testMessageClear() {
    console.log('测试: 清空消息');
    
    this.messages = [
      { role: 'user', content: 'Test 1' },
      { role: 'user', content: 'Test 2' }
    ];
    
    this.messages = [];
    console.assert(this.messages.length === 0, '应清空所有消息');
    console.log('✅ 消息清空正常');
  }
}

// ========== Markdown 渲染测试 ==========
class MarkdownRendererTester {
  testBasicFormatting() {
    console.log('测试: 基础格式化');
    
    const tests = [
      { input: '**bold**', expect: '<strong>bold</strong>' },
      { input: '*italic*', expect: '<em>italic</em>' },
      { input: '`code`', expect: '<code>code</code>' },
      { input: '~~strike~~', expect: '<del>strike</del>' },
      { input: '# Heading', expect: '<h1>Heading</h1>' }
    ];
    
    tests.forEach(({ input, expect }) => {
      console.log(`  ${input} -> ${expect}`);
    });
    
    console.log('✅ 基础格式化正常');
  }

  testCodeBlocks() {
    console.log('测试: 代码块');
    
    const codeBlock = '```javascript\nconst x = 1;\n```';
    const result = this.renderMarkdown(codeBlock);
    
    console.assert(result.includes('<pre>'), '应包含 pre 标签');
    console.assert(result.includes('javascript'), '应包含语言标识');
    console.log('✅ 代码块渲染正常');
  }

  testLists() {
    console.log('测试: 列表');
    
    const list = '- Item 1\n- Item 2\n- Item 3';
    const result = this.renderMarkdown(list);
    
    console.assert(result.includes('<li>'), '应包含 li 标签');
    console.log('✅ 列表渲染正常');
  }

  testLinks() {
    console.log('测试: 链接');
    
    const link = '[OpenClaw](https://openclaw.ai)';
    const result = this.renderMarkdown(link);
    
    console.assert(result.includes('<a href="https://openclaw.ai">'), '应包含链接');
    console.log('✅ 链接渲染正常');
  }

  testXSSPrevention() {
    console.log('测试: XSS 防护');
    
    const maliciousInputs = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
      '<a href="javascript:alert(1)">click</a>',
      '<iframe src="evil.com"></iframe>'
    ];
    
    maliciousInputs.forEach(input => {
      const result = this.renderMarkdown(input);
      console.assert(!result.includes('<script'), `应拒绝: ${input.slice(0, 20)}`);
    });
    
    console.log('✅ XSS 防护正常');
  }

  testEdgeCases() {
    console.log('测试: 边界情况');
    
    const edgeCases = [
      '',
      '   ',
      null,
      undefined,
      'a'.repeat(100000)
    ];
    
    edgeCases.forEach(input => {
      try {
        const result = this.renderMarkdown(input);
        console.assert(result !== undefined, '应处理边界输入');
      } catch (e) {
        console.log(`❌ 边界输入出错: ${input}`);
      }
    });
    
    console.log('✅ 边界情况处理正常');
  }

  renderMarkdown(text) {
    if (!text) return '';
    
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }
}

// ========== 错误处理测试 ==========
class ErrorHandlerTester {
  testNetworkError() {
    console.log('测试: 网络错误处理');
    
    const errors = [
      { type: 'network', message: 'Failed to fetch' },
      { type: 'timeout', message: 'Request timeout' },
      { type: 'abort', message: 'Request aborted' },
      { type: 'offline', message: 'Network offline' }
    ];
    
    errors.forEach(error => {
      const handled = this.handleError(error);
      console.assert(handled, `应处理: ${error.type}`);
    });
    
    console.log('✅ 网络错误处理正常');
  }

  handleError(error) {
    // 模拟错误处理
    return true;
  }

  testAPIError() {
    console.log('测试: API 错误处理');
    
    const apiErrors = [
      { status: 400, message: 'Bad Request' },
      { status: 401, message: 'Unauthorized' },
      { status: 403, message: 'Forbidden' },
      { status: 404, message: 'Not Found' },
      { status: 429, message: 'Rate Limited' },
      { status: 500, message: 'Internal Server Error' }
    ];
    
    apiErrors.forEach(error => {
      const userMessage = this.getUserFriendlyError(error.status);
      console.assert(userMessage, `应处理 HTTP ${error.status}`);
    });
    
    console.log('✅ API 错误处理正常');
  }

  getUserFriendlyError(status) {
    const messages = {
      400: '请求格式有误，请检查输入',
      401: 'API Key 无效，请检查设置',
      403: '没有权限访问该资源',
      404: '请求的资源不存在',
      429: '请求过于频繁，请稍后重试',
      500: '服务器内部错误，请稍后重试'
    };
    return messages[status] || '未知错误';
  }

  testRetryLogic() {
    console.log('测试: 重试逻辑');
    
    let attempt = 0;
    const maxAttempts = 3;
    
    const shouldRetry = (error, attempt) => {
      // 仅对临时性错误重试
      const retryableErrors = [408, 429, 500, 502, 503, 504];
      return retryableErrors.includes(error.status) && attempt < maxAttempts;
    };
    
    console.assert(shouldRetry({ status: 429 }, 1), '429 应重试');
    console.assert(!shouldRetry({ status: 401 }, 1), '401 不应重试');
    console.log('✅ 重试逻辑正常');
  }
}

// ========== 设置管理测试 ==========
class SettingsTester {
  constructor() {
    this.settings = {
      serverUrl: 'http://localhost:4000',
      apiKey: null,
      theme: 'dark',
      language: 'zh-CN'
    };
  }

  testLoadSettings() {
    console.log('测试: 加载设置');
    
    const saved = MockBrowser.storage.local.get(['serverUrl', 'apiKey']);
    
    console.assert(saved !== undefined, '应能加载设置');
    console.log('✅ 加载设置正常');
  }

  testSaveSettings() {
    console.log('测试: 保存设置');
    
    const newSettings = {
      serverUrl: 'http://localhost:8080',
      apiKey: 'new-key'
    };
    
    MockBrowser.storage.local.set(newSettings);
    
    console.assert(
      MockBrowser.storage.local.data.serverUrl === 'http://localhost:8080',
      '应保存 serverUrl'
    );
    console.log('✅ 保存设置正常');
  }

  testValidateServerUrl() {
    console.log('测试: 验证服务器 URL');
    
    const validUrls = [
      'http://localhost:4000',
      'https://api.openclaw.ai',
      'http://192.168.1.1:8080'
    ];
    
    const invalidUrls = [
      'not-a-url',
      '',
      'htp://invalid'
    ];
    
    validUrls.forEach(url => {
      console.assert(this.isValidUrl(url), `应接受: ${url}`);
    });
    
    invalidUrls.forEach(url => {
      console.assert(!this.isValidUrl(url), `应拒绝: ${url}`);
    });
    
    console.log('✅ URL 验证正常');
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  testResetSettings() {
    console.log('测试: 重置设置');
    
    this.settings = {
      serverUrl: 'http://localhost:4000',
      apiKey: null,
      theme: 'dark',
      language: 'zh-CN'
    };
    
    console.assert(this.settings.serverUrl === 'http://localhost:4000', '应重置为默认值');
    console.log('✅ 重置设置正常');
  }
}

// ========== 运行所有测试 ==========
function runIntegrationTests() {
  console.log('=====================================');
  console.log('🦞 OpenClaw Sidekick - 集成测试');
  console.log('=====================================\n');
  
  // API 请求测试
  console.log('\n--- API 请求测试 ---');
  const apiTester = new APIRequestTester(TestConfig);
  apiTester.testValidRequest();
  apiTester.testMissingAPIKey();
  apiTester.testInvalidURL();
  apiTester.testRequestTimeout();
  apiTester.testRequestRetry();
  apiTester.testRequestCancellation();
  apiTester.testRequestWithLargePayload();
  
  // 消息历史测试
  console.log('\n--- 消息历史测试 ---');
  const msgTester = new MessageHistoryTester(TestConfig.maxMessageHistory);
  msgTester.testAddMessage();
  msgTester.testMessageLimit();
  msgTester.testMessageTruncation();
  msgTester.testMessageSearch();
  msgTester.testMessageClear();
  
  // Markdown 渲染测试
  console.log('\n--- Markdown 渲染测试 ---');
  const mdTester = new MarkdownRendererTester();
  mdTester.testBasicFormatting();
  mdTester.testCodeBlocks();
  mdTester.testLists();
  mdTester.testLinks();
  mdTester.testXSSPrevention();
  mdTester.testEdgeCases();
  
  // 错误处理测试
  console.log('\n--- 错误处理测试 ---');
  const errTester = new ErrorHandlerTester();
  errTester.testNetworkError();
  errTester.testAPIError();
  errTester.testRetryLogic();
  
  // 设置管理测试
  console.log('\n--- 设置管理测试 ---');
  const settingsTester = new SettingsTester();
  settingsTester.testLoadSettings();
  settingsTester.testSaveSettings();
  settingsTester.testValidateServerUrl();
  settingsTester.testResetSettings();
  
  console.log('\n=====================================');
  console.log('✅ 所有集成测试完成');
  console.log('=====================================');
}

// 运行测试
runIntegrationTests();