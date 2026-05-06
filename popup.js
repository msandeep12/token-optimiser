// Better tokenizer with multiple algorithms

// OpenAI-style token counter (improved)
function estimateTokens(text) {
  if (!text) return 0;
  
  // More accurate token estimation based on GPT tokenization patterns
  // GPT uses subword tokenization - common patterns token count differently
  
  let tokenCount = 0;
  
  // Estimate based on character length (average 3.5 chars per token)
  tokenCount += Math.ceil(text.length / 3.5);
  
  // Add bonuses for punctuation (each punctuation is ~0.5 token)
  const punctuation = (text.match(/[.!?,;:\-()[\]{}]/g) || []).length;
  tokenCount += Math.ceil(punctuation * 0.5);
  
  // Subtract for common contractions and abbreviations (saves 1 token per)
  const contractions = (text.match(/['']s\b|n['']t\b|['']re\b|['']ve\b|['']ll\b|['']d\b/g) || []).length;
  tokenCount -= contractions;
  
  return Math.max(1, tokenCount);
}

// Compression level definitions
const COMPRESSION_LEVELS = {
  light: {
    fillerWords: new Set([
      'the', 'a', 'an'
    ]),
    fillerPhrases: [],
    description: 'Minimal compression - removes only articles'
  },
  medium: {
    fillerWords: new Set([
      'a', 'an', 'the',
      'about', 'of', 'by', 'in', 'on', 'at', 'from', 'with', 'for',
      'or', 'and', 'but',
      'very', 'really', 'quite', 'rather', 'fairly', 'somewhat',
      'just', 'only', 'simply', 'merely',
      'please', 'kindly', 'thanks', 'thank',
      'basically', 'actually', 'literally', 'honestly', 'frankly', 'clearly'
    ]),
    fillerPhrases: [
      /\b(could you|would you|could you please)\b/gi,
      /\b(I would like|I would appreciate)\b/gi,
      /\b(in order to)\b/gi,
      /\b(there is|there are|there was)\b/gi,
      /\b(very much|quite a bit)\b/gi
    ],
    description: 'Balanced compression - removes filler words and politeness'
  },
  aggressive: {
    fillerWords: new Set([
      'a', 'an', 'the',
      'about', 'of', 'by', 'in', 'on', 'at', 'from', 'with', 'for',
      'or', 'and', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did',
      'very', 'really', 'quite', 'rather', 'fairly', 'somewhat', 'extremely',
      'just', 'only', 'simply', 'merely', 'perhaps', 'maybe', 'could', 'might',
      'please', 'kindly', 'thanks', 'thank', 'sorry',
      'basically', 'actually', 'literally', 'honestly', 'frankly', 'clearly', 'obviously'
    ]),
    fillerPhrases: [
      /\b(could you|would you|can you|will you)\b/gi,
      /\b(I would like|I want to|I need to|I think|I believe)\b/gi,
      /\b(in order to|so as to)\b/gi,
      /\b(there is|there are|there was|there were)\b/gi,
      /\b(it is|it was)\b/gi,
      /\b(very much|quite a bit|a lot)\b/gi,
      /\b(kind of|sort of|kind|sort)\b/gi
    ],
    description: 'Maximum compression - removes many helper words'
  }
};

function optimizeText(text, level = 'medium') {
  if (!text) return text;
  
  const config = COMPRESSION_LEVELS[level] || COMPRESSION_LEVELS.medium;
  let optimized = text;
  
  // Remove filler phrases first
  config.fillerPhrases.forEach(pattern => {
    optimized = optimized.replace(pattern, ' ');
  });
  
  // Split into sentences while preserving punctuation
  const sentences = optimized.split(/([.!?]+)/);
  
  const optimizedSentences = sentences.map(sentence => {
    // Keep punctuation as-is
    if (/^[.!?]+$/.test(sentence)) return sentence;
    if (!sentence.trim()) return '';
    
    const words = sentence.split(/\s+/).filter(w => w);
    if (words.length === 0) return '';
    
    const filtered = words.filter((word, index) => {
      const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Always keep: numbers, technical terms, first word
      if (/\d/.test(word)) return true;
      if (/[A-Z]/.test(word) || word.length > 15) return true;
      if (index === 0) return true;
      
      // Remove if in filler set
      return !config.fillerWords.has(lower);
    });
    
    return filtered.join(' ');
  });
  
  // Rejoin and cleanup
  optimized = optimizedSentences.join('');
  optimized = optimized.replace(/\s+/g, ' ').trim();
  optimized = optimized.replace(/\s+([.!?,;:])/g, '$1');
  
  return optimized;
}

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

// Compression level radio buttons
const compressionRadios = document.querySelectorAll('input[name="compression"]');
let currentCompressionLevel = 'medium';

let originalTokens = 0;
let optimizedTokens = 0;

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
  
  updateStats();
}

optimizeBtn.addEventListener('click', optimizePrompt);

// Copy button with better error handling
copyBtn.addEventListener('click', async () => {
  const text = output.value;
  if (!text) {
    showToast('Nothing to copy', true);
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied!');
  } catch (err) {
    console.error('Copy failed:', err);
    showToast('Copy failed - try again', true);
  }
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
updateStats();
