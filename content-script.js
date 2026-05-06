// Content Script - Injected into AI sites

(function() {
  'use strict';

  // Detect which AI platform we're on
  const platform = detectPlatform();
  
  if (!platform) return;

  // Create floating button
  const button = createOptimizerButton();
  document.body.appendChild(button);

  // Listen for context menu messages
  chrome.runtime.onMessage?.addListener((request, sender, sendResponse) => {
    if (request.action === 'optimizeSelection') {
      const selection = window.getSelection().toString();
      if (selection) {
        injectOptimizationUI(selection);
        sendResponse({ success: true });
      }
    }
  });

  function detectPlatform() {
    const url = window.location.hostname;
    
    if (url.includes('chatgpt.com') || url.includes('chat.openai.com')) {
      return 'chatgpt';
    } else if (url.includes('claude.ai')) {
      return 'claude';
    } else if (url.includes('copilot.microsoft.com')) {
      return 'copilot';
    } else if (url.includes('bing.com') && url.includes('chat')) {
      return 'bing';
    } else if (url.includes('gemini.google.com')) {
      return 'gemini';
    }
    
    return null;
  }

  function createOptimizerButton() {
    const container = document.createElement('div');
    container.id = 'token-optimizer-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    const button = document.createElement('button');
    button.id = 'token-optimizer-button';
    button.textContent = '⚡ Optimize';
    button.style.cssText = `
      padding: 12px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      transition: all 0.2s;
      hover: {
        background: #2563eb;
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
      }
    `;

    button.addEventListener('mouseover', () => {
      button.style.background = '#2563eb';
      button.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
    });

    button.addEventListener('mouseout', () => {
      button.style.background = '#3b82f6';
      button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
    });

    button.addEventListener('click', () => {
      const selection = window.getSelection().toString();
      if (selection) {
        injectOptimizationUI(selection);
      } else {
        button.textContent = '📋 Select text first';
        setTimeout(() => {
          button.textContent = '⚡ Optimize';
        }, 2000);
      }
    });

    container.appendChild(button);
    return container;
  }

  function injectOptimizationUI(selectedText) {
    // Remove existing UI if present
    const existing = document.getElementById('token-optimizer-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'token-optimizer-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      background: #1a1a1a;
      border: 1px solid #444;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      font-family: system-ui, -apple-system, sans-serif;
      color: #e0e0e0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    `;

    const overlay = document.createElement('div');
    overlay.id = 'token-optimizer-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
    `;

    const title = document.createElement('h2');
    title.textContent = '⚡ Token Optimizer';
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #fff;
    `;

    const stats = document.createElement('div');
    const originalTokens = Math.ceil(selectedText.length / 3.5);
    stats.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: #252525; padding: 12px; border-radius: 6px;">
          <div style="color: #888; font-size: 11px; margin-bottom: 4px;">ORIGINAL</div>
          <div style="font-size: 16px; font-weight: 600;">${originalTokens}</div>
        </div>
      </div>
    `;

    const label = document.createElement('label');
    label.textContent = 'Compression Level:';
    label.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      color: #888;
      text-transform: uppercase;
    `;

    const select = document.createElement('select');
    select.id = 'compression-level';
    select.style.cssText = `
      width: 100%;
      padding: 10px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 6px;
      color: #e0e0e0;
      margin-bottom: 16px;
      font-size: 14px;
    `;

    ['light', 'medium', 'aggressive'].forEach(level => {
      const option = document.createElement('option');
      option.value = level;
      option.textContent = level.charAt(0).toUpperCase() + level.slice(1);
      if (level === 'medium') option.selected = true;
      select.appendChild(option);
    });

    const previewLabel = document.createElement('label');
    previewLabel.textContent = 'Preview:';
    previewLabel.style.cssText = `
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      color: #888;
      text-transform: uppercase;
    `;

    const preview = document.createElement('textarea');
    preview.readOnly = true;
    preview.style.cssText = `
      width: 100%;
      height: 120px;
      padding: 12px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 6px;
      color: #e0e0e0;
      font-size: 13px;
      resize: none;
      margin-bottom: 16px;
      font-family: monospace;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
    `;

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy';
    copyBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: #555;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    `;

    // Update preview on level change
    const updatePreview = () => {
      const level = select.value;
      const optimized = optimizeTextWithLevel(selectedText, level);
      const optimizedTokens = Math.ceil(optimized.length / 3.5);
      const savings = Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100);
      
      preview.value = optimized;
      stats.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="background: #252525; padding: 12px; border-radius: 6px;">
            <div style="color: #888; font-size: 11px; margin-bottom: 4px;">ORIGINAL</div>
            <div style="font-size: 16px; font-weight: 600;">${originalTokens}</div>
          </div>
          <div style="background: #252525; padding: 12px; border-radius: 6px;">
            <div style="color: #888; font-size: 11px; margin-bottom: 4px;">OPTIMIZED</div>
            <div style="font-size: 16px; font-weight: 600;">${optimizedTokens}</div>
          </div>
          <div style="background: #252525; padding: 12px; border-radius: 6px;">
            <div style="color: #888; font-size: 11px; margin-bottom: 4px;">SAVED</div>
            <div style="font-size: 16px; font-weight: 600; color: #4ade80;">${savings}%</div>
          </div>
        </div>
      `;
    };

    select.addEventListener('change', updatePreview);

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(preview.value).then(() => {
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      });
    });

    closeBtn.addEventListener('click', () => {
      modal.remove();
      overlay.remove();
    });

    overlay.addEventListener('click', () => {
      modal.remove();
      overlay.remove();
    });

    modal.appendChild(title);
    modal.appendChild(stats);
    modal.appendChild(label);
    modal.appendChild(select);
    modal.appendChild(previewLabel);
    modal.appendChild(preview);
    modal.appendChild(buttonContainer);
    buttonContainer.appendChild(copyBtn);
    buttonContainer.appendChild(closeBtn);

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    updatePreview();
  }

  function optimizeTextWithLevel(text, level) {
    const FILLER_WORDS = {
      light: new Set(['the', 'a', 'an']),
      medium: new Set([
        'a', 'an', 'the', 'about', 'of', 'by', 'in', 'on', 'at', 'from', 'with', 'for',
        'very', 'really', 'quite', 'rather', 'fairly', 'somewhat',
        'just', 'only', 'simply', 'merely', 'please', 'kindly'
      ]),
      aggressive: new Set([
        'a', 'an', 'the', 'about', 'of', 'by', 'in', 'on', 'at', 'from', 'with', 'for',
        'or', 'and', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
        'very', 'really', 'quite', 'rather', 'fairly', 'somewhat',
        'just', 'only', 'simply', 'merely', 'please', 'kindly', 'thank', 'thanks'
      ])
    };

    const FILLER_PHRASES = {
      light: [],
      medium: [
        /\b(could you|would you)\b/gi,
        /\b(in order to)\b/gi
      ],
      aggressive: [
        /\b(could you|would you|can you)\b/gi,
        /\b(I would like|I want to|I need|I think)\b/gi,
        /\b(in order to)\b/gi,
        /\b(there is|there are|there was)\b/gi,
        /\b(very much|quite a bit)\b/gi
      ]
    };

    let optimized = text;
    const words = FILLER_WORDS[level] || FILLER_WORDS.medium;
    const phrases = FILLER_PHRASES[level] || FILLER_PHRASES.medium;

    phrases.forEach(pattern => {
      optimized = optimized.replace(pattern, ' ');
    });

    const sentences = optimized.split(/([.!?]+)/);
    
    const optimizedSentences = sentences.map(sentence => {
      if (/^[.!?]+$/.test(sentence)) return sentence;
      if (!sentence.trim()) return '';
      
      const wordArray = sentence.split(/\s+/).filter(w => w);
      if (wordArray.length === 0) return '';
      
      const filtered = wordArray.filter((word, index) => {
        const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (/\d/.test(word)) return true;
        if (/[A-Z]/.test(word) || word.length > 15) return true;
        if (index === 0) return true;
        return !words.has(lower);
      });
      
      return filtered.join(' ');
    });

    optimized = optimizedSentences.join('');
    optimized = optimized.replace(/\s+/g, ' ').trim();
    optimized = optimized.replace(/\s+([.!?,;:])/g, '$1');
    
    return optimized;
  }
})();
