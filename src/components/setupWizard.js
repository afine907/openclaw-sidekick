/**
 * 配置向导 - 快速配置 API 和设置
 */

class SetupWizard {
  constructor() {
    this.isOpen = false;
    this.step = 0;
    this.settings = {};
  }

  async init() {
    await this.loadSettings();
  }

  async loadSettings() {
    try {
      const data = await browser.storage.local.get('settings');
      this.settings = data.settings || this.getDefaults();
    } catch (e) {
      this.settings = this.getDefaults();
    }
  }

  getDefaults() {
    return {
      apiEndpoint: 'http://localhost:4000',
      apiKey: '',
      autoConnect: true,
      theme: 'dark',
      notifications: true,
      maxHistory: 100,
      autoClean: true
    };
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.step = 0;
    this.loadSettings();
    this.render();
  }

  close() {
    this.isOpen = false;
    document.getElementById('setup-wizard')?.remove();
  }

  next() {
    if (this.step < 2) {
      this.step++;
      this.render();
    } else {
      this.save();
    }
  }

  prev() {
    if (this.step > 0) {
      this.step--;
      this.render();
    }
  }

  async save() {
    try {
      // 验证 API 连接
      const status = new window.StatusIndicator();
      const isConnected = await status.checkConnection(this.settings.apiEndpoint);

      if (!isConnected) {
        alert('无法连接到 API，请检查地址是否正确');
        return;
      }

      await browser.storage.local.set({ settings: this.settings });
      this.close();

      // 显示成功提示
      window.dispatchEvent(new CustomEvent('settings:saved', {
        detail: this.settings
      }));
    } catch (e) {
      console.error('保存设置失败:', e);
      alert('保存设置失败: ' + e.message);
    }
  }

  updateSetting(key, value) {
    this.settings[key] = value;
  }

  async testConnection() {
    const endpoint = this.settings.apiEndpoint;
    const status = new window.StatusIndicator();
    const result = await status.checkConnection(endpoint);

    const resultEl = document.getElementById('connection-test-result');
    if (resultEl) {
      resultEl.textContent = result ? '✅ 连接成功!' : '❌ 连接失败';
      resultEl.className = result ? 'success' : 'error';
    }
    return result;
  }

  render() {
    document.getElementById('setup-wizard')?.remove();

    const stepContent = [
      this.renderStep1_API(),
      this.renderStep2_Appearance(),
      this.renderStep3_Review()
    ][this.step];

    const titles = ['API 配置', '外观设置', '确认完成'];
    const progress = ((this.step + 1) / 3) * 100;

    const html = `
      <div id="setup-wizard" class="onboarding-overlay">
        <div class="onboarding-card setup-wizard-card">
          <button class="onboarding-skip" id="setup-close">✕</button>

          <div class="onboarding-progress">
            <div class="onboarding-progress-bar" style="width: ${progress}%"></div>
          </div>

          <h2 class="setup-wizard-title">${titles[this.step]}</h2>

          ${stepContent}

          <div class="onboarding-footer">
            <button class="onboarding-btn onboarding-btn-secondary" id="setup-prev" ${this.step === 0 ? 'disabled' : ''}>
              上一步
            </button>
            <span class="setup-step-text">${this.step + 1} / 3</span>
            <button class="onboarding-btn onboarding-btn-primary" id="setup-next">
              ${this.step === 2 ? '保存并完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // 绑定事件
    document.getElementById('setup-close')?.addEventListener('click', () => this.close());
    document.getElementById('setup-prev')?.addEventListener('click', () => this.prev());
    document.getElementById('setup-next')?.addEventListener('click', () => this.next());

    // 绑定输入事件
    document.getElementById('api-endpoint')?.addEventListener('input', (e) => {
      this.updateSetting('apiEndpoint', e.target.value);
    });
    document.getElementById('api-key')?.addEventListener('input', (e) => {
      this.updateSetting('apiKey', e.target.value);
    });
    document.getElementById('theme-select')?.addEventListener('change', (e) => {
      this.updateSetting('theme', e.target.value);
    });
    document.getElementById('test-connection')?.addEventListener('click', () => {
      this.testConnection();
    });
  }

  renderStep1_API() {
    return `
      <div class="setup-wizard-content">
        <div class="setup-field">
          <label>API 地址</label>
          <input type="text" id="api-endpoint" value="${this.settings.apiEndpoint}"
                 placeholder="http://localhost:4000" />
          <span class="setup-hint">OpenClaw 代理服务的地址</span>
        </div>

        <div class="setup-field">
          <label>API Key (可选)</label>
          <input type="password" id="api-key" value="${this.settings.apiKey}"
                 placeholder="留空使用默认配置" />
          <span class="setup-hint">如需要身份验证才需要填写</span>
        </div>

        <button class="setup-test-btn" id="test-connection">测试连接</button>
        <div id="connection-test-result"></div>
      </div>
    `;
  }

  renderStep2_Appearance() {
    return `
      <div class="setup-wizard-content">
        <div class="setup-field">
          <label>主题</label>
          <select id="theme-select">
            <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>深色主题</option>
            <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>浅色主题</option>
            <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>跟随系统</option>
          </select>
        </div>

        <div class="setup-field">
          <label>通知</label>
          <label class="setup-toggle">
            <input type="checkbox" id="notifications" ${this.settings.notifications ? 'checked' : ''} />
            <span class="toggle-slider"></span>
            <span>启用消息通知</span>
          </label>
        </div>

        <div class="setup-field">
          <label>历史记录保留</label>
          <select id="max-history">
            <option value="50" ${this.settings.maxHistory === 50 ? 'selected' : ''}>50 条</option>
            <option value="100" ${this.settings.maxHistory === 100 ? 'selected' : ''}>100 条</option>
            <option value="200" ${this.settings.maxHistory === 200 ? 'selected' : ''}>200 条</option>
            <option value="500" ${this.settings.maxHistory === 500 ? 'selected' : ''}>500 条</option>
          </select>
        </div>
      </div>
    `;
  }

  renderStep3_Review() {
    return `
      <div class="setup-wizard-content">
        <div class="setup-review">
          <h3>配置摘要</h3>
          <div class="setup-review-item">
            <span>API 地址:</span>
            <strong>${this.settings.apiEndpoint}</strong>
          </div>
          <div class="setup-review-item">
            <span>主题:</span>
            <strong>${this.settings.theme === 'dark' ? '深色' : this.settings.theme === 'light' ? '浅色' : '自动'}</strong>
          </div>
          <div class="setup-review-item">
            <span>通知:</span>
            <strong>${this.settings.notifications ? '开启' : '关闭'}</strong>
          </div>
          <div class="setup-review-item">
            <span>历史记录:</span>
            <strong>${this.settings.maxHistory} 条</strong>
          </div>
        </div>
      </div>
    `;
  }
}

// 导出
window.SetupWizard = SetupWizard;