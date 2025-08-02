# URL to Markdown LogSeq Plugin Instructions

## Project Overview

This is a LogSeq plugin that automatically converts URLs at the end of blocks into properly formatted markdown links with fetched page titles.

## How It Works

1. **User types a URL** at the end of any LogSeq block
2. **Plugin detects the change** via `logseq.DB.onChanged` event
3. **Fetches page metadata** using microlink.io API
4. **Replaces URL with markdown link** using the actual page title

## Project Structure

```
url-to-markdown/
├── src/
│   └── index.ts          # Main plugin code
├── dist/                 # Built output (generated)
├── index.html           # Plugin entry point
├── package.json         # Dependencies and build scripts
├── tsconfig.json        # TypeScript configuration
├── manifest.json        # LogSeq plugin manifest
└── README.md           # Project documentation
```

## Key Technologies

- **TypeScript** - Main language
- **esbuild** - Fast bundler that combines all dependencies
- **@logseq/libs** - LogSeq plugin API (imported directly, not via CDN)
- **microlink.io** - Web scraping API for fetching page metadata

## Build System

### Commands

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode

### Build Process

1. **esbuild** bundles `src/index.ts` with all dependencies into `dist/index.js`
2. **HTML file** is copied to `dist/` folder
3. **No CDN dependencies** - everything is bundled

### Key Build Configuration

```javascript
esbuild src/index.ts --bundle --outfile=dist/index.js --format=esm --platform=browser
```

## Code Architecture

### Main Function Flow

```typescript
main() → logseq.DB.onChanged() → processBlockForURLs() → fetchMetadata() → updateBlock()
```

### Core Functions

#### `main()`

- Sets up event listeners
- Manages `recentlyProcessed` Set to prevent infinite loops
- Currently uses `logseq.DB.onChanged` (has ~1-2 second delay)

#### `processBlockForURLs(blockUuid)`

- Gets block content via `logseq.Editor.getBlock()`
- Checks for URLs at end of content with regex: `/(https?:\/\/[^\s]+)$/`
- Skips blocks that already contain markdown links (prevents loops)
- Calls `fetchMetadata()` and `logseq.Editor.updateBlock()`

#### `fetchMetadata(url)`

- Uses microlink.io API: `https://api.microlink.io/?url=${encodeURIComponent(url)}`
- Returns `{title, icon}` object
- Falls back to URL if API fails

### Loop Prevention Mechanisms

1. **Content Check**: Skip blocks containing `](` or `![` (markdown syntax)
2. **Recently Processed Tracking**: Use `Set<string>` with 2-second timeout
3. **Single Event Processing**: Each block UUID processed only once per change

## Current Issues & Known Behavior

### ⚠️ Delayed Processing

- **Issue**: URLs are converted only after a 1-2 second delay
- **Cause**: `logseq.DB.onChanged` fires after LogSeq saves to database
- **Attempted Solutions**: Tried `onInputSelectionEnd`, `onBlockChanged` but still delayed

### ✅ Working Features

- ✅ Detects URLs at end of blocks
- ✅ Fetches real page titles
- ✅ Creates clean markdown links: `[Page Title](URL)`
- ✅ Prevents infinite loops
- ✅ No CDN dependencies (fully bundled)

## Development Guidelines

### Adding New Features

1. Always test loop prevention mechanisms
2. Use extensive console logging for debugging
3. Update version number in `console.log` statements
4. Test with various URL types and edge cases

### Debugging

- Use the scientific method:
  - Propose a hypothesis
  - Design an experiment to test it
  - Run the experiment
  - Analyze the results
    - Refine the hypothesis if needed
    - if the hypothesis is confirmed, document it and implement the solution
    - else, refine the hypothesis and repeat
  - Add console logs to track flow
  - Test with different inputs
- Check browser console for detailed logs
- Look for emoji-prefixed log messages: 🔍 📝 🔗 ✨ ✅ ❌
- Monitor `recentlyProcessed` Set to verify loop prevention

### Performance Considerations

- API calls are async and don't block UI
- esbuild provides fast builds (~20-30ms)
- Bundle size is reasonable (~142kb)

## Future Improvements

### Preferences in developing solutions and improvemeents

- prefer immediate response over delayed processing
- prefer creating / factoring out small processing functions that are testable and composable
- avoid using timeouts for processing control, except as a preliminary workaround for immediate response
- avoid using DOM api, prefer using LogSeq Editor API events that fire immediately

### Immediate Response (Priority: High)

- **Goal**: Reduce delay from 1-2 seconds to near-instant
- **Options to Try**:
  - DOM event listeners on textareas
  - LogSeq Editor API events that fire immediately
  - Combination of multiple event sources

### Enhanced Features (Priority: Medium)

- Support URLs anywhere in block, not just at end
- Add icon support back (currently disabled)
- Support for multiple URLs per block
- Custom markdown format options

### Code Quality (Priority: Low)

- Fix TypeScript lint warnings
- Add proper type definitions
- Add unit tests
- Improve error handling

## Testing Checklist

When making changes, test these scenarios:

1. **Basic URL Conversion**

   - [ ] Type URL at end of block → converts to markdown
   - [ ] Real page title is fetched and used
   - [ ] Various URL formats (http, https, with/without www)

2. **Loop Prevention**

   - [ ] Converting URL doesn't trigger infinite processing
   - [ ] Block with existing markdown links is skipped
   - [ ] Same block isn't processed multiple times quickly

3. **Edge Cases**

   - [ ] Invalid URLs are skipped
   - [ ] API failures gracefully fall back to URL as title
   - [ ] Empty blocks don't cause errors
   - [ ] Very long URLs work correctly

4. **Build System**
   - [ ] `npm run build` completes without errors
   - [ ] Generated `dist/index.js` includes all dependencies
   - [ ] Plugin loads in LogSeq without CDN dependencies

## API Reference

### LogSeq API Used

- `logseq.ready()` - Wait for LogSeq initialization
- `logseq.DB.onChanged(callback)` - Listen to database changes
- `logseq.Editor.getBlock(uuid)` - Get block content
- `logseq.Editor.updateBlock(uuid, content)` - Update block content

### External APIs

- **microlink.io**: `GET https://api.microlink.io/?url=${encodeURIComponent(url)}`
  - Response: `{data: {title, logo, image: {url}}}`
  - Free tier: 50 requests/day per IP

## Troubleshooting

### Plugin Not Loading

1. Check console for errors
2. Verify `dist/` folder exists and contains files
3. Ensure LogSeq plugin is enabled
4. Try rebuilding: `npm run build`

### URLs Not Converting

1. Check if URL is at the very end of block
2. Verify console logs show detection: "🔗 Found URL:"
3. Check if block already contains markdown links
4. Verify internet connection for API calls

### Build Failures

1. Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
2. Check TypeScript errors: `npx tsc --noEmit`
3. Verify all dependencies are installed
