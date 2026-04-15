/**
 * Test Setup - Vitest 全局设置
 */

// 使用 jsdom 环境时，不需要手动 mock 浏览器 API
// vitest 会自动提供基本的浏览器环境

// 如果需要额外的 mock，可以在这里添加
// 例如：mock chrome API

if (typeof global.chrome === 'undefined') {
  global.chrome = {
    storage: {
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        onChanged: {
          addListener: () => {}
        }
      },
      runtime: {
        onInstalled: { addListener: () => {} },
        onMessage: { addListener: () => {} }
      },
      contextMenus: {
        create: () => {},
        onClicked: { addListener: () => {} }
      },
      commands: {
        onCommand: { addListener: () => {} }
      },
      sidePanel: {
        setPanelBehavior: () => {}
      },
      tabs: {
        query: () => Promise.resolve([{ id: 1 }])
      },
      scripting: {
        executeScript: () => Promise.resolve([{ result: 'test' }])
      }
    }
  };
}