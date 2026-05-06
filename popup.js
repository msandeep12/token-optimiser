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
const promptNameInput = document.getElementById('promptNameInput');
const savePromptBtn = document.getElementById('savePromptBtn');
const savedPromptsSelect = document.getElementById('savedPromptsSelect');
const loadPromptBtn = document.getElementById('loadPromptBtn');
const deletePromptBtn = document.getElementById('deletePromptBtn');
const historySelect = document.getElementById('historySelect');
const useHistoryBtn = document.getElementById('useHistoryBtn');
const copyHistoryBtn = document.getElementById('copyHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Compression level radio buttons
const compressionRadios = document.querySelectorAll('input[name="compression"]');
let currentCompressionLevel = 'medium';

let originalTokens = 0;
let optimizedTokens = 0;
let promptLibrary = [];
const PROMPT_LIBRARY_KEY = 'promptLibrary';
let clipboardHistory = [];
const CLIPBOARD_HISTORY_KEY = 'clipboardHistory';
const CLIPBOARD_HISTORY_LIMIT = 20;

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
  
  updateStats();
}

optimizeBtn.addEventListener('click', optimizePrompt);

function renderPromptLibrary() {
  const previousSelection = savedPromptsSelect.value;
  savedPromptsSelect.innerHTML = '<option value="">Select saved prompt...</option>';

  promptLibrary.forEach((prompt) => {
    const option = document.createElement('option');
    option.value = prompt.id;
    option.textContent = prompt.name;
    savedPromptsSelect.appendChild(option);
  });

  if (previousSelection) {
    savedPromptsSelect.value = previousSelection;
  }
}

function loadPromptLibrary() {
  chrome.storage.local.get([PROMPT_LIBRARY_KEY], (result) => {
    const storedPrompts = result[PROMPT_LIBRARY_KEY];
    promptLibrary = Array.isArray(storedPrompts) ? storedPrompts : [];
    renderPromptLibrary();
  });
}

function savePromptLibrary() {
  chrome.storage.local.set({ [PROMPT_LIBRARY_KEY]: promptLibrary });
}

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

function makePromptId() {
  return `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

savePromptBtn.addEventListener('click', () => {
  const text = input.value.trim();
  const name = promptNameInput.value.trim();

  if (!text) {
    showToast('Enter prompt text first', true);
    return;
  }
  if (!name) {
    showToast('Enter a prompt name', true);
    return;
  }

  const existingIndex = promptLibrary.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
  const now = new Date().toISOString();

  if (existingIndex >= 0) {
    promptLibrary[existingIndex] = {
      ...promptLibrary[existingIndex],
      name,
      text,
      updatedAt: now
    };
    showToast('Prompt updated');
  } else {
    promptLibrary.unshift({
      id: makePromptId(),
      name,
      text,
      createdAt: now,
      updatedAt: now
    });
    showToast('Prompt saved');
  }

  savePromptLibrary();
  renderPromptLibrary();
  const savedItem = promptLibrary.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (savedItem) savedPromptsSelect.value = savedItem.id;
});

loadPromptBtn.addEventListener('click', () => {
  const selectedId = savedPromptsSelect.value;
  if (!selectedId) {
    showToast('Select a saved prompt', true);
    return;
  }

  const selectedPrompt = promptLibrary.find((p) => p.id === selectedId);
  if (!selectedPrompt) {
    showToast('Prompt not found', true);
    return;
  }

  input.value = selectedPrompt.text;
  promptNameInput.value = selectedPrompt.name;
  output.value = '';
  outputSection.classList.remove('visible');
  copyBtn.disabled = true;
  optimizedTokens = 0;
  updateStats();
  showToast('Prompt loaded');
});

deletePromptBtn.addEventListener('click', () => {
  const selectedId = savedPromptsSelect.value;
  if (!selectedId) {
    showToast('Select a saved prompt', true);
    return;
  }

  const initialLength = promptLibrary.length;
  promptLibrary = promptLibrary.filter((p) => p.id !== selectedId);
  if (promptLibrary.length === initialLength) {
    showToast('Prompt not found', true);
    return;
  }

  savePromptLibrary();
  renderPromptLibrary();
  showToast('Prompt deleted');
});

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
loadPromptLibrary();
loadClipboardHistory();
updateStats();
