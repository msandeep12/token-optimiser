// Background Service Worker for Chrome Extension

// Create context menu items
chrome.contextMenus.create({
  id: "tokenizer-main",
  title: "Token Optimizer",
  contexts: ["selection"]
});

chrome.contextMenus.create({
  id: "tokenizer-optimize",
  title: "Optimize Text",
  parentId: "tokenizer-main",
  contexts: ["selection"]
});

chrome.contextMenus.create({
  id: "tokenizer-count",
  title: "Count Tokens",
  parentId: "tokenizer-main",
  contexts: ["selection"]
});

chrome.contextMenus.create({
  id: "tokenizer-copy-optimized",
  title: "Optimize & Copy",
  parentId: "tokenizer-main",
  contexts: ["selection"]
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
  const tokens = estimateTokens(text);
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
  const optimized = optimizeTextDefault(text);
  chrome.storage.local.set({
    lastOptimized: optimized,
    lastTokens: estimateTokens(optimized)
  });
  
  // Copy to clipboard
  if (navigator.clipboard) {
    navigator.clipboard.writeText(optimized).then(() => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.svg',
        title: 'Copied to Clipboard',
        message: 'Optimized text copied!'
      });
    });
  }
}

// Token estimator (mirrors popup.js)
function estimateTokens(text) {
  if (!text) return 0;
  const chars = text.length;
  return Math.ceil(chars / 3.5);
}

// Default optimization (balanced)
function optimizeTextDefault(text) {
  const FILLER_WORDS = new Set([
    'a', 'an', 'the', 'about', 'of', 'by', 'in', 'on', 'at', 'from', 'with', 'for',
    'or', 'and', 'but', 'very', 'really', 'quite', 'rather', 'fairly', 'somewhat',
    'just', 'only', 'simply', 'merely', 'please', 'kindly', 'thanks', 'thank',
    'basically', 'actually', 'literally', 'honestly', 'frankly', 'clearly'
  ]);

  const FILLER_PHRASES = [
    /\b(could you|would you|could you please)\b/gi,
    /\b(I would like|I would appreciate)\b/gi,
    /\b(in order to)\b/gi,
    /\b(there is|there are|there was)\b/gi,
    /\b(very much|quite a bit)\b/gi
  ];

  let optimized = text;
  
  FILLER_PHRASES.forEach(pattern => {
    optimized = optimized.replace(pattern, ' ');
  });

  const sentences = optimized.split(/([.!?]+)/);
  
  const optimizedSentences = sentences.map(sentence => {
    if (/^[.!?]+$/.test(sentence)) return sentence;
    if (!sentence.trim()) return '';
    
    const words = sentence.split(/\s+/).filter(w => w);
    if (words.length === 0) return '';
    
    const filtered = words.filter((word, index) => {
      const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (/\d/.test(word)) return true;
      if (/[A-Z]/.test(word) || word.length > 15) return true;
      if (index === 0) return true;
      return !FILLER_WORDS.has(lower);
    });
    
    return filtered.join(' ');
  });

  optimized = optimizedSentences.join('');
  optimized = optimized.replace(/\s+/g, ' ').trim();
  optimized = optimized.replace(/\s+([.!?,;:])/g, '$1');
  
  return optimized;
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
