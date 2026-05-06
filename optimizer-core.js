// Shared optimizer/token estimator used by popup, content script, and background.
(function initTokenOptimizer(globalScope) {
  const COMPRESSION_LEVELS = {
    light: {
      fillerWords: new Set(['the', 'a', 'an']),
      fillerPhrases: [],
      targetCompression: 0.12,
      minRetention: 0.72,
      minWordsRatio: 0.55,
      minCompressionFloor: 0.04
    },
    medium: {
      fillerWords: new Set([
        'a', 'an', 'the',
        'for', 'about', 'of', 'by', 'on', 'at', 'with',
        'very', 'really', 'quite', 'rather', 'fairly', 'somewhat',
        'also', 'so', 'much',
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
        /\b(very much|quite a bit|a lot|so much)\b/gi
      ],
      targetCompression: 0.28,
      minRetention: 0.6,
      minWordsRatio: 0.45,
      minCompressionFloor: 0.12
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
      targetCompression: 0.42,
      minRetention: 0.5,
      minWordsRatio: 0.36,
      minCompressionFloor: 0.2
    },
    direct: {
      fillerWords: new Set([
        'a', 'an', 'the',
        'about', 'of', 'by', 'in', 'on', 'at', 'from', 'with', 'for',
        'or', 'and', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might',
        'very', 'really', 'quite', 'rather', 'fairly', 'somewhat', 'extremely', 'so', 'just',
        'only', 'simply', 'merely', 'perhaps', 'maybe', 'certain', 'sure',
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
      targetCompression: 0.52,
      minRetention: 0.44,
      minWordsRatio: 0.3,
      minCompressionFloor: 0.28
    }
  };

  const PHRASE_REWRITES = [
    { pattern: /\b(could you please|could you|would you please|would you|can you please|can you)\b/gi, replacement: '' },
    { pattern: /\b(I was wondering if you could)\b/gi, replacement: '' },
    { pattern: /\b(I would like to|I'd like to|I want to|I need to)\b/gi, replacement: '' },
    { pattern: /\b(if possible|if you can|if you don't mind)\b/gi, replacement: '' },
    { pattern: /\b(in order to)\b/gi, replacement: 'to' },
    { pattern: /\b(a lot of)\b/gi, replacement: 'many' },
    { pattern: /\balso why\b/gi, replacement: 'why' },
    { pattern: /\b(thank you( very much| so much)?|thanks( a lot)?)\b/gi, replacement: '' }
  ];

  const NEGATION_WORDS = new Set(['not', 'never', 'no', 'without', 'except', 'cannot', "can't", "don't", "won't", "isn't", "aren't"]);
  const QUESTION_OPENERS = new Set(['how', 'what', 'why', 'when', 'where', 'who', 'which']);
  const LOCATION_PREPOSITIONS = new Set(['from', 'to', 'in', 'near', 'around', 'between']);
  const DURATION_UNITS = new Set(['day', 'days', 'night', 'nights', 'week', 'weeks', 'month', 'months', 'hour', 'hours']);
  const NUMBER_WORDS = new Set(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']);
  const COMMON_FUNCTION_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else',
    'in', 'on', 'at', 'to', 'from', 'for', 'with', 'of', 'by', 'as',
    'it', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'do', 'does', 'did', 'have', 'has', 'had',
    'will', 'would', 'can', 'could', 'should', 'may', 'might'
  ]);

  function estimateTokens(text) {
    if (!text) return 0;
    let tokenCount = Math.ceil(text.length / 3.5);
    const punctuation = (text.match(/[.!?,;:\-()[\]{}]/g) || []).length;
    tokenCount += Math.ceil(punctuation * 0.5);
    const contractions = (text.match(/['']s\b|n['']t\b|['']re\b|['']ve\b|['']ll\b|['']d\b/g) || []).length;
    tokenCount -= contractions;
    return Math.max(1, tokenCount);
  }

  function normalizeWord(word) {
    return (word || '').toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
  }

  function tokenize(sentence) {
    return (sentence || '').split(/\s+/).filter((w) => w);
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function isLikelyProper(word, index) {
    if (index === 0) return false;
    const clean = (word || '').replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
    return /^[A-Z][a-z]/.test(clean);
  }

  function isTechnicalToken(word) {
    const clean = (word || '').replace(/^[^\w]+|[^\w]+$/g, '');
    return /[_/@#<>={}()[\]:`]/.test(clean) ||
      /[a-z][A-Z]/.test(clean) ||
      /[A-Za-z]+\d+[A-Za-z0-9]*/.test(clean) ||
      /^https?:\/\//i.test(clean);
  }

  function hasLikelyVerb(value) {
    return /\b(is|are|was|were|be|being|been|have|has|had|do|does|did|need|want|make|build|plan|create|write|explain|find|show|help|optimize|track|save|reuse|book|travel|visit)\b/i.test(value || '');
  }

  function applyPhraseRewrites(text) {
    let rewritten = text;
    PHRASE_REWRITES.forEach(({ pattern, replacement }) => {
      rewritten = rewritten.replace(pattern, replacement);
    });
    return rewritten;
  }

  function applyFillerPhrases(text, fillerPhrases) {
    let output = text;
    fillerPhrases.forEach((pattern) => {
      output = output.replace(pattern, ' ');
    });
    return output;
  }

  function detectProtectedTerms(words) {
    const protectedTerms = new Set();

    words.forEach((rawWord, index) => {
      const key = normalizeWord(rawWord);
      if (!key) return;

      if (index === 0) protectedTerms.add(key);
      if (index === 0 && QUESTION_OPENERS.has(key)) protectedTerms.add(key);
      if (/\d/.test(rawWord)) protectedTerms.add(key);
      if (NEGATION_WORDS.has(key)) protectedTerms.add(key);
      if (isTechnicalToken(rawWord)) protectedTerms.add(key);

      if (DURATION_UNITS.has(key) && index > 0) {
        const prevRaw = words[index - 1];
        const prevKey = normalizeWord(prevRaw);
        if (/\d/.test(prevRaw) || NUMBER_WORDS.has(prevKey)) {
          if (prevKey) protectedTerms.add(prevKey);
          protectedTerms.add(key);
        }
      }

      if (LOCATION_PREPOSITIONS.has(key)) {
        protectedTerms.add(key);
        for (let j = index + 1; j < words.length && j <= index + 3; j += 1) {
          const nextKey = normalizeWord(words[j]);
          if (!nextKey) continue;
          if (j > index + 1 && COMMON_FUNCTION_WORDS.has(nextKey)) break;
          protectedTerms.add(nextKey);
          const clean = (words[j] || '').replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '');
          if (/[,.!?;:]$/.test(words[j])) break;
          if (j > index + 1 && !/^[A-Z]/.test(clean) && !/[-']/.test(clean)) break;
        }
      }
    });

    return protectedTerms;
  }

  function contentKeySet(words) {
    const set = new Set();
    words.forEach((word) => {
      const key = normalizeWord(word);
      if (key && !COMMON_FUNCTION_WORDS.has(key)) set.add(key);
    });
    return set;
  }

  function retainedContentRatio(originalWords, candidateWords) {
    const originalContent = contentKeySet(originalWords);
    if (originalContent.size === 0) return 1;
    const candidateContent = contentKeySet(candidateWords);
    let matched = 0;
    originalContent.forEach((key) => {
      if (candidateContent.has(key)) matched += 1;
    });
    return matched / originalContent.size;
  }

  function buildCandidateWords(words, levelName, protectedTerms) {
    const config = COMPRESSION_LEVELS[levelName];
    const kept = [];

    words.forEach((rawWord, index) => {
      const key = normalizeWord(rawWord);
      if (!key) return;

      let keep = false;
      if (index === 0) keep = true;
      if (protectedTerms.has(key)) keep = true;
      if (/\d/.test(rawWord)) keep = true;
      if (isTechnicalToken(rawWord)) keep = true;
      if (isLikelyProper(rawWord, index)) keep = true;
      if (key.length > 15) keep = true;
      if (!keep && !config.fillerWords.has(key)) keep = true;

      if (keep) kept.push(rawWord);
    });

    return kept;
  }

  function levelCandidatesFor(requestedLevel) {
    switch (requestedLevel) {
      case 'light':
        return ['light'];
      case 'aggressive':
        return ['aggressive', 'medium', 'light'];
      case 'direct':
        return ['direct', 'aggressive', 'medium'];
      case 'medium':
      default:
        return ['medium', 'light'];
    }
  }

  function evaluateCandidate(originalSentence, originalWords, candidateWords, levelName, requestedLevel, protectedTerms) {
    if (!candidateWords.length) return { score: Number.NEGATIVE_INFINITY, text: '' };

    const candidateText = candidateWords.join(' ');
    const candidateTerms = new Set(candidateWords.map(normalizeWord).filter((x) => x));
    for (const term of protectedTerms) {
      if (!candidateTerms.has(term)) {
        return { score: Number.NEGATIVE_INFINITY, text: '' };
      }
    }

    const originalHasVerb = hasLikelyVerb(originalSentence);
    const candidateHasVerb = hasLikelyVerb(candidateText);
    if (originalHasVerb && !candidateHasVerb) {
      return { score: Number.NEGATIVE_INFINITY, text: '' };
    }

    const config = COMPRESSION_LEVELS[levelName];
    const originalCount = Math.max(1, originalWords.length);
    const candidateCount = candidateWords.length;
    const minWords = Math.max(2, Math.ceil(originalCount * config.minWordsRatio));
    if (candidateCount < minWords) {
      return { score: Number.NEGATIVE_INFINITY, text: '' };
    }

    const retention = retainedContentRatio(originalWords, candidateWords);
    if (retention < config.minRetention) {
      return { score: Number.NEGATIVE_INFINITY, text: '' };
    }

    const compression = 1 - (candidateCount / originalCount);
    const compressionScore = clamp01(1 - (Math.abs(compression - config.targetCompression) / 0.7));
    const verbScore = candidateHasVerb ? 1 : 0.65;
    const requestedLevelBonus = levelName === requestedLevel ? 0.03 : 0;
    const brevityPenalty = candidateCount > originalCount ? 0.9 : 1;

    let score = (retention * 0.55) + (compressionScore * 0.25) + (verbScore * 0.2) + requestedLevelBonus;
    score *= brevityPenalty;

    const isNonLightMode = requestedLevel !== 'light';
    const minCompressionFloor = config.minCompressionFloor || 0;
    const noRealCompression = compression < minCompressionFloor;
    if (isNonLightMode && originalCount >= 6 && noRealCompression) {
      score *= 0.72;
    }

    return { score, text: candidateText };
  }

  function optimizeSentence(originalSentence, requestedLevel) {
    const originalWords = tokenize(originalSentence);
    if (!originalWords.length) return '';

    const protectedTerms = detectProtectedTerms(originalWords);
    const levelOrder = levelCandidatesFor(requestedLevel);

    let best = { score: Number.NEGATIVE_INFINITY, text: originalSentence };

    levelOrder.forEach((levelName) => {
      const prepared = applyFillerPhrases(originalSentence, COMPRESSION_LEVELS[levelName].fillerPhrases);
      const preparedWords = tokenize(prepared);
      const candidateWords = buildCandidateWords(preparedWords, levelName, protectedTerms);
      const evaluated = evaluateCandidate(originalSentence, originalWords, candidateWords, levelName, requestedLevel, protectedTerms);
      if (evaluated.score > best.score) {
        best = evaluated;
      }
    });

    return best.score === Number.NEGATIVE_INFINITY ? originalSentence.trim() : best.text;
  }

  function optimizeText(text, level) {
    if (!text) return text;

    const requestedLevel = COMPRESSION_LEVELS[level] ? level : 'medium';
    let rewritten = applyPhraseRewrites(text);
    rewritten = rewritten.replace(/\s+\band\s+(why|how|what|when|where|who|which)\b/gi, '. $1');
    const segments = rewritten.split(/([.!?]+)/);

    const optimizedSegments = segments.map((segment) => {
      if (/^[.!?]+$/.test(segment)) return segment;
      if (!segment.trim()) return '';
      return optimizeSentence(segment.trim(), requestedLevel);
    });

    let optimized = optimizedSegments.join('');
    optimized = optimized.replace(/\s+/g, ' ').trim();
    optimized = optimized.replace(/\s+([.!?,;:])/g, '$1');
    return optimized || text.trim();
  }

  globalScope.TokenOptimizer = {
    COMPRESSION_LEVELS,
    estimateTokens,
    optimizeText
  };
})(typeof self !== 'undefined' ? self : window);
