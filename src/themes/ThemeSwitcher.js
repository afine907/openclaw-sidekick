/**
 * ThemeSwitcher - 主题切换 UI 组件
 * 提供主题选择的可视化界面
 */

/**
 * 主题切换器 UI 组件
 */
class ThemeSwitcher {
  /**
   * @param {ThemeManager} themeManager - 主题管理器实例
   */
  constructor(themeManager) {
    this.themeManager = themeManager;
    this.container = null;
  }

  /**
   * 渲染主题切换器
   * @returns {HTMLElement} 容器元素
   */
  render() {
    const container = document.createElement("div");
    container.className = "theme-switcher";
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

  /**
   * 渲染主题列表
   * @returns {string} HTML 字符串
   */
  renderThemeList() {
    const themes = this.themeManager.listThemes();
    const currentId = this.themeManager.currentTheme;

    let html = '<div class="theme-group">';

    // 内置主题
    for (const theme of themes.builtIn) {
      html += this.renderThemeItem(
        theme.id,
        theme.name,
        theme.id === currentId,
      );
    }

    // 自定义主题
    if (themes.custom.length > 0) {
      html += '</div><div class="theme-group"><h4>自定义</h4>';
      for (const theme of themes.custom) {
        html += this.renderThemeItem(
          theme.id,
          theme.name,
          theme.id === currentId,
        );
      }
    }

    html += "</div>";
    return html;
  }

  /**
   * 渲染单个主题项
   * @param {string} id - 主题 ID
   * @param {string} name - 主题名称
   * @param {boolean} isActive - 是否为当前主题
   * @returns {string} HTML 字符串
   */
  renderThemeItem(id, name, isActive) {
    const theme = this.themeManager.getTheme(id);
    const colors = theme?.colors || {};

    return `
      <div class="theme-item ${isActive ? "active" : ""}" data-theme="${id}">
        <div class="theme-preview" style="
          background: ${colors.background || "#000"};
          border: 2px solid ${colors.accent || "#666"};
        ">
          <div class="preview-colors">
            <span style="background: ${colors.accent || "#666"}"></span>
            <span style="background: ${colors.text || "#fff"}"></span>
            <span style="background: ${colors.backgroundSecondary || "#333"}"></span>
          </div>
        </div>
        <span class="theme-name">${name}</span>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 主题项点击
    this.container.querySelectorAll(".theme-item").forEach((item) => {
      item.addEventListener("click", () => {
        const themeId = item.dataset.theme;
        this.themeManager.setTheme(themeId);
        this.refresh();
      });
    });

    // 关闭按钮
    this.container
      .querySelector(".theme-close")
      ?.addEventListener("click", () => {
        this.close();
      });

    // 添加自定义主题
    this.container
      .querySelector(".btn-add-theme")
      ?.addEventListener("click", () => {
        this.showAddThemeDialog();
      });
  }

  /**
   * 刷新主题列表
   */
  refresh() {
    const list = this.container.querySelector(".theme-list");
    if (list) {
      list.innerHTML = this.renderThemeList();
      this.bindEvents();
    }
  }

  /**
   * 关闭切换器
   */
  close() {
    this.container?.remove();
  }

  /**
   * 显示添加自定义主题对话框
   */
  showAddThemeDialog() {
    const dialog = document.createElement("div");
    dialog.className = "theme-dialog";
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
    dialog
      .querySelector(".btn-cancel")
      .addEventListener("click", () => dialog.remove());
    dialog.querySelector(".btn-save").addEventListener("click", () => {
      const name = dialog.querySelector("#theme-name").value;
      const bg = dialog.querySelector("#theme-bg").value;
      const text = dialog.querySelector("#theme-text").value;
      const accent = dialog.querySelector("#theme-accent").value;

      this.themeManager.registerCustomTheme(name, {
        background: bg,
        backgroundSecondary: this.adjustColor(bg, 10),
        backgroundTertiary: this.adjustColor(bg, 20),
        text: text,
        textSecondary: this.adjustColor(text, -30),
        accent: accent,
        accentLight: this.adjustColor(accent, 20),
        border: this.adjustColor(bg, 30),
        success: "#4ade80",
        warning: "#fbbf24",
        error: "#ef4444",
        info: "#60a5fa",
      });

      this.refresh();
      dialog.remove();
    });
  }

  /**
   * 调整颜色亮度
   * @param {string} hex - 十六进制颜色
   * @param {number} amount - 调整量
   * @returns {string} 调整后的颜色
   */
  adjustColor(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}

// 导出
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ThemeSwitcher };
} else {
  window.ThemeSwitcher = ThemeSwitcher;
}
