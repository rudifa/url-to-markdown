# URL to Markdown Plugin - Developer Documentation

Developer documentation for the LogSeq URL to Markdown plugin. For user documentation, see the main [README.md](../README.md).

## Quick Start

```bash
# Clone and setup
git clone https://github.com/rudifa/url-to-markdown.git
cd url-to-markdown
npm install

# Build plugin
npm run build

# Load in LogSeq
# Settings → Plugins → Load unpacked plugin → select project root folder
```

## Development Workflow

```bash
# Make changes to src/
npm run build              # Build main plugin
npm run build:visual-test  # Build visual test runner
# Reload plugin in LogSeq to see changes
```

## Project Structure

```
url-to-markdown/
├── src/
│   ├── utils/
│   │   ├── metadata.ts    # URL metadata fetching & processing
│   │   └── urlFind.ts     # URL detection & parsing
│   └── index.ts           # Main plugin entry point
├── tests/
│   └── utils/
│       ├── metadata.test.ts     # Mock tests
│       ├── metadata-web.test.ts # Real web API tests
│       └── urlFind.test.ts      # URL detection tests
├── assets/
│   ├── favicon.svg        # Plugin icon
│   ├── visual-test.html   # Visual test runner interface
│   └── visual-test.ts     # Visual test entry point
├── scripts/
│   └── build.sh           # esbuild-based build script
├── dist/                  # Build output (git-ignored)
├── index.html             # Plugin HTML entry point
├── manifest.json          # LogSeq plugin manifest
└── package.json           # Dependencies & scripts
```

## Build System

**Modern esbuild-based build:**

- TypeScript compilation with ES modules
- Bundle splitting for main plugin vs visual tests
- No watch mode (removed for simplicity)

**Build targets:**

```bash
npm run build              # Main plugin: src/index.ts → dist/index.js
npm run build:visual-test  # Visual tests: assets/visual-test.ts → dist/visual-test.js
```

## Testing

**Vitest-based testing with conditional web tests:**

```bash
npm test                  # Fast unit tests only (default)
npm run test:web          # Include real web API tests
npm run test:ui           # Visual test interface
```

**Test structure:**

- `urlFind.test.ts` - URL detection logic (fast, no network)
- `metadata.test.ts` - Metadata fetching with mocks (fast)
- `metadata-web.test.ts` - Real API integration tests (slow, requires `RUN_WEB_TESTS=true`)

**Environment variables:**

- `RUN_WEB_TESTS=true` - Enable slow web integration tests

## Visual Testing

**Interactive test runner for manual testing:**

```bash
npm run serve:visual-test  # Build and serve at http://127.0.0.1:3003
```

Features:

- Real-time URL detection testing
- Live metadata fetching from actual APIs
- Production code testing (not mocked)
- Favicon integration preview

## Architecture

**Plugin Flow:**

1. `logseq.DB.onChanged` / `logseq.App.onRouteChanged` - Event listeners
2. `analyzeBlockURLs` - Parse block content for URLs
3. `processBlockContentForURLs` - Transform raw URLs to markdown
4. `fetchPageTitle` + `fetchFaviconMarkdown` - Get metadata via APIs
5. `logseq.Editor.updateBlock` - Update block content

**External APIs:**

- [api.microlink.io](https://api.microlink.io) - Page title extraction
- [google.com/s2/favicons](https://www.google.com/s2/favicons) - Favicon fetching

**Module separation:**

- `urlFind.ts` - Pure URL detection logic (no dependencies)
- `metadata.ts` - Web API calls and LogSeq integration
- `index.ts` - Plugin lifecycle and event handling

## Configuration Schema

The plugin exposes three settings in LogSeq's plugin settings:

```typescript
logseq.useSettingsSchema([
  {
    key: "enableFavicons",
    type: "boolean",
    title: "Enable Favicons",
    description: "Add favicons to markdown links",
    default: true,
  },
  {
    key: "faviconSize",
    type: "number",
    title: "Favicon Size",
    description: "Size of favicons in pixels",
    default: 16,
  },
  {
    key: "faviconPosition",
    type: "enum",
    title: "Favicon Position",
    description: "Position of favicon relative to link text",
    default: "before",
    enumChoices: ["before", "after"],
    enumPicker: "radio",
  },
]);
```

## Code Quality

**TypeScript:**

- Strict TypeScript configuration
- ES modules throughout
- Proper type definitions for LogSeq APIs

**Testing:**

>

- > 90% code coverage with unit tests
- Real web integration tests for API validation
- Visual testing for manual verification

**Build:**

- esbuild for fast compilation
- No bundler complexity (replaced webpack/parcel)
- Clean separation of concerns

## Debugging

**Console logging:**

- Plugin lifecycle events logged to browser console
- URL processing results visible in LogSeq dev tools
- API call timing and results for performance monitoring

**Visual debugging:**

- Use `npm run serve:visual-test` for interactive debugging
- Real-time URL detection and metadata fetching
- Production code testing without LogSeq overhead

## Contributing

1. **Fork and clone** the repository
2. **Install dependencies:** `npm install`
3. **Make changes** to `src/` files
4. **Test thoroughly:** `npm test` and `npm run test:web`
5. **Visual test:** `npm run serve:visual-test`
6. **Build:** `npm run build`
7. **Test in LogSeq** with unpacked plugin
8. **Submit PR** with clear description

**Development tips:**

- Use fast `npm test` for quick iteration
- Use `npm run test:web` before submitting PRs
- Visual test runner shows real behavior
- LogSeq dev tools show plugin console output
