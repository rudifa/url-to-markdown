# Tests

This folder contains test files for the URL to Markdown LogSeq plugin.

## Test Files

### `urlFind.test.ts`

- **Purpose**: Comprehensive TypeScript tests for URL detection utilities using Vitest framework
- **Functions tested**: `findFormattedURLs`, `findRawURLs`, `findRawURLsAtEnd`, `analyzeBlockURLs`
- **How to run**:

  ```bash
  # Run tests once
  npm test

  # Run tests in watch mode (re-runs on file changes)
  npm run test:watch

  # Run tests with UI interface
  npm run test:ui
  ```

### `browserTests.js`

- **Purpose**: Browser-compatible tests that can be run in browser console
- **How to run**:
  1. Open browser developer console
  2. Copy and paste the entire contents of `browserTests.js`
  3. Tests will run automatically and show results
  4. Functions will be available globally for manual testing

## Test Coverage

The tests cover:

### ✅ Basic Functionality

- Empty content handling
- Single URL detection
- Multiple URL detection

### ✅ URL Types

- Raw URLs: `https://example.com`
- Formatted URLs: `[Title](https://example.com)`
- Image links: `![Alt](https://example.com/image.png)`

### ✅ Edge Cases

- URLs in parentheses
- Mixed raw and formatted URLs
- URLs at end of content vs. middle
- Malformed markdown
- Nested brackets

### ✅ Position Tracking

- Correct start/end coordinates
- Title extraction for formatted URLs
- Overlap prevention between raw and formatted URLs

## Test Data

Test cases include realistic LogSeq block content scenarios:

- Plain text blocks
- Blocks with single URLs
- Blocks with multiple URLs
- Mixed content with both raw and formatted URLs
- Complex scenarios with URLs at different positions

## Manual Testing

For interactive testing in browser console after running `browserTests.js`:

```javascript
// Test specific content
findFormattedURLs("Check out [LogSeq](https://logseq.com) for notes");
findRawURLs("Visit https://github.com and https://example.com");
findRawURLsAtEnd("This block ends with https://logseq.com");

// Run all tests again
runBrowserTests();
```

## Integration Testing

These utilities are designed to be integrated into the main plugin. Example usage:

```typescript
import {findRawURLsAtEnd} from "../src/utils/urlFind.js";

async function processBlock(blockUuid: string) {
  const block = await logseq.Editor.getBlock(blockUuid);
  const urlsToProcess = findRawURLsAtEnd(block.content);

  for (const urlLocation of urlsToProcess) {
    // Convert each URL to markdown with exact coordinates
    await convertURLToMarkdown(urlLocation, block);
  }
}
```
