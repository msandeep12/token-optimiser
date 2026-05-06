# Development Guide

## Getting Started

### Prerequisites
- Chrome/Edge/Brave/Opera browser
- Text editor (VS Code recommended)
- Git (optional)

### Setup
1. Clone repository: `git clone <repo-url>`
2. Navigate to folder: `cd token-optimizer-extension`
3. Open `chrome://extensions`
4. Enable "Developer mode" (top-right toggle)
5. Click "Load unpacked" and select this folder

### Workflow

**Edit → Test → Reload**

1. Make code changes to `.js`, `.html`, or other files
2. For **JS changes**: Click reload button next to extension (in chrome://extensions)
3. For **HTML/CSS changes**: Click extension icon to test immediately
4. For **manifest changes**: Click reload button
5. Check browser console for errors: Right-click page → Inspector → Console

### Key Files to Modify

**To change optimization logic:**
- Edit: `popup.js`
- Focus on: `optimizeText()` and `FILLER_WORDS` constants

**To change UI:**
- Edit: `popup.html`
- Add new buttons, stats, or layout here

**To change styles:**
- Edit: Inside `<style>` tag in `popup.html`
- Use the existing color scheme: `#1a1a1a` (bg), `#3b82f6` (blue)

**To change extension metadata:**
- Edit: `manifest.json`
- Don't change `manifest_version` (must be 3)
- Update `version` when releasing

## Testing Guide

### Manual Testing Checklist

#### Basic Functionality
- [ ] Extension loads without errors in console
- [ ] Can type in input field
- [ ] "Optimize" button works
- [ ] Output appears below with stats
- [ ] Token count increases as text is added

#### Optimization Quality
Test with these examples:

**Example 1 - Politeness Removal:**
```
Could you please help me understand how React Context works? 
I would appreciate if you could show me an example.
```
Should remove: "Could you please", "I would appreciate if you could"

**Example 2 - Preserve Meaning:**
```
Why is Python a good language for data science?
```
Should NOT remove: "is", "Why" (these are critical)

**Example 3 - Keep Technical Terms:**
```
Configure the OAuth 2.0 authentication flow with JWT tokens
```
Should preserve: "OAuth", "JWT", "2.0"

#### UI/UX
- [ ] Copy button is disabled until optimization happens
- [ ] Copy button works (test with Ctrl+V)
- [ ] Reset button clears all fields
- [ ] Ctrl+Enter optimizes the prompt
- [ ] Stats update in real-time
- [ ] Toast shows "Copied!" notification

#### Edge Cases
- [ ] Very long text (10,000 words) - doesn't crash
- [ ] Empty text - shows 0 tokens
- [ ] Special characters - don't break layout
- [ ] Punctuation at end - preserved correctly
- [ ] Multiple spaces - cleaned up
- [ ] Line breaks - handled properly

### Debug Mode

To see what's happening internally, modify `popup.js`:

```javascript
// Add these console logs in key functions
console.log('Input:', input.value);
console.log('Optimized:', optimized);
console.log('Original tokens:', originalTokens);
console.log('Optimized tokens:', optimizedTokens);
```

Then open browser dev tools (F12) to see console output.

## Code Structure

### popup.js Functions

**estimateTokens(text)**
- Estimates token count using ~1.3 chars/token formula
- Returns: number

**optimizeText(text)**
- Main optimization logic
- Removes filler words and phrases
- Returns: optimized string

**updateStats()**
- Recalculates word count and token estimates
- Updates UI display
- Called on every input change

**Event Listeners**
- `input` - Live update stats
- `optimizeBtn` - Click to compress
- `copyBtn` - Copy to clipboard
- `resetBtn` - Clear all

### popup.html Structure

```html
<textarea id="input">        <!-- User's prompt input -->
<div class="stats">           <!-- Token/word counts -->
<div class="buttons">         <!-- Optimize/Copy/Reset buttons -->
<div id="outputSection">      <!-- Compressed result (hidden by default) -->
<textarea id="output">        <!-- Optimized prompt (readonly) -->
<div id="toast">              <!-- Success message -->
```

## Optimization Algorithm

### Current Approach (v1.1.0)

1. **Remove filler phrases** - Use regex patterns
2. **Split by sentences** - Keep punctuation separate  
3. **Filter words** - Only remove words in FILLER_WORDS set
4. **Preserve rules**:
   - First word of sentence (always keep)
   - Numbers and codes (always keep)
   - Proper nouns/technical terms (always keep)
   - Sentence punctuation (always keep)
5. **Cleanup** - Normalize spaces and punctuation

### Future Improvements

- [ ] **POS tagging** - Use grammar parsing for smarter filtering
- [ ] **Sentence scoring** - Rank sentences by importance
- [ ] **Context preservation** - Understand semantic meaning
- [ ] **Levels** - Conservative/Balanced/Aggressive compression
- [ ] **Custom dictionaries** - User-defined filler words

## Performance Considerations

### Current Limits
- Input: Up to 50,000 characters (warnings above)
- Latency: <100ms for typical prompts
- Memory: ~5MB for extension

### Optimization Opportunities
- Use Web Worker for large texts
- Implement caching for repeated words
- Lazy-load regex patterns

## Publishing

When ready to publish to Chrome Web Store:

1. Update version in `manifest.json` and `package.json`
2. Create `.crx` file: Chrome → Settings → Extensions → Export
3. Create Chrome Web Store Developer account
4. Upload extension and screenshots
5. Handle review process

See [Chrome Web Store publishing docs](https://developer.chrome.com/docs/webstore/)

## Useful Resources

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Manifest v3 Guide](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Security Policy](https://developer.chrome.com/docs/extensions/mv3/content_security_policy/)
- [Web APIs Reference](https://developer.mozilla.org/en-US/docs/Web/API)

## Troubleshooting Development

### Extension doesn't appear after loading
- Check manifest.json for syntax errors
- Verify file paths are correct
- Check console for error messages

### Changes not showing up
- Click reload button in chrome://extensions
- Clear browser cache
- Try incognito mode

### Clipboard API failing
- Extension needs `clipboardWrite` permission in manifest.json
- User must click Copy button (requires user gesture)

### Performance issues
- Check DevTools Performance tab
- Profile JavaScript execution
- Look for N+1 patterns in loops

## Questions?

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- Search [GitHub issues](https://github.com/yourusername/token-optimizer-extension/issues)
- Open a new issue with "question" tag
