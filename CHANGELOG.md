# Changelog

## [1.1.0] - 2024-05-06

### Improved
- **Better token estimation** - More accurate formula based on OpenAI tokenization patterns (~1.3 chars per token)
- **Smarter optimization algorithm** - Preserves critical words (verbs, nouns, numbers, proper nouns, technical terms)
- **Conservative word filtering** - No longer removes essential words like "is", "are", "to", "why"
- **Error handling** - Better fallback for clipboard operations
- **Accessibility** - Added ARIA labels, keyboard shortcuts (Ctrl+Enter), better titles
- **UI improvements** - Added Reset button, better visual feedback for errors

### Changed
- Token formula from `(chars/4) + (words*0.3)` to `Math.ceil(chars/3.5)` for accuracy
- Filler word list from 50+ words to ~20 truly redundant words
- Phrase removal from aggressive to conservative approach

### Added
- Reset button to clear all text
- Ctrl+Enter keyboard shortcut to optimize
- Error toast notifications (red)
- Input validation for very large texts
- SVG icons for better quality at all resolutions
- Author field and homepage URL in manifest

### Fixed
- Icon file paths in manifest.json (now in `icons/` folder)
- Clipboard permission in manifest
- Default title for extension button

## [1.0] - Initial Release
- Token counter with real-time updates
- Text optimizer with filler word removal
- Token savings calculator
- One-click copy to clipboard
- Local storage of last input
