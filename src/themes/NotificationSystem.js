/**
 * NotificationSystem - 通知系统
 * 提供页面内的通知/提示功能
 */

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

  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} [type='info'] - 类型 success/error/warning/info
   * @param {number} [duration=3000] - 显示时长(ms)，0 为不自动关闭
   * @returns {HTMLElement} 通知元素
   */
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

  /**
   * 获取类型的图标
   * @param {string} type - 通知类型
   * @returns {string} emoji 图标
   */
  getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  /**
   * 关闭通知
   * @param {HTMLElement} notification - 通知元素
   */
  dismiss(notification) {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }

  /**
   * 显示成功通知
   */
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  /**
   * 显示错误通知
   */
  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  /**
   * 显示警告通知
   */
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  /**
   * 显示信息通知
   */
  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  /**
   * 关闭所有通知
   */
  clear() {
    this.container.innerHTML = '';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem };
} else {
  window.NotificationSystem = NotificationSystem;
}