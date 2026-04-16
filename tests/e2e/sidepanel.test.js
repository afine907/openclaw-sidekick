// OpenClaw Sidekick - 端到端测试
// 使用 Playwright 在真实浏览器环境中测试扩展

import { test, expect } from '@playwright/test';

test.describe('OpenClaw Sidekick 端到端测试', () => {
  
  // 在每个测试前注入 mock chrome API
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Mock chrome API for extension testing
      window.chrome = {
        storage: {
          local: {
            get: () => Promise.resolve({}),
            set: () => Promise.resolve(),
            onChanged: {
              addListener: () => {}
            }
          }
        },
        runtime: {
          onInstalled: { addListener: () => {} },
          onMessage: { addListener: () => {} },
          sendMessage: () => Promise.resolve({}),
          lastError: null
        }
      };
    });
  });
  
  test.describe('侧边栏 UI 测试', () => {
    
    test('侧边栏应该正确渲染所有元素', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 检查标题
      await expect(page.locator('h1')).toContainText('OpenClaw Sidekick');
      
      // 检查设置按钮存在
      await expect(page.locator('#settings-btn')).toBeVisible();
      
      // 检查输入框存在
      await expect(page.locator('#input')).toBeVisible();
      
      // 检查发送按钮存在
      await expect(page.locator('#send-btn')).toBeVisible();
      
      // 检查粘贴区域存在
      await expect(page.locator('#paste-zone')).toBeVisible();
    });

    test('设置面板默认应该隐藏', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 初始状态设置面板应该是隐藏的
      const settingsPanel = page.locator('#settings-panel');
      await expect(settingsPanel).toHaveClass(/hidden/);
    });

    test('设置面板应该可以展开和收起', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      const settingsPanel = page.locator('#settings-panel');
      
      // 点击设置按钮
      await page.click('#settings-btn');
      
      // 设置面板应该显示
      await expect(settingsPanel).not.toHaveClass(/hidden/);
      
      // 再次点击应该收起
      await page.click('#settings-btn');
      await expect(settingsPanel).toHaveClass(/hidden/);
    });

    test('应该能够输入消息', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 输入消息
      await page.fill('#input', 'Hello, OpenClaw!');
      
      // 验证输入框内容
      await expect(page.locator('#input')).toHaveValue('Hello, OpenClaw!');
    });

    test('应该能够输入多行文本', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      const input = page.locator('#input');
      
      // 输入文本后按 Shift+Enter
      await input.fill('Line 1');
      await input.press('Shift+Enter');
      await input.type('Line 2');
      
      // 验证换行符存在
      const value = await input.inputValue();
      expect(value).toContain('\n');
    });

    test('点击粘贴区域应该聚焦输入框', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 点击粘贴区域
      await page.click('#paste-zone');
      
      // 输入框应该获得焦点
      const input = page.locator('#input');
      await expect(input).toBeFocused();
    });

  });

  test.describe('设置功能测试', () => {
    
    test('设置面板展开后服务器地址输入框应该可见', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 展开设置面板
      await page.click('#settings-btn');
      
      // 检查服务器地址输入框
      const serverUrlInput = page.locator('#server-url');
      await expect(serverUrlInput).toBeVisible();
      
      // 输入服务器地址
      await serverUrlInput.fill('http://localhost:3000');
      await expect(serverUrlInput).toHaveValue('http://localhost:3000');
    });

    test('设置面板展开后 API Key 输入框应该可见', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 展开设置面板
      await page.click('#settings-btn');
      
      // 检查 API Key 输入框
      const apiKeyInput = page.locator('#api-key');
      await expect(apiKeyInput).toBeVisible();
      
      // 输入 API Key
      await apiKeyInput.fill('test-api-key-123');
      await expect(apiKeyInput).toHaveValue('test-api-key-123');
    });

    test('保存按钮和清空历史按钮应该存在', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 展开设置面板
      await page.click('#settings-btn');
      
      // 检查按钮存在
      await expect(page.locator('#save-settings')).toBeVisible();
      await expect(page.locator('#clear-history')).toBeVisible();
    });

  });

  test.describe('消息显示区域测试', () => {
    
    test('消息容器应该存在', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 检查消息容器
      const messages = page.locator('#messages');
      await expect(messages).toBeVisible();
    });

  });

  test.describe('样式文件测试', () => {
    
    test('CSS 文件应该正确加载', async ({ page }) => {
      await page.goto('/sidepanel.html');
      
      // 检查 body 有样式（不是空白页面）
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // 检查 header 存在（说明 CSS 加载成功）
      await expect(page.locator('.header')).toBeVisible();
    });

  });

});