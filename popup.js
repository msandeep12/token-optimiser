const { estimateTokens, optimizeText } = TokenOptimizer;

// DOM elements
const input = document.getElementById('input');
const output = document.getElementById('output');
const tokenCount = document.getElementById('tokenCount');
const wordCount = document.getElementById('wordCount');
const savings = document.getElementById('savings');
const optimizeBtn = document.getElementById('optimizeBtn');
const copyBtn = document.getElementById('copyBtn');
const resetBtn = document.getElementById('resetBtn');
const outputSection = document.getElementById('outputSection');
const toast = document.getElementById('toast');
const historySelect = document.getElementById('historySelect');
const useHistoryBtn = document.getElementById('useHistoryBtn');
const copyHistoryBtn = document.getElementById('copyHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const bestQualityModel = document.getElementById('bestQualityModel');
const bestQualityReason = document.getElementById('bestQualityReason');
const bestValueModel = document.getElementById('bestValueModel');
const bestValueReason = document.getElementById('bestValueReason');
const modelSuggestNote = document.getElementById('modelSuggestNote');

// Compression level radio buttons
const compressionRadios = document.querySelectorAll('input[name="compression"]');
let currentCompressionLevel = 'medium';

let originalTokens = 0;
let optimizedTokens = 0;
let clipboardHistory = [];
const CLIPBOARD_HISTORY_KEY = 'clipboardHistory';
const CLIPBOARD_HISTORY_LIMIT = 20;

const MODEL_POLICY = {
  coding: {
    quality: { name: 'Claude Sonnet / GPT-4.1+', reason: 'Strong code reasoning and reliable structured outputs.' },
    value: { name: 'GPT-4.1 mini / Gemini Flash', reason: 'Good code help with lower latency and cost.' }
  },
  analysis: {
    quality: { name: 'GPT-5 / Claude Opus', reason: 'Best for multi-step reasoning and nuanced synthesis.' },
    value: { name: 'Claude Sonnet / GPT-4.1', reason: 'Balanced depth, speed, and token efficiency.' }
  },
  creative: {
    quality: { name: 'GPT-5 / Claude Opus', reason: 'Better style control and richer long-form output.' },
    value: { name: 'Claude Sonnet / GPT-4.1 mini', reason: 'Good creativity with better cost profile.' }
  },
  summarization: {
    quality: { name: 'GPT-4.1 / Claude Sonnet', reason: 'Strong compression while preserving key details.' },
    value: { name: 'Gemini Flash / GPT-4.1 mini', reason: 'Fast concise summaries at lower token cost.' }
  },
  extraction: {
    quality: { name: 'GPT-4.1 / Claude Sonnet', reason: 'Consistent structured extraction and formatting.' },
    value: { name: 'GPT-4.1 mini / Gemini Flash', reason: 'Efficient for repeatable parsing tasks.' }
  },
  chat: {
    quality: { name: 'Claude Sonnet / GPT-4.1', reason: 'Reliable all-round responses for mixed prompts.' },
    value: { name: 'GPT-4.1 mini / Gemini Flash', reason: 'Solid general answers with lower usage.' }
  }
};

// Load compression level preference
chrome.storage.local.get(['compressionLevel'], (result) => {
  if (result.compressionLevel) {
    currentCompressionLevel = result.compressionLevel;
    document.getElementById(currentCompressionLevel).checked = true;
  }
});

// Handle compression level change
compressionRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    currentCompressionLevel = e.target.value;
    chrome.storage.local.set({ compressionLevel: currentCompressionLevel });
    
    // Re-optimize if already optimized
    if (optimizedTokens > 0 && output.value) {
      optimizePrompt();
    }
  });
});

// Update stats
function updateStats() {
  const text = input.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tokens = estimateTokens(text);
  
  wordCount.textContent = words;
  tokenCount.textContent = tokens;
  originalTokens = tokens;
  
  if (optimizedTokens > 0 && originalTokens > 0) {
    const saved = ((originalTokens - optimizedTokens) / originalTokens * 100).toFixed(0);
    savings.textContent = `${saved}%`;
  } else {
    savings.textContent = '-';
  }
  
  optimizeBtn.disabled = !text.trim();
  updateModelSuggestion(text);
}

function detectPromptType(text) {
  const lower = text.toLowerCase();
  const codeSignals = /\b(code|debug|bug|stack trace|refactor|function|class|api|sql|javascript|typescript|python|java|c\+\+)\b/;
  const summarySignals = /\b(summarize|summary|tl;dr|condense|shorten|brief)\b/;
  const extractionSignals = /\b(extract|list|json|table|fields|entities|parse|schema)\b/;
  const creativeSignals = /\b(story|poem|creative|rewrite|tone|style|script|lyrics)\b/;
  const analysisSignals = /\b(compare|evaluate|tradeoff|strategy|plan|analyze|analysis|reason)\b/;

  if (codeSignals.test(lower)) return 'coding';
  if (extractionSignals.test(lower)) return 'extraction';
  if (summarySignals.test(lower)) return 'summarization';
  if (creativeSignals.test(lower)) return 'creative';
  if (analysisSignals.test(lower)) return 'analysis';
  return 'chat';
}

function estimateComplexity(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const multiPart = (text.match(/\b(and|also|plus|then|while|after)\b/gi) || []).length;
  const punctuationHeavy = (text.match(/[;:(){}\[\]]/g) || []).length;
  const score = words + (multiPart * 4) + (punctuationHeavy * 3);
  if (score >= 90) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

function updateModelSuggestion(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    bestQualityModel.textContent = '-';
    bestValueModel.textContent = '-';
    bestQualityReason.textContent = 'Add a prompt to get a recommendation.';
    bestValueReason.textContent = 'Add a prompt to get a recommendation.';
    modelSuggestNote.textContent = 'Heuristic recommendation using prompt type and length.';
    return;
  }

  const promptType = detectPromptType(trimmed);
  const complexity = estimateComplexity(trimmed);
  const policy = MODEL_POLICY[promptType] || MODEL_POLICY.chat;
  const estTokens = estimateTokens(trimmed);
  let quality = policy.quality;
  let value = policy.value;

  // Make recommendations adapt to size/complexity, not only task type.
  if (complexity === 'high' || estTokens > 1200) {
    quality = { name: 'GPT-5 / Claude Opus', reason: 'Large or complex prompt benefits from deeper reasoning and long-context quality.' };
    value = { name: 'Claude Sonnet / GPT-4.1', reason: 'Good balance for heavy prompts with better token efficiency than frontier models.' };
  } else if (complexity === 'medium' || estTokens > 350) {
    quality = { name: 'Claude Sonnet / GPT-4.1', reason: 'Strong quality for multi-part prompts without max-cost model overhead.' };
    value = { name: 'GPT-4.1 mini / Gemini Flash', reason: 'Cost-efficient for moderate prompts while keeping good output quality.' };
  }

  bestQualityModel.textContent = quality.name;
  bestValueModel.textContent = value.name;
  bestQualityReason.textContent = quality.reason;
  bestValueReason.textContent = value.reason;
  modelSuggestNote.textContent = `Type: ${promptType} | Complexity: ${complexity} | Estimated prompt tokens: ${estTokens}`;
}

// Optimize button
function optimizePrompt() {
  const text = input.value.trim();
  if (!text) return;
  
  const optimized = optimizeText(text, currentCompressionLevel);
  output.value = optimized;
  
  optimizedTokens = estimateTokens(optimized);
  
  outputSection.classList.add('visible');
  copyBtn.disabled = false;
  pushClipboardHistory(text, 'prompt');
  pushClipboardHistory(optimized, 'optimized');
  updateModelSuggestion(text);
  
  updateStats();
}

optimizeBtn.addEventListener('click', optimizePrompt);

function renderClipboardHistory() {
  const previousSelection = historySelect.value;
  historySelect.innerHTML = '';

  if (!clipboardHistory.length) {
    historySelect.innerHTML = '<option value="">No recent items</option>';
    return;
  }

  clipboardHistory.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `[${item.kind}] ${item.preview}`;
    historySelect.appendChild(option);
  });

  if (previousSelection) {
    historySelect.value = previousSelection;
  }
}

function saveClipboardHistory() {
  chrome.storage.local.set({ [CLIPBOARD_HISTORY_KEY]: clipboardHistory });
}

function loadClipboardHistory() {
  chrome.storage.local.get([CLIPBOARD_HISTORY_KEY], (result) => {
    const stored = result[CLIPBOARD_HISTORY_KEY];
    clipboardHistory = Array.isArray(stored) ? stored : [];
    renderClipboardHistory();
  });
}

function pushClipboardHistory(text, kind) {
  const normalized = (text || '').trim();
  if (!normalized) return;

  const duplicateIndex = clipboardHistory.findIndex((item) => item.text === normalized && item.kind === kind);
  if (duplicateIndex >= 0) {
    clipboardHistory.splice(duplicateIndex, 1);
  }

  const preview = normalized.length > 80 ? `${normalized.slice(0, 80)}...` : normalized;
  clipboardHistory.unshift({
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    text: normalized,
    preview,
    createdAt: new Date().toISOString()
  });

  if (clipboardHistory.length > CLIPBOARD_HISTORY_LIMIT) {
    clipboardHistory = clipboardHistory.slice(0, CLIPBOARD_HISTORY_LIMIT);
  }

  saveClipboardHistory();
  renderClipboardHistory();
}

// Copy button with better error handling
copyBtn.addEventListener('click', async () => {
  const text = output.value;
  if (!text) {
    showToast('Nothing to copy', true);
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    pushClipboardHistory(text, 'optimized');
    showToast('Copied!');
  } catch (err) {
    console.error('Copy failed:', err);
    showToast('Copy failed - try again', true);
  }
});

useHistoryBtn.addEventListener('click', () => {
  const selectedId = historySelect.value;
  if (!selectedId) {
    showToast('Select a history item', true);
    return;
  }

  const selected = clipboardHistory.find((item) => item.id === selectedId);
  if (!selected) {
    showToast('History item not found', true);
    return;
  }

  input.value = selected.text;
  output.value = '';
  outputSection.classList.remove('visible');
  copyBtn.disabled = true;
  optimizedTokens = 0;
  updateStats();
  updateModelSuggestion(input.value);
  showToast('History item loaded');
});

copyHistoryBtn.addEventListener('click', async () => {
  const selectedId = historySelect.value;
  if (!selectedId) {
    showToast('Select a history item', true);
    return;
  }

  const selected = clipboardHistory.find((item) => item.id === selectedId);
  if (!selected) {
    showToast('History item not found', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(selected.text);
    pushClipboardHistory(selected.text, selected.kind);
    showToast('Copied from history');
  } catch (err) {
    console.error('History copy failed:', err);
    showToast('Copy failed - try again', true);
  }
});

clearHistoryBtn.addEventListener('click', () => {
  clipboardHistory = [];
  saveClipboardHistory();
  renderClipboardHistory();
  showToast('History cleared');
});

// Reset button
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    outputSection.classList.remove('visible');
    copyBtn.disabled = true;
    optimizedTokens = 0;
    updateStats();
  });
}

// Toast notification helper
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.add('show');
  if (isError) toast.classList.add('error');
  setTimeout(() => {
    toast.classList.remove('show', 'error');
  }, 2000);
}

// Keyboard shortcuts
input.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (!optimizeBtn.disabled) optimizeBtn.click();
  }
});

// Live updates
input.addEventListener('input', updateStats);

// Save input on change
input.addEventListener('change', () => {
  chrome.storage.local.set({ lastInput: input.value });
});

// Load previously saved text or pending text from context menu
chrome.storage.local.get(['lastInput', 'pendingText'], (result) => {
  if (result.pendingText) {
    input.value = result.pendingText;
    chrome.storage.local.remove(['pendingText']);
    updateStats();
    setTimeout(() => {
      optimizePrompt();
    }, 100);
  } else if (result.lastInput) {
    input.value = result.lastInput;
    updateStats();
  }
});

// Initialize
loadClipboardHistory();
updateStats();
