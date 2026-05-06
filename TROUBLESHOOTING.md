# Troubleshooting Guide

## Copy Button Not Working

**Issue:** "Copy" button is disabled or copy fails

**Solutions:**
1. **Check browser permissions** - Extension needs clipboard permission
   - Go to `chrome://extensions/token-optimizer`
   - Verify "Clipboard" is in permissions
   
2. **HTTPS-only issue** - Some sites block clipboard access
   - This is a browser security feature, not an extension bug
   - Try copying on other websites

3. **Browser mute issue** - Some browsers require user interaction for clipboard
   - Simply click the Copy button - it requires explicit user action

## Token Count Seems Off

**Issue:** Token count doesn't match your AI tool

**Why:** Token estimation is approximate
- OpenAI: Use `tiktoken` library for exact counts
- Anthropic: Use official Claude API tokenizer
- Google: Use Gemini API tokenizer

The extension uses a rough estimate (~1.3 chars/token) that's reliable for budgeting but not authoritative.

## Optimization Removed Important Words

**Issue:** "I want to understand X" became "want understand X"

**Solution:** The 1.1.0 update made this more conservative. If you still see issues:
1. Check if word is in the conservative filler list (in popup.js)
2. Open an issue with the example
3. This indicates a bug we should fix

## Extension Icon Doesn't Show

**Issue:** Icon is missing or pixelated

**Solution:**
1. Reload extension: `chrome://extensions/` → reload button
2. Clear cache: Right-click icon → "Remove extension" → reload
3. Verify files exist at:
   - `icons/icon16.svg`
   - `icons/icon48.svg`
   - `icons/icon128.svg`

## Large Text Causes Slowdown

**Issue:** Pasting very long prompts (10k+ words) slows down the extension

**Workaround:**
- Split into multiple shorter prompts
- Optimize one section at a time
- This is a UA optimization issue being tracked

## Storage Says "Last Input" Not Saving

**Issue:** Previous prompt doesn't load on restart

**Why:** Chrome clears extension data when:
- Extension is uninstalled and reinstalled
- Browser cache is cleared
- "Clear browsing data" includes "Cookies and other site data"

**Solution:** This is by design. Data is stored locally, not synced. If you need sync:
- Save outputs manually
- Use browser sync features for Chrome Sync

## Performance Issues with Long Text

**Issue:** Optimization takes time with very long prompts

**Optimizations in progress:**
- [ ] Web Worker for background processing
- [ ] Streaming optimization for real-time updates
- [ ] Progressive optimization levels

## Want to Report a Bug?

1. Note exact steps to reproduce
2. Share example text (if not sensitive)
3. Include browser version and OS
4. Open issue on GitHub

## Feature Requests

Current roadmap for future versions:
- [ ] Multiple compression levels (conservative/balanced/aggressive)
- [ ] Right-click context menu
- [ ] Custom word list editor
- [ ] Optimization history
- [ ] Color theme selector
- [ ] API cost calculator

Vote on features by opening an issue with "Feature Request" tag.
