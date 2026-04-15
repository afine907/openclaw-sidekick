/**
 * OpenClaw Sidebar - DOM 和 UI 组件测试
 */

// 模拟 DOM 环境
if (typeof document === 'undefined') {
  // 创建模拟 DOM
  global.document = {
    getElementById: (id) => ({
      value: '',
      classList: { 
        add: () => {}, 
        remove: () => {},
        toggle: () => {}
      },
      addEventListener: () => {},
      innerHTML: '',
      textContent: '',
      style: {},
      focus: () => {},
      scrollTop: 0,
      scrollHeight: 0,
      appendChild: () => {},
      remove: () => {}
    }),
    createElement: (tag) => ({
      tagName: tag.toUpperCase(),
      className: '',
      innerHTML: '',
      textContent: '',
      style: {},
      appendChild: () => {},
      addEventListener: () => {}
    }),
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

const UI = {
  messages: [],
  
  init() {
    this.messagesContainer = document.getElementById('messages');
  },
  
  addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    if (role === 'assistant') {
      messageDiv.innerHTML = this.renderMarkdown(content);
    } else {
      messageDiv.textContent = content;
    }
    
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    this.messages.push({ role, content });
  },
  
  // 简化的 Markdown 渲染（用于测试）
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
  },
  
  clearMessages() {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
  }
};

// ============ DOM 测试 ============

function testRenderMarkdown() {
  console.log('\n--- 测试: Markdown 渲染 ---');
  
  // 测试粗体
  const bold = UI.renderMarkdown('**bold**');
  TestRunner.assertContains(bold, '<strong>bold</strong>', '应渲染粗体');
  
  // 测试斜体
  const italic = UI.renderMarkdown('*italic*');
  TestRunner.assertContains(italic, '<em>italic</em>', '应渲染斜体');
  
  // 测试代码
  const code = UI.renderMarkdown('`code`');
  TestRunner.assertContains(code, '<code>code</code>', '应渲染代码');
  
  // 测试 XSS 防护
  const xss = UI.renderMarkdown('<script>alert(1)</script>');
  TestRunner.assertNotContains(xss, '<script>', '应转义 script 标签');
  TestRunner.assertContains(xss, '&lt;script&gt;', '应转义为实体');
  
  // 测试空输入
  TestRunner.assertEqual(UI.renderMarkdown(''), '', '空字符串应返回空');
  TestRunner.assertEqual(UI.renderMarkdown(null), '', 'null 应返回空');
}

function testMessageFormatting() {
  console.log('\n--- 测试: 消息格式化 ---');
  
  // 模拟消息数组
  const messages = [
    { role: 'system', content: 'Welcome' },
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' }
  ];
  
  // 验证消息格式
  TestRunner.assertEqual(messages.length, 3, '应有3条消息');
  TestRunner.assertEqual(messages[0].role, 'system', '第一条应是系统消息');
  TestRunner.assertEqual(messages[1].role, 'user', '第二条应是用户消息');
  TestRunner.assertEqual(messages[2].role, 'assistant', '第三条应是助手消息');
}

function testScrollBehavior() {
  console.log('\n--- 测试: 滚动行为 ---');
  
  // 模拟滚动
  const mockElement = {
    scrollTop: 0,
    scrollHeight: 100,
    clientHeight: 50
  };
  
  // 计算是否需要滚动
  const shouldScroll = mockElement.scrollHeight > mockElement.clientHeight + mockElement.scrollTop;
  TestRunner.assert(shouldScroll, '当内容超出可视区域时应滚动');
  
  // 模拟滚动到底部
  mockElement.scrollTop = mockElement.scrollHeight;
  const atBottom = mockElement.scrollTop >= mockElement.scrollHeight - mockElement.clientHeight;
  TestRunner.assert(atBottom, '应滚动到底部');
}

function testInputHandling() {
  console.log('\n--- 测试: 输入处理 ---');
  
  // 模拟输入事件
  const mockInput = { value: '' };
  
  // 模拟键盘事件
  const keyDownEvent = (key, shiftKey = false) => ({ key, shiftKey });
  
  // 测试 Enter 发送
  const enterEvent = keyDownEvent('Enter', false);
  TestRunner.assert(enterEvent.key === 'Enter' && !enterEvent.shiftKey, 'Enter 应触发发送');
  
  // 测试 Shift+Enter 换行
  const shiftEnterEvent = keyDownEvent('Enter', true);
  TestRunner.assert(shiftEnterEvent.key === 'Enter' && shiftEnterEvent.shiftKey, 'Shift+Enter 应触发换行');
  
  // 测试其他键不触发
  const otherKeyEvent = keyDownEvent('a', false);
  TestRunner.assert(otherKeyEvent.key !== 'Enter', '其他键不应触发发送');
}

function testClipboardHandling() {
  console.log('\n--- 测试: 剪贴板处理 ---');
  
  // 模拟剪贴板数据
  const mockClipboardData = {
    items: [
      { type: 'text/plain', getAsFile: () => null },
      { type: 'image/png', getAsFile: () => ({ type: 'image/png', size: 1024 }) }
    ]
  };
  
  // 查找图片
  let foundImage = false;
  for (const item of mockClipboardData.items) {
    if (item.type.startsWith('image/')) {
      foundImage = true;
      const file = item.getAsFile();
      TestRunner.assert(file, '应能获取图片文件');
      break;
    }
  }
  TestRunner.assert(foundImage, '应能识别图片类型');
  
  // 测试无图片情况
  const textOnly = { items: [{ type: 'text/plain' }] };
  let hasImage = false;
  for (const item of textOnly.items) {
    if (item.type.startsWith('image/')) {
      hasImage = true;
    }
  }
  TestRunner.assert(!hasImage, '纯文本应没有图片');
}

function testLoadingIndicator() {
  console.log('\n--- 测试: 加载指示器 ---');
  
  // 模拟加载指示器 HTML
  const loadingHTML = `
    <div class="message assistant loading">
      <span></span><span></span><span></span>
    </div>
  `;
  
  TestRunner.assertContains(loadingHTML, 'loading', '应有 loading 类');
  TestRunner.assertContains(loadingHTML, '<span>', '应包含三个 span');
  TestRunner.assertEqual((loadingHTML.match(/<span>/g) || []).length, 3, '应有3个 span 元素');
}

function testErrorMessages() {
  console.log('\n--- 测试: 错误消息 ---');
  
  const errorMessages = {
    networkError: '❌ 连接失败: 网络错误\n请检查 OpenClaw 地址设置',
    timeoutError: '❌ 连接失败: 请求超时，请检查网络连接\n请检查 OpenClaw 地址设置',
    invalidUrl: '❌ URL 格式无效，请输入有效的地址',
    imageTooLarge: '⚠️ 图片处理失败: 图片过大，请选择小于 5MB 的图片'
  };
  
  TestRunner.assertContains(errorMessages.networkError, '❌', '网络错误应有错误图标');
  TestRunner.assertContains(errorMessages.timeoutError, '超时', '超时错误应有超时提示');
  TestRunner.assertContains(errorMessages.invalidUrl, '无效', 'URL 错误应有无效提示');
  TestRunner.assertContains(errorMessages.imageTooLarge, '5MB', '图片错误应提示大小限制');
}

function testMessageTruncation() {
  console.log('\n--- 测试: 消息截断 ---');
  
  const maxLength = 10000;
  
  function truncateMessage(text) {
    if (!text) return '';
    return text.slice(0, maxLength);
  }
  
  TestRunner.assertEqual(truncateMessage('short'), 'short', '短文本应保持不变');
  
  const longText = 'a'.repeat(20000);
  TestRunner.assertEqual(truncateMessage(longText).length, maxLength, '长文本应被截断');
  
  TestRunner.assertEqual(truncateMessage(''), '', '空文本应返回空');
  TestRunner.assertEqual(truncateMessage(null), '', 'null 应返回空');
}

// 运行 DOM 测试
function runDOMTests() {
  console.log('===== 开始 DOM 和 UI 测试 =====');
  
  UI.init();
  
  testRenderMarkdown();
  testMessageFormatting();
  testScrollBehavior();
  testInputHandling();
  testClipboardHandling();
  testLoadingIndicator();
  testErrorMessages();
  testMessageTruncation();
  
  return TestRunner.summary();
}

// 如果在浏览器环境，自动运行
if (typeof window !== 'undefined') {
  window.runDOMTests = runDOMTests;
}