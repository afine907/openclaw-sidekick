// OpenClaw Sidebar - Background Script (Service Worker)
// ======================================================

// Default OpenClaw proxy URL
let serverUrl = 'http://localhost:4000';
let apiKey = null;

// Load saved settings on startup
chrome.storage.local.get(['serverUrl', 'apiKey'], (result) => {
  if (result.serverUrl) {
    serverUrl = result.serverUrl;
  }
  if (result.apiKey) {
    apiKey = result.apiKey;
  }
});

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for selected text
  chrome.contextMenus.create({
    id: 'send-to-openclaw',
    title: '🦞 发送到 OpenClaw',
    contexts: ['selection']
  });

  // Context menu for images
  chrome.contextMenus.create({
    id: 'send-image-to-openclaw',
    title: '🦞 发送图片到 OpenClaw',
    contexts: ['image']
  });

  console.log('OpenClaw Sidekick extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'send-to-openclaw') {
    const selectedText = info.selectionText;
    if (selectedText) {
      // Open side panel first
      await chrome.sidePanel.open({ tabId: tab.id });
      // Send text to sidepanel after a short delay
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'SEND_TEXT',
          text: selectedText
        });
      }, 500);
    }
  }

  if (info.menuItemId === 'send-image-to-openclaw') {
    const imageUrl = info.srcUrl;
    if (imageUrl) {
      // Open side panel
      await chrome.sidePanel.open({ tabId: tab.id });
      
      // Fetch the image and convert to base64
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onload = () => {
          chrome.runtime.sendMessage({
            type: 'SEND_IMAGE',
            imageData: reader.result
          });
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Failed to fetch image:', error);
      }
    }
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (command === 'send-selection') {
    // Get selected text from current tab
    try {
      const [{ result: selectedText }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString()
      });

      if (selectedText) {
        await chrome.sidePanel.open({ tabId: tab.id });
        setTimeout(() => {
          chrome.runtime.sendMessage({
            type: 'SEND_TEXT',
            text: selectedText
          });
        }, 500);
      }
    } catch (error) {
      console.error('Failed to get selection:', error);
    }
  }
});

// Side panel behavior - allow on all tabs
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for settings updates
chrome.storage.onChanged.addListener((changes) => {
  if (changes.serverUrl) {
    serverUrl = changes.serverUrl.newValue;
  }
  if (changes.apiKey) {
    apiKey = changes.apiKey.newValue;
  }
});

// Handle messages from sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    sendResponse({ serverUrl, apiKey });
  }
  return true;
});
