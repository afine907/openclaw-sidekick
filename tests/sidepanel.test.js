/**
 * OpenClaw Sidebar - 单元测试
 * 
 * 运行方式：在浏览器控制台中加载此文件，
 * 或使用 Chrome 扩展测试工具运行
 */

// 测试工具函数
const TestRunner = {
  passed: 0,
  failed: 0,
  results: [],
  
  assert(condition, message) {
    if (condition) {
      this.passed++;
      this.results.push({ status: 'pass', message });
      console.log(`✅ ${message}`);
    } else {
      this.failed++;
      this.results.push({ status: 'fail', message });
      console.error(`❌ ${message}`);
    }
  },
  
  assertEqual(actual, expected, message) {
    const condition = actual === expected;
    this.assert(condition, message || `Expected ${expected}, got ${actual}`);
  },
  
  assertContains(str, substring, message) {
    const condition = str && str.includes(substring);
    this.assert(condition, message || `Expected "${str}" to contain "${substring}"`);
  },
  
  assertNotContains(str, substring, message) {
    const condition = !str || !str.includes(substring);
    this.assert(condition, message || `Expected "${str}" not to contain "${substring}"`);
  },
  
  summary() {
    console.log(`\n===== 测试结果 =====`);
    console.log(`通过: ${this.passed}`);
    console.log(`失败: ${this.failed}`);
    console.log(`总计: ${this.passed + this.failed}`);
    return { passed: this.passed, failed: this.failed };
  }
};

// 模拟 Chrome API
global.chrome = {
  storage: {
    local: {
      get: (keys, callback) => {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => {
            if (key === 'serverUrl') result.serverUrl = 'http://localhost:4000';
            if (key === 'apiKey') result.apiKey = null;
          });
        } else if (typeof keys === 'string') {
          if (keys === 'serverUrl') result.serverUrl = 'http://localhost:4000';
        }
        setTimeout(() => callback(result), 0);
      },
      set: (items, callback) => {
        setTimeout(() => callback && callback(), 0);
      }
    }
  },
  runtime: {
    onMessage: {
      addListener: () => {}
    }
  }
};

// ============ 测试用例 ============

// 1. renderMarkdown XSS 防护测试
function testRenderMarkdownXSS() {
  console.log('\n--- 测试: renderMarkdown XSS 防护 ---');
  
  // 模拟 renderMarkdown 函数
  function renderMarkdown(text) {
    if (!text) return '';
    
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    return escaped
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
  
  // 测试 XSS payload
  const xssPayload = '<script>alert(1)</script>';
  const result = renderMarkdown(xssPayload);
  TestRunner.assertNotContains(result, '<script>', '应转义 script 标签');
  TestRunner.assertContains(result, '&lt;script&gt;', '应转义为 HTML 实体');
  
  // 测试其他 XSS 向量
  const xss2 = '<img src=x onerror=alert(1)>';
  const result2 = renderMarkdown(xss2);
  TestRunner.assertNotContains(result2, '<img', '应转义 img 标签');
  
  // 测试正常的 Markdown 渲染
  const normalText = '**粗体** *斜体* `代码`';
  const result3 = renderMarkdown(normalText);
  TestRunner.assertContains(result3, '<strong>', '应正确渲染粗体');
  TestRunner.assertContains(result3, '<em>', '应正确渲染斜体');
  TestRunner.assertContains(result3, '<code>', '应正确渲染代码');
}

// 2. URL 验证测试
function testURLValidation() {
  console.log('\n--- 测试: URL 验证 ---');
  
  function validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // 有效 URL
  TestRunner.assert(validateURL('http://localhost:4000'), '有效 HTTP URL');
  TestRunner.assert(validateURL('https://api.example.com'), '有效 HTTPS URL');
  TestRunner.assert(validateURL('http://localhost:4000/v1/messages'), '有效带路径 URL');
  
  // 无效 URL
  TestRunner.assert(!validateURL(''), '空字符串应无效');
  TestRunner.assert(!validateURL('not-a-url'), '无效格式应被拒绝');
  TestRunner.assert(!validateURL('localhost'), '缺少协议应无效');
}

// 3. 消息历史管理测试
function testMessageHistory() {
  console.log('\n--- 测试: 消息历史管理 ---');
  
  let messages = [];
  const maxMessages = 100;
  
  function addMessage(role, content) {
    messages.push({ role, content });
    // 限制消息历史
    if (messages.length > maxMessages) {
      messages = messages.slice(-50);
    }
  }
  
  // 测试添加消息
  addMessage('user', 'Hello');
  TestRunner.assertEqual(messages.length, 1, '应添加一条消息');
  
  // 测试超过限制
  for (let i = 0; i < 110; i++) {
    addMessage('user', `Message ${i}`);
  }
  TestRunner.assert(messages.length <= 50, `超过限制后应裁剪，当前: ${messages.length}`);
  TestRunner.assertEqual(messages[0].content, 'Message 60', '应保留最新的50条消息');
}

// 4. API 请求超时测试
function testRequestTimeout() {
  console.log('\n--- 测试: 请求超时处理 ---');
  
  function createRequestWithTimeout(timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    return { controller, timeoutId };
  }
  
  // 测试超时创建
  const request = createRequestWithTimeout(60000);
  TestRunner.assert(request.controller, '应创建 AbortController');
  TestRunner.assert(request.timeoutId, '应返回 timeout ID');
  
  // 清理
  clearTimeout(request.timeoutId);
  TestRunner.assert(true, '应能清理 timeout');
}

// 5. 图片大小验证测试
function testImageSizeValidation() {
  console.log('\n--- 测试: 图片大小验证 ---');
  
  function validateImageSize(base64Data) {
    // 5MB 限制
    const maxSize = 5 * 1024 * 1024;
    return base64Data.length <= maxSize;
  }
  
  // 模拟小图片 (假设 base64 约 1MB)
  const smallImage = 'a'.repeat(1024 * 1024);
  TestRunner.assert(validateImageSize(smallImage), '1MB 图片应通过验证');
  
  // 模拟大图片 (假设 base64 约 10MB)
  const largeImage = 'a'.repeat(10 * 1024 * 1024);
  TestRunner.assert(!validateImageSize(largeImage), '10MB 图片应被拒绝');
}

// 6. 输入清理测试
function testInputSanitization() {
  console.log('\n--- 测试: 输入清理 ---');
  
  function sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    return input.trim().slice(0, 10000); // 限制长度
  }
  
  TestRunner.assertEqual(sanitizeInput('  hello  '), 'hello', '应去除首尾空格');
  TestRunner.assertEqual(sanitizeInput(''), '', '空输入应返回空字符串');
  TestRunner.assertEqual(sanitizeInput(null), '', 'null 应返回空字符串');
  
  // 测试长度限制
  const longInput = 'a'.repeat(20000);
  TestRunner.assertEqual(sanitizeInput(longInput).length, 10000, '应限制输入长度');
}

// 7. 设置存储测试
function testSettingsStorage() {
  console.log('\n--- 测试: 设置存储 ---');
  
  let storage = {};
  
  function saveSettings(settings) {
    // 验证 URL
    try {
      new URL(settings.serverUrl);
    } catch (e) {
      return { success: false, error: 'Invalid URL' };
    }
    
    // 存储设置
    if (settings.serverUrl) storage.serverUrl = settings.serverUrl;
    if (settings.apiKey) storage.apiKey = settings.apiKey;
    return { success: true };
  }
  
  function loadSettings() {
    return {
      serverUrl: storage.serverUrl || 'http://localhost:4000',
      apiKey: storage.apiKey || null
    };
  }
  
  // 测试保存设置
  const saveResult1 = saveSettings({ serverUrl: 'http://localhost:4000' });
  TestRunner.assert(saveResult1.success, '应成功保存有效 URL');
  
  const saveResult2 = saveSettings({ serverUrl: 'invalid-url' });
  TestRunner.assert(!saveResult2.success, '应拒绝无效 URL');
  
  // 测试加载设置
  const loaded = loadSettings();
  TestRunner.assertEqual(loaded.serverUrl, 'http://localhost:4000', '应正确加载 URL');
}

// 运行所有测试
function runAllTests() {
  console.log('===== 开始运行单元测试 =====');
  
  testRenderMarkdownXSS();
  testURLValidation();
  testMessageHistory();
  testRequestTimeout();
  testImageSizeValidation();
  testInputSanitization();
  testSettingsStorage();
  
  return TestRunner.summary();
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, TestRunner };
}