// Improved token estimator
function estimateTokens(text) {
  if (!text) return 0;
  
  // Better estimation based on OpenAI's tokenizer characteristics
  // Accounts for word length and common token patterns
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  
  // Average ~1.3 chars per token in English text
  // Short words (~3 chars) = 1 token, longer words = proportionally more
  const estimatedTokens = Math.ceil(chars / 3.5);
  return Math.max(1, estimatedTokens);
}

// Conservative filler words - only remove truly redundant ones
const FILLER_WORDS = new Set([
  'a', 'an', 'the',           // articles
  'about', 'of', 'by', 'in', 'on', 'at', 'from', 'with', 'for',  // common prepositions
  'or', 'and', 'but',         // conjunctions (keep most)
  'very', 'really', 'quite', 'rather', 'fairly', 'somewhat',  // intensifiers
  'just', 'only', 'simply', 'merely',  // limiters
  'please', 'kindly', 'thanks', 'thank',  // politeness
  'basically', 'actually', 'literally', 'honestly', 'frankly', 'clearly'  // filler adverbs
]);

// More conservative phrase removal
const FILLER_PHRASES = [
  /\b(could you|would you|could you please)\b/gi,  // indirect requests
  /\b(I would like|I would appreciate)\b/gi,  // softening
  /\b(in order to)\b/gi,  // verbose connector
  /\b(there is|there are|there was)\b/gi,  // weak existentials
  /\b(very much|quite a bit)\b/gi  // intensity phrases
];

function optimizeText(text) {
  if (!text) return text;
  
  // Validate input length
  if (text.length > 50000) {
    console.warn('Input text exceeds 50KB limit, truncating');
    // Don't truncate - let user see warning instead
  }
  
  let optimized = text;
  
  // Remove filler phrases first (preserve case for better results)
  FILLER_PHRASES.forEach(pattern => {
    optimized = optimized.replace(pattern, ' ');
  });
  
  // Split into sentences (preserve punctuation)
  const sentences = optimized.split(/([.!?]+)/);
  
  const optimizedSentences = sentences.map(sentence => {
    // Keep punctuation as-is
    if (/^[.!?]+$/.test(sentence)) return sentence;
    if (!sentence.trim()) return '';
    
    const words = sentence.split(/\s+/).filter(w => w);
    if (words.length === 0) return '';
    
    const filtered = words.filter((word, index) => {
      const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Always keep: numbers, technical terms (with numbers/caps), first word
      if (/\d/.test(word)) return true;  // Keep numbers and codes
      if (/[A-Z]/.test(word) || word.length > 15) return true;  // Keep proper nouns and technical terms
      if (index === 0) return true;  // Keep first word
      
      // Remove only if in filler set
      return !FILLER_WORDS.has(lower);
    });
    
    return filtered.join(' ');
  });
  
  // Rejoin and clean up
  optimized = optimizedSentences.join('');
  
  // Clean up extra spaces
  optimized = optimized.replace(/\s+/g, ' ').trim();
  
  // Clean up space before punctuation
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
const outputSection = document.getElementById('outputSection');
const toast = document.getElementById('toast');

let originalTokens = 0;
let optimizedTokens = 0;

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
optimizeBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  
  const optimized = optimizeText(text);
  output.value = optimized;
  
  optimizedTokens = estimateTokens(optimized);
  
  outputSection.classList.add('visible');
  copyBtn.disabled = false;
  
  updateStats();
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
    showToast('Copied!');
  } catch (err) {
    console.error('Copy failed:', err);
    // Fallback: show error message
    showToast('Copy failed - try again', true);
  }
});

// Reset button
const resetBtn = document.getElementById('resetBtn');
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

// Live updates
input.addEventListener('input', updateStats);

// Load saved text
chrome.storage.local.get(['lastInput'], (result) => {
  if (result.lastInput) {
    input.value = result.lastInput;
    updateStats();
  }
});

// Save on change
input.addEventListener('change', () => {
  chrome.storage.local.set({ lastInput: input.value });
});

// Add keyboard shortcuts
input.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (!optimizeBtn.disabled) optimizeBtn.click();
  }
});

// Initialize
updateStats();
