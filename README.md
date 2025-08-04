# URL to Markdown (Logseq Plugin)

This plugin detects pasted URLs in the Logseq editor and replaces them with Markdown links that include the page title (and optionally favicon).

## Usage

Paste a URL in the editor and wait a moment — it will auto-convert to:

```md
[Example Domain](https://example.com)
```

## Plugin build

```bash
npm install
npm run build
```

## Plugin install

1. Open Logseq
2. Go to Settings → Plugins → Load unpacked plugin
3. In the file dialog, select the root folder of this plugin, `url-to-markdown`
4. The plugin should now be loaded and active

## Plugin development

1. Modify the `src/index.ts` file
2. Run `npm run build` to compile the TypeScript code into JavaScript and bundle it with the Logseq API into the `dist/index.js` file
3. Reload the plugin in Logseq to see the changes

## Plugin source code structure

````
url-to-markdown/
├── src/
│   ├── utils/               # Utility functions for URL detection and metadata fetching
│   │   ├── metadata.ts
│   │   └── urlFind.ts
│   └── index.ts             # Main plugin code
├── tests
│   ├── utils/               # Test files for utility functions
│   │   ├── metadata.test.ts
│   │   └── urlFind.test.ts
│   ├── README.md
│   └── browserTests.js
├── dist/                     # Built output (generated)
├── index.html                # Plugin entry point
├── package.json              # Dependencies and build scripts
├── tsconfig.json             # TypeScript configuration
├── manifest.json             # LogSeq plugin manifest
└── README.md                 # Project documentation

## Testing

This project uses [Vitest](https://vitest.dev/) for comprehensive testing with both unit tests and integration tests.

### Quick Start

```bash
# Install dependencies
npm install

# Run fast tests (mock tests only)
npm test

# Run all tests including web integration tests
npm run test:web

# Run tests with verbose metadata logging
npm run test:verbose

# Run web tests with full verbose output
npm run test:web:verbose
````

### Test Scripts

| Command                    | Description                              | Use Case               |
| -------------------------- | ---------------------------------------- | ---------------------- |
| `npm test`                 | Fast tests only (skips web tests)        | Development, CI/CD     |
| `npm run test:fast`        | Same as `npm test`                       | Explicit fast testing  |
| `npm run test:web`         | All tests including web requests         | Integration validation |
| `npm run test:web:verbose` | Web tests with detailed API logging      | API debugging          |
| `npm run test:verbose`     | Mock tests with verbose metadata logging | Development debugging  |
| `npm run test:all`         | Same as `test:web`                       | Comprehensive testing  |
| `npm run test:all:verbose` | All tests with full verbose output       | Complete debugging     |
| `npm run test:watch`       | Watch mode for development               | Active development     |
| `npm run test:ui`          | Visual test interface                    | Interactive testing    |

### Environment Variables

| Variable           | Values         | Description                                   |
| ------------------ | -------------- | --------------------------------------------- |
| `RUN_WEB_TESTS`    | `true`/`false` | Enable real HTTP requests to external APIs    |
| `VERBOSE_METADATA` | `true`/`false` | Enable detailed logging for metadata fetching |

**Examples:**

```bash
# Run only web tests with verbose output
RUN_WEB_TESTS=true VERBOSE_METADATA=true npm test

# Run specific test file with verbose logging
VERBOSE_METADATA=true npx vitest tests/utils/metadata.test.ts
```

### Test Categories

#### 🎭 **Mock Tests (Fast & Reliable)**

- **URL Detection**: 13 tests validating `findFormattedURLs`, `findRawURLs`, `analyzeBlockURLs`
- **Metadata Fetching**: 10 tests with mocked API responses
- **Coverage**: All edge cases, error handling, coordinate validation
- **Speed**: ~300ms execution time

#### 🌐 **Web Integration Tests (Realistic)**

- **Real HTTP Requests**: Tests actual microlink.io API calls
- **Fallback Validation**: Verifies graceful handling when API is unavailable
- **URLs Tested**: GitHub, Stack Overflow, npm, Vitest, LogSeq
- **Environment Control**: Only runs with `RUN_WEB_TESTS=true`

### Test Results

```bash
# Fast tests (default)
✓ tests/utils/urlFind.test.ts (13 tests)
✓ tests/utils/metadata.test.ts (10 tests)
⏭️ Web tests: 7 skipped
📊 Total: 30 passed | 1 skipped

# Web tests (with RUN_WEB_TESTS=true)
✓ tests/utils/urlFind.test.ts (13 tests)
✓ tests/utils/metadata.test.ts (10 tests)
🌐 tests/utils/metadata.test.ts web tests (7 tests)
📊 Total: 30 passed | 1 skipped
```

### Environment Variables

- `RUN_WEB_TESTS=true` - Enables web integration tests
- Default behavior skips web tests for faster development

### Test Files Structure

```
tests/
├── utils/
│   ├── urlFind.test.ts     # URL detection & parsing tests
│   └── metadata.test.ts    # Metadata fetching tests (mock + web)
```

## Visual Testing

The project includes a comprehensive visual test runner for manual testing and development.

### Visual Test Scripts

| Command                     | Description                  | Access                                   |
| --------------------------- | ---------------------------- | ---------------------------------------- |
| `npm run build:visual-test` | Build visual test runner     | Creates `dist/visual-test.html`          |
| `npm run dev:visual-test`   | Development mode with watch  | Auto-rebuilds on file changes            |
| `npm run serve:visual-test` | Build and serve visual tests | <http://127.0.0.1:3003/visual-test.html> |

### Visual Test Features

- **URL Detection Testing**: Interactive table showing how different text inputs are parsed
- **Real Metadata Fetching**: Live API calls with timing, icons, and error handling
- **Production Code Testing**: Uses actual production modules (not copies)
- **Professional Interface**: Clean tables, loading states, status indicators

### Manual Visual Testing

```bash
# Option 1: Use npm script (recommended)
npm run serve:visual-test
# Opens server at <http://127.0.0.1:3003/visual-test.html>

# Option 2: Manual server setup
npm run build:visual-test
cd dist
python3 -m http.server 3003
# Navigate to <http://localhost:3003/visual-test.html>

# Option 3: VS Code Live Server
# Install Live Server extension, then right-click dist/visual-test.html
```

The visual test runner automatically displays URL detection results and provides a button to test real metadata fetching from various popular websites.

### CI/CD Recommendations

```yaml
# Fast CI pipeline
- run: npm test # Skips unstable web tests

# Comprehensive validation (optional)
- run: npm run test:web # Includes external API tests
```
