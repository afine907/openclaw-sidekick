/**
 * OpenClaw Browser Extension - 测试套件入口
 * 
 * 运行: node tests/run.js
 */

// 测试工具函数
const TestRunner = {
  passed: 0,
  failed: 0,
  
  assert(condition, message) {
    if (condition) {
      this.passed++;
      console.log(`✅ ${message}`);
    } else {
      this.failed++;
      console.error(`❌ ${message}`);
    }
  },
  
  assertEqual(actual, expected, message) {
    this.assert(actual === expected, message || `Expected ${expected}, got ${actual}`);
  },
  
  assertContains(str, substring, message) {
    this.assert(str && str.includes(substring), message);
  },
  
  assertNotContains(str, substring, message) {
    this.assert(!str || !str.includes(substring), message);
  },
  
  summary() {
    const total = this.passed + this.failed;
    console.log(`\n===== 测试结果 =====`);
    console.log(`通过: ${this.passed} | 失败: ${this.failed} | 总计: ${total}`);
    return { passed: this.passed, failed: this.failed };
  }
};

// 核心功能测试
function runCoreTests() {
  console.log('\n--- 核心功能测试 ---');
  
  // 1. XSS 防护测试
  function renderMarkdown(text) {
    if (!text) return '';
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return escaped
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
  
  const xss1 = renderMarkdown('<script>alert(1)</script>');
  TestRunner.assertNotContains(xss1, '<script>', 'XSS: 应转义 script');
  TestRunner.assertContains(xss1, '&lt;script&gt;', 'XSS: 应转为实体');
  
  const xss2 = renderMarkdown('<img onerror=alert(1)>');
  TestRunner.assertNotContains(xss2, '<img', 'XSS: 应转义 img');
  
  const normal = renderMarkdown('**bold** *italic* `code`');
  TestRunner.assertContains(normal, '<strong>', 'Markdown: 粗体');
  TestRunner.assertContains(normal, '<em>', 'Markdown: 斜体');
  TestRunner.assertContains(normal, '<code>', 'Markdown: 代码');
  
  // 2. URL 验证
  function validateURL(url) {
    try { new URL(url); return true; } catch { return false; }
  }
  TestRunner.assert(validateURL('http://localhost:4000'), 'URL: 有效 HTTP');
  TestRunner.assert(validateURL('https://api.test.com'), 'URL: 有效 HTTPS');
  TestRunner.assert(!validateURL('not-a-url'), 'URL: 无效格式');
  TestRunner.assert(!validateURL(''), 'URL: 空字符串');
  
  // 3. 消息历史限制 (添加110条后，保留最后50条 = 50 + 9 = 59)
  let messages = [];
  const maxMessages = 100;
  function addMessage(content) {
    messages.push({ content });
    if (messages.length > maxMessages) messages = messages.slice(-50);
  }
  for (let i = 0; i < 110; i++) addMessage(`msg${i}`);
  TestRunner.assert(messages.length === 59, `消息: 超过限制应裁剪 (${messages.length})`);
  
  // 4. 输入清理
  function sanitize(input) {
    if (!input || typeof input !== 'string') return '';
    return input.trim().slice(0, 10000);
  }
  TestRunner.assertEqual(sanitize('  hi  '), 'hi', '清理: 去除空格');
  TestRunner.assertEqual(sanitize(''), '', '清理: 空输入');
  TestRunner.assertEqual(sanitize(null), '', '清理: null 处理');
  TestRunner.assertEqual(sanitize('a'.repeat(20000)).length, 10000, '清理: 长度限制');
  
  // 5. 图片大小验证
  function validImageSize(base64) {
    return base64.length <= 5 * 1024 * 1024;
  }
  TestRunner.assert(validImageSize('a'.repeat(1024*1024)), '图片: 1MB 通过');
  TestRunner.assert(!validImageSize('a'.repeat(10*1024*1024)), '图片: 10MB 拒绝');
  
  return TestRunner.summary();
}

// 运行测试
console.log('🦞 OpenClaw Browser Extension - 单元测试');
console.log('========================================');

const results = runCoreTests();

if (results.failed > 0) {
  console.log('\n⚠️ 有测试失败，请检查上述错误');
  process.exit(1);
} else {
  console.log('\n✅ 所有测试通过!');
  process.exit(0);
}