/**
 * OpenClaw Sidekick - 主题系统
 * 支持多主题切换和自定义主题
 */

// 预定义主题
const Themes = {
  // 深色主题（默认）
  dark: {
    name: '深色',
    colors: {
      background: '#1a1a2e',
      backgroundSecondary: '#16213e',
      backgroundTertiary: '#0f3460',
      text: '#eee',
      textSecondary: '#888',
      accent: '#e94560',
      accentLight: '#ff6b8a',
      border: '#0f3460',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#ef4444',
      info: '#60a5fa'
    }
  },

  // 浅色主题
  light: {
    name: '浅色',
    colors: {
      background: '#ffffff',
      backgroundSecondary: '#f3f4f6',
      backgroundTertiary: '#e5e7eb',
      text: '#1f2937',
      textSecondary: '#6b7280',
      accent: '#e94560',
      accentLight: '#ff6b8a',
      border: '#e5e7eb',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },

  // 赛博朋克主题
  cyberpunk: {
    name: '赛博朋克',
    colors: {
      background: '#0d0d0d',
      backgroundSecondary: '#1a1a2e',
      backgroundTertiary: '#16213e',
      text: '#00ff41',
      textSecondary: '#008f11',
      accent: '#ff00ff',
      accentLight: '#00ffff',
      border: '#ff00ff',
      success: '#00ff41',
      warning: '#ffff00',
      error: '#ff0000',
      info: '#00ffff'
    }
  },

  // 海洋主题
  ocean: {
    name: '海洋',
    colors: {
      background: '#0a192f',
      backgroundSecondary: '#112240',
      backgroundTertiary: '#233554',
      text: '#ccd6f6',
      textSecondary: '#8892b0',
      accent: '#64ffda',
      accentLight: '#a8ffea',
      border: '#233554',
      success: '#64ffda',
      warning: '#ffd700',
      error: '#ff6b6b',
      info: '#64ffda'
    }
  },

  // 柔和主题
  pastel: {
    name: '柔和',
    colors: {
      background: '#1e1e2e',
      backgroundSecondary: '#2d2d44',
      backgroundTertiary: '#3d3d5c',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      accent: '#c792ea',
      accentLight: '#e0c0ff',
      border: '#3d3d5c',
      success: '#c3e88d',
      warning: '#ffcb6b',
      error: '#ff5370',
      info: '#82aaff'
    }
  }
};

// 主题管理器
class ThemeManager {
  constructor() {
    this.currentTheme = 'dark';
    this.customThemes = {};
    this.listeners = [];
    
    // 加载保存的主题
    this.loadSavedTheme();
  }
  
  loadSavedTheme() {
    const saved = localStorage.getItem('openclaw-theme');
    if (saved && (Themes[saved] || this.customThemes[saved])) {
      this.currentTheme = saved;
    }
  }
  
  getTheme(name = this.currentTheme) {
    return Themes[name] || this.customThemes[name];
  }
  
  getCurrentTheme() {
    return this.getTheme(this.currentTheme);
  }
  
  async setTheme(name) {
    const theme = this.getTheme(name);
    if (!theme) {
      console.error(`Theme "${name}" not found`);
      return false;
    }
    
    this.currentTheme = name;
    this.applyTheme(theme);
    localStorage.setItem('openclaw-theme', name);
    
    // 通知监听器
    this.notifyListeners();
    
    return true;
  }
  
  applyTheme(theme) {
    const root = document.documentElement;
    const colors = theme.colors;
    
    // 设置 CSS 变量
    root.style.setProperty('--bg-primary', colors.background);
    root.style.setProperty('--bg-secondary', colors.backgroundSecondary);
    root.style.setProperty('--bg-tertiary', colors.backgroundTertiary);
    root.style.setProperty('--text-primary', colors.text);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-light', colors.accentLight);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--error', colors.error);
    root.style.setProperty('--info', colors.info);
    
    // 更新 body 背景
    document.body.style.background = colors.background;
    document.body.style.color = colors.text;
  }
  
  registerCustomTheme(name, colors) {
    this.customThemes[name] = {
      name,
      colors,
      isCustom: true
    };
    
    // 保存到 localStorage
    const saved = JSON.parse(localStorage.getItem('openclaw-custom-themes') || '{}');
    saved[name] = colors;
    localStorage.setItem('openclaw-custom-themes', JSON.stringify(saved));
  }
  
  loadCustomThemes() {
    const saved = JSON.parse(localStorage.getItem('openclaw-custom-themes') || '{}');
    for (const [name, colors] of Object.entries(saved)) {
      this.registerCustomTheme(name, colors);
    }
  }
  
  deleteCustomTheme(name) {
    if (this.customThemes[name]?.isCustom) {
      delete this.customThemes[name];
      
      // 从 localStorage 删除
      const saved = JSON.parse(localStorage.getItem('openclaw-custom-themes') || '{}');
      delete saved[name];
      localStorage.setItem('openclaw-custom-themes', JSON.stringify(saved));
    }
  }
  
  listThemes() {
    return {
      builtIn: Object.entries(Themes).map(([key, theme]) => ({
        id: key,
        name: theme.name
      })),
      custom: Object.entries(this.customThemes)
        .filter(([_, theme]) => theme.isCustom)
        .map(([key, theme]) => ({
          id: key,
          name: theme.name
        }))
    };
  }
  
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentTheme, this.getCurrentTheme());
      } catch (e) {
        console.error('Theme listener error:', e);
      }
    });
  }
  
  // 导出主题为 JSON
  exportTheme(name = this.currentTheme) {
    const theme = this.getTheme(name);
    return JSON.stringify(theme, null, 2);
  }
  
  // 从 JSON 导入主题
  importTheme(jsonString) {
    try {
      const theme = JSON.parse(jsonString);
      
      if (!theme.name || !theme.colors) {
        throw new Error('Invalid theme format');
      }
      
      // 验证必要颜色
      const requiredColors = [
        'background', 'backgroundSecondary', 'text',
        'textSecondary', 'accent', 'border'
      ];
      
      for (const color of requiredColors) {
        if (!theme.colors[color]) {
          throw new Error(`Missing required color: ${color}`);
        }
      }
      
      // 生成唯一 ID
      const id = 'custom-' + Date.now();
      this.registerCustomTheme(id, theme.colors);
      
      return { success: true, id, name: theme.name };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// 主题切换 UI 组件
class ThemeSwitcher {
  constructor(themeManager) {
    this.themeManager = themeManager;
    this.container = null;
  }
  
  render() {
    const container = document.createElement('div');
    container.className = 'theme-switcher';
    container.innerHTML = `
      <div class="theme-header">
        <h3>🎨 主题</h3>
        <button class="theme-close">&times;</button>
      </div>
      <div class="theme-list">
        ${this.renderThemeList()}
      </div>
      <div class="theme-actions">
        <button class="btn-add-theme">+ 自定义主题</button>
      </div>
    `;
    
    this.container = container;
    this.bindEvents();
    
    return container;
  }
  
  renderThemeList() {
    const themes = this.themeManager.listThemes();
    const currentId = this.themeManager.currentTheme;
    
    let html = '<div class="theme-group">';
    
    // 内置主题
    for (const theme of themes.builtIn) {
      html += this.renderThemeItem(theme.id, theme.name, theme.id === currentId);
    }
    
    // 自定义主题
    if (themes.custom.length > 0) {
      html += '</div><div class="theme-group"><h4>自定义</h4>';
      for (const theme of themes.custom) {
        html += this.renderThemeItem(theme.id, theme.name, theme.id === currentId);
      }
    }
    
    html += '</div>';
    return html;
  }
  
  renderThemeItem(id, name, isActive) {
    const theme = this.themeManager.getTheme(id);
    const colors = theme?.colors || {};
    
    return `
      <div class="theme-item ${isActive ? 'active' : ''}" data-theme="${id}">
        <div class="theme-preview" style="
          background: ${colors.background || '#000'};
          border: 2px solid ${colors.accent || '#666'};
        ">
          <div class="preview-colors">
            <span style="background: ${colors.accent || '#666'}"></span>
            <span style="background: ${colors.text || '#fff'}"></span>
            <span style="background: ${colors.backgroundSecondary || '#333'}"></span>
          </div>
        </div>
        <span class="theme-name">${name}</span>
      </div>
    `;
  }
  
  bindEvents() {
    // 主题项点击
    this.container.querySelectorAll('.theme-item').forEach(item => {
      item.addEventListener('click', () => {
        const themeId = item.dataset.theme;
        this.themeManager.setTheme(themeId);
        this.refresh();
      });
    });
    
    // 关闭按钮
    this.container.querySelector('.theme-close')?.addEventListener('click', () => {
      this.close();
    });
    
    // 添加自定义主题
    this.container.querySelector('.btn-add-theme')?.addEventListener('click', () => {
      this.showAddThemeDialog();
    });
  }
  
  refresh() {
    const list = this.container.querySelector('.theme-list');
    if (list) {
      list.innerHTML = this.renderThemeList();
      this.bindEvents();
    }
  }
  
  close() {
    this.container?.remove();
  }
  
  showAddThemeDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'theme-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <h3>创建自定义主题</h3>
        <div class="form-group">
          <label>主题名称</label>
          <input type="text" id="theme-name" placeholder="我的主题">
        </div>
        <div class="form-group">
          <label>背景色</label>
          <input type="color" id="theme-bg" value="#1a1a2e">
        </div>
        <div class="form-group">
          <label>文字色</label>
          <input type="color" id="theme-text" value="#eeeeee">
        </div>
        <div class="form-group">
          <label>强调色</label>
          <input type="color" id="theme-accent" value="#e94560">
        </div>
        <div class="dialog-actions">
          <button class="btn-cancel">取消</button>
          <button class="btn-save">保存</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 绑定事件
    dialog.querySelector('.btn-cancel').addEventListener('click', () => dialog.remove());
    dialog.querySelector('.btn-save').addEventListener('click', () => {
      const name = dialog.querySelector('#theme-name').value;
      const bg = dialog.querySelector('#theme-bg').value;
      const text = dialog.querySelector('#theme-text').value;
      const accent = dialog.querySelector('#theme-accent').value;
      
      this.themeManager.registerCustomTheme(name, {
        background: bg,
        backgroundSecondary: this.adjustColor(bg, 10),
        backgroundTertiary: this.adjustColor(bg, 20),
        text: text,
        textSecondary: this.adjustColor(text, -30),
        accent: accent,
        accentLight: this.adjustColor(accent, 20),
        border: this.adjustColor(bg, 30),
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#ef4444',
        info: '#60a5fa'
      });
      
      this.refresh();
      dialog.remove();
    });
  }
  
  adjustColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}

// 动画效果管理器
class AnimationManager {
  constructor() {
    this.animations = {};
  }
  
  // 淡入淡出
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = '';
    
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = Math.min(progress / duration, 1);
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  fadeOut(element, duration = 300) {
    const startOpacity = parseFloat(getComputedStyle(element).opacity);
    let start = null;
    
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const opacity = startOpacity * (1 - Math.min(progress / duration, 1));
      
      element.style.opacity = opacity;
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  // 滑动
  slideIn(element, direction = 'left', duration = 300) {
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };
    
    element.style.transition = 'none';
    element.style.transform = transforms[direction];
    element.style.display = '';
    
    // 强制重绘
    element.offsetHeight;
    
    element.style.transition = `transform ${duration}ms ease-out`;
    element.style.transform = 'translateX(0)';
  }
  
  // 弹跳
  bounce(element, scale = 1.1, duration = 200) {
    element.style.transition = `transform ${duration}ms ease-out`;
    element.style.transform = `scale(${scale})`;
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, duration);
  }
  
  // 脉冲
  pulse(element, duration = 1000) {
    element.style.animation = `pulse ${duration}ms ease-in-out`;
  }
  
  // 打字机效果
  typeWriter(element, text, speed = 50) {
    element.textContent = '';
    let i = 0;
    
    const type = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      }
    };
    
    type();
  }
  
  // 添加关键帧动画
  addKeyframes(name, keyframes) {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ${name} {
        ${keyframes}
      }
    `;
    document.head.appendChild(style);
  }
}

// 通知系统
class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.init();
  }
  
  init() {
    // 创建通知容器
    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);
  }
  
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <span class="notification-icon">${this.getIcon(type)}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    `;
    
    this.container.appendChild(notification);
    
    // 关闭按钮
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.dismiss(notification);
    });
    
    // 自动关闭
    if (duration > 0) {
      setTimeout(() => this.dismiss(notification), duration);
    }
    
    // 动画
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    return notification;
  }
  
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }
  
  dismiss(notification) {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }
  
  success(message, duration) {
    return this.show(message, 'success', duration);
  }
  
  error(message, duration) {
    return this.show(message, 'error', duration);
  }
  
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }
  
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
  
  clear() {
    this.container.innerHTML = '';
  }
}

// 快捷键管理器
class KeyboardManager {
  constructor() {
    this.shortcuts = {};
    this.enabled = true;
    this.init();
  }
  
  init() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }
  
  register(key, handler, description = '') {
    const combo = key.toLowerCase().replace(/\s+/g, '');
    this.shortcuts[combo] = { handler, description, key };
  }
  
  unregister(key) {
    const combo = key.toLowerCase().replace(/\s+/g, '');
    delete this.shortcuts[combo];
  }
  
  handleKeyDown(e) {
    if (!this.enabled) return;
    
    // 构建快捷键组合
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.metaKey) parts.push('meta');
    
    const key = e.key.toLowerCase();
    if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
      parts.push(key);
    }
    
    const combo = parts.join('+');
    
    if (this.shortcuts[combo]) {
      e.preventDefault();
      this.shortcuts[combo].handler(e);
    }
  }
  
  list() {
    return Object.values(this.shortcuts).map(s => ({
      key: s.key,
      description: s.description
    }));
  }
  
  enable() {
    this.enabled = true;
  }
  
  disable() {
    this.enabled = false;
  }
}

// 导出模块
window.ThemeManager = ThemeManager;
window.ThemeSwitcher = ThemeSwitcher;
window.AnimationManager = AnimationManager;
window.NotificationSystem = NotificationSystem;
window.KeyboardManager = KeyboardManager;