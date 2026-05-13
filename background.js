// Background Service Worker for Chrome Extension
importScripts('optimizer-core.js');

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'tokenizer-main',
      title: 'Token Optimizer',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'tokenizer-optimize',
      title: 'Optimize Text',
      parentId: 'tokenizer-main',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'tokenizer-count',
      title: 'Count Tokens',
      parentId: 'tokenizer-main',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'tokenizer-copy-optimized',
      title: 'Optimize & Copy',
      parentId: 'tokenizer-main',
      contexts: ['selection']
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const selectedText = info.selectionText;
  
  switch(info.menuItemId) {
    case "tokenizer-optimize":
      openOptimizer(selectedText, tab.id);
      break;
    case "tokenizer-count":
      showTokenCount(selectedText);
      break;
    case "tokenizer-copy-optimized":
      optimizeAndCopy(selectedText, tab.id);
      break;
  }
});

// Open optimizer with selected text
function openOptimizer(text, tabId) {
  chrome.storage.local.set({
    pendingText: text,
    sourceTabId: tabId
  }, () => {
    chrome.action.openPopup();
  });
}

// Show token count
function showTokenCount(text) {
  const tokens = TokenOptimizer.estimateTokens(text);
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.svg',
    title: 'Token Count',
    message: `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
    contextMessage: `${tokens} tokens estimated`
  });
}

// Optimize text and copy
function optimizeAndCopy(text, tabId) {
  const optimized = TokenOptimizer.optimizeText(text, 'medium');
  chrome.storage.local.set({
    lastOptimized: optimized,
    lastTokens: TokenOptimizer.estimateTokens(optimized)
  });

  if (!tabId) return;

  chrome.tabs.sendMessage(
    tabId,
    { action: 'copyOptimizedText', text: optimized },
    () => {
      if (chrome.runtime.lastError) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.svg',
          title: 'Copy Failed',
          message: 'Unable to copy on this page. Use popup Copy button.'
        });
        return;
      }

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.svg',
        title: 'Copied to Clipboard',
        message: 'Optimized text copied!'
      });
    }
  );
}

// Listen for tab updates to inject content script on AI sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const aiSites = [
      'chatgpt.com', 'chat.openai.com', 'claude.ai',
      'copilot.microsoft.com', 'bing.com/chat', 'gemini.google.com'
    ];
    
    const isAISite = aiSites.some(site => tab.url?.includes(site));
    
    if (isAISite) {
      chrome.storage.local.set({ currentPageIsAI: true });
    } else {
      chrome.storage.local.set({ currentPageIsAI: false });
    }
  }
});
