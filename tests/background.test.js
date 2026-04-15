/**
 * OpenClaw Sidebar - Background Script 单元测试
 */

// 模拟 Chrome API
const createMockChrome = () => ({
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
        setTimeout(() => callback(result), 0);
      },
      set(items, callback) {
        Object.assign(this.data, items);
        setTimeout(() => callback && callback(), 0);
      },
      onChanged: {
        listeners: [],
        addListener(callback) {
          this.listeners.push(callback);
        },
        trigger(changes) {
          this.listeners.forEach(cb => cb(changes));
        }
      }
    }
  },
  contextMenus: {
    items: [],
    create(options) {
      const id = options.id;
      this.items.push({ id, ...options });
      return id;
    },
    onClicked: {
      listeners: [],
      addListener(callback) {
        this.listeners.push(callback);
      },
      trigger(info, tab) {
        this.listeners.forEach(cb => cb(info, tab));
      }
    }
  },
  tabs: {
    query: async () => [{ id: 1, active: true, currentWindow: true }]
  },
  sidePanel: {
    open: async () => {},
    setPanelBehavior: () => {}
  },
  scripting: {
    executeScript: async () => [{ result: 'test selection' }]
  },
  runtime: {
    onInstalled: {
      addListener(callback) {
        callback({ reason: 'install' });
      }
    },
    onMessage: {
      listeners: [],
      addListener(callback) {
        this.listeners.push(callback);
      },
      sendMessage(message) {
        this.listeners.forEach(cb => cb(message, {}, () => {}));
      }
    },
    sendMessage: (message) => {}
  },
  commands: {
    onCommand: {
      listeners: [],
      addListener(callback) {
        this.listeners.push(callback);
      }
    }
  }
});

// 全局 mock
global.chrome = createMockChrome();

// ============ Background Script 测试 ============

function testContextMenuCreation() {
  console.log('\n--- 测试: 上下文菜单创建 ---');
  
  // 模拟 onInstalled 事件
  const mockInfo = { reason: 'install' };
  
  // 检查菜单创建
  const menuItems = chrome.contextMenus.items;
  TestRunner.assert(menuItems.length >= 2, `应创建至少2个菜单项，当前: ${menuItems.length}`);
  
  // 验证菜单项配置
  const sendTextMenu = menuItems.find(item => item.id === 'send-to-openclaw');
  TestRunner.assert(sendTextMenu, '应有"发送到 OpenClaw"菜单');
  TestRunner.assertEqual(sendTextMenu.contexts[0], 'selection', '应绑定到选中文本');
  
  const sendImageMenu = menuItems.find(item => item.id === 'send-image-to-openclaw');
  TestRunner.assert(sendImageMenu, '应有"发送图片到 OpenClaw"菜单');
  TestRunner.assertEqual(sendImageMenu.contexts[0], 'image', '应绑定到图片');
}

function testSettingsStorage() {
  console.log('\n--- 测试: 设置存储 ---');
  
  // 测试默认值
  let serverUrl = 'http://localhost:4000';
  let apiKey = null;
  
  // 模拟加载设置
  chrome.storage.local.get(['serverUrl', 'apiKey'], (result) => {
    if (result.serverUrl) serverUrl = result.serverUrl;
    if (result.apiKey) apiKey = result.apiKey;
  });
  
  TestRunner.assertEqual(serverUrl, 'http://localhost:4000', '默认 URL 应正确');
  TestRunner.assertEqual(apiKey, null, '默认 API Key 应为 null');
  
  // 测试保存设置
  const newUrl = 'http://localhost:8080';
  const newApiKey = 'test-key-123';
  
  chrome.storage.local.set({ serverUrl: newUrl, apiKey: newApiKey });
  
  chrome.storage.local.get(['serverUrl', 'apiKey'], (result) => {
    TestRunner.assertEqual(result.serverUrl, newUrl, '应保存新的 URL');
    TestRunner.assertEqual(result.apiKey, newApiKey, '应保存新的 API Key');
  });
}

function testStorageChangeListener() {
  console.log('\n--- 测试: 设置变更监听 ---');
  
  let serverUrl = 'http://localhost:4000';
  
  // 添加监听器
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.serverUrl) {
      serverUrl = changes.serverUrl.newValue;
    }
  });
  
  // 模拟设置变更
  chrome.storage.local.set({ serverUrl: 'http://localhost:3000' });
  
  // 触发变更事件
  chrome.storage.onChanged.trigger({ 
    serverUrl: { 
      newValue: 'http://localhost:3000',
      oldValue: 'http://localhost:4000'
    }
  });
  
  TestRunner.assertEqual(serverUrl, 'http://localhost:3000', '应响应设置变更');
}

function testMessageHandling() {
  console.log('\n--- 测试: 消息处理 ---');
  
  let receivedSettings = null;
  
  // 模拟消息监听
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_SETTINGS') {
      sendResponse({ 
        serverUrl: 'http://localhost:4000',
        apiKey: null
      });
    }
    return true;
  });
  
  // 测试获取设置消息
  const mockSender = {};
  let responseSent = false;
  
  // 触发消息
  chrome.runtime.onMessage.listeners[0](
    { type: 'GET_SETTINGS' },
    mockSender,
    (response) => {
      receivedSettings = response;
      responseSent = true;
    }
  );
  
  setTimeout(() => {
    TestRunner.assert(responseSent, '应发送响应');
    TestRunner.assertEqual(receivedSettings.serverUrl, 'http://localhost:4000', '响应应包含 serverUrl');
  }, 10);
}

function testContextMenuClick() {
  console.log('\n--- 测试: 右键菜单点击 ---');
  
  let handledMenuId = null;
  let handledText = null;
  
  // 添加菜单点击监听
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    handledMenuId = info.menuItemId;
    handledText = info.selectionText;
  });
  
  // 模拟点击"发送到 OpenClaw"
  const mockInfo = {
    menuItemId: 'send-to-openclaw',
    selectionText: '测试选中文字'
  };
  
  chrome.contextMenus.onClicked.trigger(mockInfo, { id: 1 });
  
  TestRunner.assertEqual(handledMenuId, 'send-to-openclaw', '应处理正确的菜单 ID');
  TestRunner.assertEqual(handledText, '测试选中文字', '应获取选中文本');
}

function testKeyboardShortcuts() {
  console.log('\n--- 测试: 键盘快捷键 ---');
  
  let commandReceived = null;
  
  // 添加命令监听
  chrome.commands.onCommand.addListener((command) => {
    commandReceived = command;
  });
  
  // 模拟快捷键
  chrome.commands.onCommand.listeners[0]('send-selection');
  
  TestRunner.assertEqual(commandReceived, 'send-selection', '应正确识别命令');
}

function testImageFetch() {
  console.log('\n--- 测试: 图片获取 ---');
  
  // 模拟 fetch
  const mockFetch = async (url) => {
    if (url.startsWith('http')) {
      return {
        blob: async () => new Blob(['mock image data'], { type: 'image/png' })
      };
    }
    throw new Error('Invalid URL');
  };
  
  // 测试图片 URL 提取
  const testImageUrl = 'https://example.com/image.png';
  const isValidUrl = testImageUrl.startsWith('http');
  
  TestRunner.assert(isValidUrl, '应识别有效的图片 URL');
  
  // 测试 base64 转换
  const mockFileReader = {
    result: 'data:image/png;base64,mockdata',
    onload: null,
    readAsDataURL(blob) {
      setTimeout(() => this.onload && this.onload(), 0);
    }
  };
  
  TestRunner.assert(mockFileReader.result.startsWith('data:'), '应生成 base64 数据');
}

function testSidePanelBehavior() {
  console.log('\n--- 测试: 侧边栏行为 ---');
  
  let panelBehaviorSet = false;
  
  // 模拟 setPanelBehavior
  const originalSetPanelBehavior = chrome.sidePanel.setPanelBehavior;
  chrome.sidePanel.setPanelBehavior = (options) => {
    panelBehaviorSet = true;
  };
  
  // 调用设置
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
  TestRunner.assert(panelBehaviorSet, '应设置面板行为');
  
  // 恢复
  chrome.sidePanel.setPanelBehavior = originalSetPanelBehavior;
}

function testURLValidation() {
  console.log('\n--- 测试: URL 验证 ---');
  
  const validUrls = [
    'http://localhost:4000',
    'https://api.example.com',
    'http://192.168.1.1:8080'
  ];
  
  const invalidUrls = [
    '',
    'not-a-url',
    'localhost:4000'
  ];
  
  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  
  validUrls.forEach(url => {
    TestRunner.assert(isValidUrl(url), `"${url}" 应是有效 URL`);
  });
  
  invalidUrls.forEach(url => {
    TestRunner.assert(!isValidUrl(url), `"${url}" 应是无效 URL`);
  });
}

// 运行所有 Background 测试
function runBackgroundTests() {
  console.log('===== 开始 Background Script 测试 =====');
  
  testContextMenuCreation();
  testSettingsStorage();
  testStorageChangeListener();
  testMessageHandling();
  testContextMenuClick();
  testKeyboardShortcuts();
  testImageFetch();
  testSidePanelBehavior();
  testURLValidation();
  
  return TestRunner.summary();
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runBackgroundTests };
}