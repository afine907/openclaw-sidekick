// OpenClaw Sidebar - Sidepanel Script
// =====================================

class OpenClawSidepanel {
  constructor() {
    this.serverUrl = 'http://localhost:4000';  // OpenClaw 代理地址
    this.apiKey = null;  // API Key（从 storage 加载）
    this.messages = [];
    this.maxMessages = 100;  // 限制消息历史长度
    this.requestTimeout = 60000;  // 60秒请求超时
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.showWelcome();
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['serverUrl', 'apiKey']);
    if (result.serverUrl) {
      this.serverUrl = result.serverUrl;
    }
    if (result.apiKey) {
      this.apiKey = result.apiKey;
    }
    document.getElementById('server-url').value = this.serverUrl;
  }

  bindEvents() {
    // Settings toggle
    document.getElementById('settings-btn').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.toggle('hidden');
    });

    // Save settings
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });
    
    // Clear history
    document.getElementById('clear-history').addEventListener('click', () => {
      this.clearHistory();
    });

    // Send button
    document.getElementById('send-btn').addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter to send (Shift+Enter for newline)
    document.getElementById('input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Paste zone
    const pasteZone = document.getElementById('paste-zone');
    document.addEventListener('paste', (e) => {
      this.handlePaste(e);
    });

    pasteZone.addEventListener('click', () => {
      document.getElementById('input').focus();
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'SEND_TEXT') {
        this.addMessage('user', message.text);
        this.sendToOpenClaw(message.text);
      } else if (message.type === 'SEND_IMAGE') {
        this.handleImageData(message.imageData);
      }
    });
  }

  async saveSettings() {
    const url = document.getElementById('server-url').value.trim();
    const apiKey = document.getElementById('api-key').value.trim();
    
    // 验证 URL 格式
    try {
      new URL(url);
    } catch (e) {
      this.addMessage('system', '❌ URL 格式无效，请输入有效的地址');
      return;
    }
    
    if (url) {
      this.serverUrl = url;
      this.apiKey = apiKey || null;
      await chrome.storage.local.set({ 
        serverUrl: url,
        apiKey: apiKey || null
      });
      this.addMessage('system', '✅ 设置已保存');
      document.getElementById('settings-panel').classList.add('hidden');
    }
  }
  
  clearHistory() {
    this.messages = [];
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
    this.addMessage('system', '🗑️ 对话历史已清空');
  }

  showWelcome() {
    this.addMessage('system', '🦞 OpenClaw Sidekick 已就绪');
    this.addMessage('assistant', '选中任意网页文字，右键选择「发送到 OpenClaw」即可快速提问。\n\n也可以直接在这里输入消息。\n\n快捷键：\n• Ctrl+Shift+O 打开侧边栏\n• Ctrl+Shift+S 发送选中文字');
  }

  addMessage(role, content) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    // 支持 Markdown 简单渲染
    if (role === 'assistant') {
      messageDiv.innerHTML = this.renderMarkdown(content);
    } else {
      messageDiv.textContent = content;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    this.messages.push({ role, content });
  }

  renderMarkdown(text) {
    if (!text) return '';
    
    // 先转义 HTML 特殊字符，防止 XSS
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

  addLoadingIndicator() {
    const messagesContainer = document.getElementById('messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant loading';
    loadingDiv.id = 'loading';
    loadingDiv.innerHTML = '<span></span><span></span><span></span>';
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  removeLoadingIndicator() {
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
  }

  async sendMessage() {
    const input = document.getElementById('input');
    const text = input.value.trim();

    if (!text) return;

    this.addMessage('user', text);
    input.value = '';

    await this.sendToOpenClaw(text);
  }

  async sendToOpenClaw(text, imageData = null) {
    this.addLoadingIndicator();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

    try {
      // 构建消息内容
      let messageContent;
      if (imageData) {
        messageContent = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageData.mediaType,
              data: imageData.data
            }
          },
          {
            type: 'text',
            text: text || '请描述这张图片'
          }
        ];
      } else {
        messageContent = [
          ...this.messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content
          })),
          { role: 'user', content: text }
        ];
      }

      // 构建 Anthropic API 格式的请求
      const response = await fetch(`${this.serverUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': this.apiKey || 'sk-openclaw-proxy'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{ role: 'user', content: messageContent }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      this.removeLoadingIndicator();
      
      // 解析 Anthropic 响应格式
      const content = data.content?.[0]?.text || data.content || '收到响应';
      this.addMessage('assistant', content);
      this.messages.push({ role: 'assistant', content });
      
      // 限制消息历史，防止内存泄漏
      if (this.messages.length > 100) {
        this.messages = this.messages.slice(-50);
      }

    } catch (error) {
      this.removeLoadingIndicator();
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = '请求超时，请检查网络连接';
      }
      this.addMessage('system', `❌ 连接失败: ${errorMessage}\n请检查 OpenClaw 地址设置`);
    }
  }

  handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        this.handleImageFile(file);
        return;
      }
    }
  }

  async handleImageFile(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      this.addMessage('user', '📷 [图片]');
      
      try {
        // 提取 base64 数据
        const parts = base64.split(',');
        const mediaType = parts[0].match(/:([^;]+);/)?.[1] || 'image/png';
        const data = parts[1];
        
        // 检查数据大小（限制 5MB）
        if (data.length > 5 * 1024 * 1024) {
          throw new Error('图片过大，请选择小于 5MB 的图片');
        }

        // 发送图片到 OpenClaw（如果支持多模态）
        await this.sendToOpenClaw('请描述这张图片', { mediaType, data });
        
      } catch (error) {
        this.addMessage('system', `⚠️ 图片处理失败: ${error.message}`);
      }
    };
    reader.readAsDataURL(file);
  }

  handleImageData(imageData) {
    this.addMessage('user', '📷 [图片]');
    // 图片数据已通过 background.js 处理
    this.addMessage('system', '⚠️ 图片右键发送功能待完善');
  }
}

// Initialize
new OpenClawSidepanel();
