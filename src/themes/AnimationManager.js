/**
 * AnimationManager - 动画效果管理器
 * 提供各种 UI 动画效果
 */

class AnimationManager {
  constructor() {
    this.animations = {};
    this.init();
  }

  init() {
    this.addKeyframes('pulse', `
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    `);
  }

  /**
   * 淡入效果
   * @param {HTMLElement} element - 目标元素
   * @param {number} [duration=300] - 动画时长(ms)
   */
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

  /**
   * 淡出效果
   * @param {HTMLElement} element - 目标元素
   * @param {number} [duration=300] - 动画时长(ms)
   */
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

  /**
   * 滑动进入
   * @param {HTMLElement} element - 目标元素
   * @param {string} [direction='left'] - 方向 left/right/up/down
   * @param {number} [duration=300] - 动画时长(ms)
   */
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

  /**
   * 弹跳效果
   * @param {HTMLElement} element - 目标元素
   * @param {number} [scale=1.1] - 缩放比例
   * @param {number} [duration=200] - 动画时长(ms)
   */
  bounce(element, scale = 1.1, duration = 200) {
    element.style.transition = `transform ${duration}ms ease-out`;
    element.style.transform = `scale(${scale})`;

    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, duration);
  }

  /**
   * 脉冲动画
   * @param {HTMLElement} element - 目标元素
   * @param {number} [duration=1000] - 动画时长(ms)
   */
  pulse(element, duration = 1000) {
    element.style.animation = `pulse ${duration}ms ease-in-out`;
  }

  /**
   * 打字机效果
   * @param {HTMLElement} element - 目标元素
   * @param {string} text - 要显示的文字
   * @param {number} [speed=50] - 每个字符的间隔(ms)
   */
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

  /**
   * 添加关键帧动画
   * @param {string} name - 动画名称
   * @param {string} keyframes - 关键帧定义
   */
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

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationManager };
} else {
  window.AnimationManager = AnimationManager;
}