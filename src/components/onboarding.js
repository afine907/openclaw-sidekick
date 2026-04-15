/**
 * 新手引导 - 首次安装用户体验
 */

class Onboarding {
  constructor() {
    this.step = 0;
    this.steps = [];
    this.isOpen = false;
  }

  init() {
    this.registerSteps();
    this.checkFirstRun();
  }

  registerSteps() {
    this.steps = [
      {
        id: "welcome",
        title: "👋 欢迎使用 OpenClaw Sidekick",
        content: "让 AI 助手常驻浏览器侧边栏，随时随地获取帮助",
        image: "🎉",
      },
      {
        id: "quick-send",
        title: "⚡ 快速发送选中文字",
        content: "选中文本 → 右键菜单或快捷键 Ctrl+Shift+S → 立即发送给 AI",
        image: "📝",
      },
      {
        id: "sidebar",
        title: "📐 侧边栏持久显示",
        content: "点击浏览器右上角扩展图标，或按 Ctrl+Shift+O 打开侧边栏",
        image: "🔲",
      },
      {
        id: "presets",
        title: "🎯 智能预设提示词",
        content: "输入 / 触发命令面板，试试 /解释代码 /重构代码 等预设",
        image: "💡",
      },
      {
        id: "complete",
        title: "🚀 准备就绪!",
        content: "有任何问题随时问我。开始享受 AI 助手的便利吧!",
        image: "🦞",
      },
    ];
  }

  async checkFirstRun() {
    try {
      const data = await browser.storage.local.get("onboardingComplete");
      if (!data.onboardingComplete) {
        // 首次运行，显示引导
        setTimeout(() => this.open(), 1000);
      }
    } catch (e) {
      console.error("检查首次运行失败:", e);
    }
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.step = 0;
    this.render();
  }

  close() {
    this.isOpen = false;
    document.getElementById("onboarding-modal")?.remove();
  }

  async complete() {
    await browser.storage.local.set({ onboardingComplete: true });
    this.close();
  }

  next() {
    if (this.step < this.steps.length - 1) {
      this.step++;
      this.render();
    } else {
      this.complete();
    }
  }

  prev() {
    if (this.step > 0) {
      this.step--;
      this.render();
    }
  }

  render() {
    // 移除旧弹窗
    document.getElementById("onboarding-modal")?.remove();

    const current = this.steps[this.step];
    const progress = ((this.step + 1) / this.steps.length) * 100;

    const html = `
      <div id="onboarding-modal" class="onboarding-overlay">
        <div class="onboarding-card">
          <button class="onboarding-skip" id="onboarding-skip">跳过</button>

          <div class="onboarding-progress">
            <div class="onboarding-progress-bar" style="width: ${progress}%"></div>
          </div>

          <div class="onboarding-content">
            <div class="onboarding-image">${current.image}</div>
            <h2 class="onboarding-title">${current.title}</h2>
            <p class="onboarding-text">${current.content}</p>
          </div>

          <div class="onboarding-footer">
            <button class="onboarding-btn onboarding-btn-secondary" id="onboarding-prev" ${this.step === 0 ? "disabled" : ""}>
              上一步
            </button>
            <div class="onboarding-dots">
              ${this.steps
                .map(
                  (_, i) => `
                <span class="onboarding-dot ${i === this.step ? "active" : ""}"></span>
              `,
                )
                .join("")}
            </div>
            <button class="onboarding-btn onboarding-btn-primary" id="onboarding-next">
              ${this.step === this.steps.length - 1 ? "完成" : "下一步"}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", html);

    // 绑定事件
    document
      .getElementById("onboarding-skip")
      ?.addEventListener("click", () => this.complete());
    document
      .getElementById("onboarding-prev")
      ?.addEventListener("click", () => this.prev());
    document
      .getElementById("onboarding-next")
      ?.addEventListener("click", () => this.next());

    // 键盘导航
    document.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;
      if (e.key === "ArrowRight") this.next();
      if (e.key === "ArrowLeft") this.prev();
      if (e.key === "Escape") this.complete();
    });
  }

  // 重新显示引导
  async restart() {
    await browser.storage.local.set({ onboardingComplete: false });
    this.open();
  }
}

// 导出
window.Onboarding = Onboarding;
