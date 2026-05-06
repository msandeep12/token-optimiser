# AI Token Optimizer - Chrome Extension

Compress prompts intelligently to save AI tokens. Works with Claude, ChatGPT, Copilot, and any AI tool.

**v1.1.0** - Now with smarter optimization that preserves meaning!

## ⚡ Quick Start

## Features

✅ **Smart Token Counter** - Real-time estimation (±5% accuracy)
✅ **Intelligent Optimizer** - Removes filler while preserving meaning
✅ **Live Savings Tracker** - See percentage saved instantly  
✅ **One-Click Copy** - Quick paste to ChatGPT, Claude, Copilot
✅ **Keyboard Shortcuts** - Press `Ctrl+Enter` to optimize
✅ **Accessibility** - Full keyboard navigation, ARIA labels
✅ **Privacy** - Works offline, data never leaves your browser

## Install

### Chrome/Edge/Brave/Opera

1. Clone or download this repository
2. Open `chrome://extensions` (or equivalent for your browser)
3. Enable **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the `token-optimizer-extension` folder
6. **Pin to toolbar** (optional): Click extension icon → pin icon

### Firefox

Firefox support coming in v1.2.0. Current installation method:

1. Open `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on"**
3. Select `manifest.json` from this folder
4. ⚠️ Note: Resets on browser restart (use Developer Edition for persistence)

## Usage

1. **Click** extension icon in toolbar
2. **Paste** your prompt in the input box
3. **Click** "Optimize" (or press `Ctrl+Enter`)
4. **Review** compressed version
5. **Click** "Copy" to clipboard
6. **Paste** into your AI tool

### Keyboard Shortcuts
- `Ctrl+Enter` - Optimize prompt
- `Tab` - Navigate between inputs
- `Enter` - Submit form

## Examples

**Before (87 tokens):**
```
Could you please help me understand how the authentication flow works in OAuth 2.0? I would like to know the specific steps that are involved in the process.
```

**AWhat Gets Removed?

The optimizer removes:
- 📌 **Filler words**: "the", "a", "an", "very", "really"
- 🗣️ **Politeness phrases**: "could you please", "I would like to"
- 📝 **Weak structures**: "there is", "it was"
- 🔀 **Intensifiers**: "quite", "fairly", "somewhat"

✅ It **preserves**:
- **Verbs & Nouns** - Core meaning
- **Technical terms** - Code, frameworks, jargon
- **Numbers & data** - Statistics, configurations
- **Question words** - Why, how, what, when
- **First word** - Sentence coherence
Keeps:
- Core nouns and verbs
- Technical terms
- Numbers and data
- Question words

## Token Estimation

**Important:** The extension uses a rough approximation (±5% accuracy).

For **exact token counts**, use official tools:
- **OpenAI (ChatGPT, GPT-4)**: [`tiktoken` Python library](https://github.com/openai/tiktoken)
- **Anthropic (Claude)**: [Claude API tokenizer](https://api.anthropic.com)
- **Google (Gemini)**: [Gemini API documentation](https://ai.google.dev)

The extension estimate is good for:
- 🎯 Budgeting token usage
- 📊 Comparing prompt lengths
- 💾 Tracking savings percentage

It works differently from exact tokenizers due to subword tokenization nuances.

## What's New in v1.1.0?

- 🧠 **Better algorithm**: No longer removes critical words like "is", "are", "to"
- 📏 **Accurate tokens**: Improved formula based on OpenAI patterns
- ⌨️ **Keyboard shortcuts**: Ctrl+Enter to optimize
- ♿ **Accessibility**: ARIA labels, semantic HTML
- 🔘 **Reset button**: Clear inputs quickly
- 🎨 **Icons**: Proper SVG icons for all resolutions
- 🐛 **Bug fixes**: Better clipboard handling and error messages

[See full changelog →](CHANGELOG.md)

## Troubleshooting

**Having issues?** Check the [Troubleshooting Guide](TROUBLESHOOTING.md) for:
- Copy button problems
- Token count accuracy
- Icon issues
- Performance tips
- Feature requests

## Roadmap

### v1.2.0 (Q2 2024)
- [ ] Firefox full support (not temporary)
- [ ] Multiple compression levels (conservative/balanced/aggressive)
- [ ] Custom word list editor

### v1.3.0+
- [ ] Right-click context menu on any text field  
- [ ] Sidebar overlay on ChatGPT, Claude, Copilot sites
- [ ] API cost calculator
- ✅ **100% Private** - Extension works offline. No data sent anywhere.
- ✅ **No accounts needed** - Completely anonymous
- ✅ **Compression varies** - Technical content compresses less than conversational text
- ✅ **Smart preservation** - Tries to keep meaning while reducing tokens
- ⚠️ **Always review** - Check optimized text makes sense before submitting

## Development

### File Structure
```
token-optimizer-extension/
├── manifest.json          # Extension configuration
├── popup.html             # UI markup and styles
├── popup.js               # Main logic
├── icons/                 # Extension icons
│   ├── icon16.svg
│   ├── icon48.svg
│   └── icon128.svg
├── README.md             # This file
├── CHANGELOG.md          # Version history
├── TROUBLESHOOTING.md    # Help guide
└── .gitignore            # Git ignore rules
```

### Local Development
1. Clone this repository
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder
5. Changes to `.js` files require extension reload

### Making Changes
- Edit `popup.js` for optimization logic
- Edit `popup.html` for UI/styling
- Edit `manifest.json` for permissions or metadata
- Test on real prompts before committing

### Testing Checklist
- [ ] Optimization preserves meaning
- [ ] Token count is reasonable
- [ ] Copy to clipboard works
- [ ] Reset button clears all fields
- [ ] Works with very long prompts (10k+ words)
- [ ] Keyboard shortcuts work (Ctrl+Enter)
- [ ] No console errors

## Contributing

Found a bug or have an idea? 

1. **Test the issue** thoroughly
2. **Search existing issues** to avoid duplicates
3. **Open an issue** with:
   - 🐛 Description of the bug/feature
   - 📝 Example text that reproduces it
   - 🖥️ Your OS and browser version
   - 📸 Screenshot if applicable

## License

MIT - Free to use, modify, and distribute
## Notes

Extension stores last input locally for convenience. No data sent externally.

Token savings vary by text type. Technical content compresses less than conversational text.

## License

MIT
