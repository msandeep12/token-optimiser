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

// Compression level definitions with enhanced phrase removal
const COMPRESSION_LEVELS = {
  light: {
    fillerWords: new Set([
      'the', 'a', 'an'
    ]),
    fillerPhrases: [],
    description: 'Minimal - articles only'
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
      /\b(could you|would you|could you please|would you mind)\b/gi,
      /\b(I would like|I would appreciate|I would love)\b/gi,
      /\b(I hope|I wanted|I was wondering)\b/gi,
      /\b(in order to|so as to)\b/gi,
      /\b(there is|there are|there was|there were)\b/gi,
      /\b(very much|quite a bit|a lot)\b/gi
    ],
    description: 'Balanced - removes filler & politeness'
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
      'basically', 'actually', 'literally', 'honestly', 'frankly', 'clearly', 'obviously', 'i', 'we', 'you', 'me'
    ]),
    fillerPhrases: [
      /\b(could you|would you|can you|will you|would you please|could you please|can you please)\b/gi,
      /\b(I would like|I would appreciate|I would love|I want to|I need to)\b/gi,
      /\b(I think|I believe|I suppose|I imagine|I guess)\b/gi,
      /\b(I hope|I was wondering|I wanted to ask)\b/gi,
      /\b(in order to|so as to|for the purpose of)\b/gi,
      /\b(there is|there are|there was|there were|there be)\b/gi,
      /\b(it is|it was|it has been)\b/gi,
      /\b(very much|quite a bit|a lot|so much)\b/gi,
      /\b(kind of|sort of|type of|kind|sort)\b/gi,
      /\b(I believe|I think|seems like|appears to be)\b/gi,
      /\b(and then|and also|plus also)\b/gi,
      /\b(as well|too much|too many)\b/gi
    ],
    description: 'Maximum - removes helpers & weak language'
  },
  direct: {
    fillerWords: new Set([
      'a', 'an', 'the',
      'about', 'of', 'by', 'in', 'on', 'at', 'from', 'with', 'for',
      'or', 'and', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might',
      'very', 'really', 'quite', 'rather', 'fairly', 'somewhat', 'extremely', 'so', 'very', 'just',
      'just', 'only', 'simply', 'merely', 'perhaps', 'maybe', 'certain', 'sure',
      'please', 'kindly', 'thanks', 'thank', 'sorry', 'appreciate',
      'basically', 'actually', 'literally', 'honestly', 'frankly', 'clearly', 'obviously', 'apparently',
      'i', 'we', 'you', 'me', 'us', 'him', 'her', 'them', 'it', 'this', 'that', 'these', 'those',
      'well', 'now', 'then', 'also', 'still', 'however'
    ]),
    fillerPhrases: [
      /\bI\s+(would|want|need|think|believe|suppose|imagine|guess|hope|was\s+wondering)\b/gi,
      /\b(could\s+you|would\s+you|can\s+you|will\s+you|may\s+I|might\s+I)\b/gi,
      /\b(please|kindly|humbly)\s*,?\s+(help|assist|show|explain|tell|provide|give)\b/gi,
      /,?\s*(if\s+you\s+don't\s+mind|if\s+possible|if\s+you\s+have\s+time)\b/gi,
      /\b(in\s+order\s+to|so\s+as\s+to|for\s+the\s+purpose\s+of|to\s+be\s+able\s+to)\b/gi,
      /\b(there\s+is|there\s+are|there\s+was|there\s+were|there\s+exists)\b/gi,
      /\b(it\s+is|it\s+was|it\s+has|it\s+being)\b/gi,
      /\b(very\s+much|quite\s+a\s+bit|a\s+lot|so\s+much|so\s+many)\b/gi,
      /\b(kind\s+of|sort\s+of|type\s+of|seems\s+like|appears\s+to\s+be|looks\s+like)\b/gi,
      /\b(I\s+(believe|think|suppose|imagine|guess)|seems\s+like|appears\s+that|looks\s+like)\b/gi,
      /\b(and\s+then|and\s+also|plus\s+also|in\s+addition|additionally)\b/gi,
      /,?\s*(as\s+well|too|as\s+well\s+as|in\s+addition)\b/gi,
      /\b(would\s+be\s+able|could\s+you\s+possibly|might\s+you\s+be\s+able)\b/gi,
      /\b(thanks?\s+(you|a\s+lot|so\s+much)|thank\s+you\s+(very\s+much|in\s+advance))\b/gi,
      /\b(sorry\s+(if|for)|I\s+apologize|pardon\s+me)\b/gi
    ],
    description: 'Ultra-Direct - get to the point immediately!'
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
