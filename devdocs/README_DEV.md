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

### **🔥 Hot Module Replacement (HMR) Development**

```bash
# Start HMR development server
npm run dev:hmr

# In LogSeq:
# Settings → Advanced → Developer mode → Load Unpacked Plugin
# Select: /path/to/project/dist-dev/
# Edit src/ files → Auto-rebuild → Click "Reload" in LogSeq → See changes instantly
```

### **📊 Visual Testing (Standalone Browser)**

```bash
npm run serve:visual-test        # One-time serve
npm run serve:visual-test:dev    # Manual refresh development
npm run serve:visual-test:auto   # Auto-refresh on file changes
# Open: http://127.0.0.1:3003/visual-test.html
```

### **🏗️ Production Builds**

```bash
npm run build                    # Production build to dist/
npm run build:visual-test        # Visual test build to dist-dev/
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
│   ├── build.sh           # esbuild-based build script
│   ├── dev-server.sh      # Visual test development server
│   ├── dev-server-auto.sh # Auto-refresh visual test server
│   └── hmr-server.sh      # HMR development server for LogSeq
├── dist/                  # Production build output (git-ignored)
├── dist-dev/              # Development build output (git-ignored)
├── index.html             # Production plugin HTML entry point
├── index.dev.html         # Development plugin HTML (loads from HMR)
├── manifest.json          # Production LogSeq plugin manifest
├── manifest.dev.json      # Development LogSeq plugin manifest
└── package.json           # Dependencies & scripts
```

## Build System

**Modern esbuild-based build with HMR support:**

- TypeScript compilation with ES modules
- Clean separation: `dist/` (production) vs `dist-dev/` (development)
- Hot Module Replacement for rapid development
- Multiple development server options

**Build targets:**

```bash
# Production builds
npm run build              # Main plugin: src/index.ts → dist/index.js

# Development builds
npm run build:visual-test  # Visual tests: assets/visual-test.ts → dist-dev/visual-test.js
npm run dev:hmr            # HMR server: src/index.ts → dist-dev/index.js (live)

# Development servers
npm run serve:visual-test:dev   # Visual test with manual refresh
npm run serve:visual-test:auto  # Visual test with auto-refresh
```

**Directory purposes:**

- `dist/` - Clean production builds only (for LogSeq Marketplace)
- `dist-dev/` - Development artifacts, HMR assets, visual tests

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

**Multiple development modes for different needs:**

### **🚀 Auto-refresh Mode (Recommended)**

```bash
npm run serve:visual-test:auto  # Auto-refresh on file changes
# Open: http://127.0.0.1:3003/visual-test.html
# Edit src/ → Auto-rebuild → Browser refreshes automatically
```

### **⚡ Manual Refresh Mode**

```bash
npm run serve:visual-test:dev   # Manual refresh after rebuild
# Open: http://127.0.0.1:3003/visual-test.html
# Edit src/ → Auto-rebuild → Manual browser refresh
```

### **📊 One-time Mode**

```bash
npm run serve:visual-test       # Single build and serve
# Open: http://127.0.0.1:3003/visual-test.html
```

**Features:**

- Real-time URL detection testing
- Live metadata fetching from actual APIs
- Production code testing (not mocked)
- Favicon integration preview
- File watching with automatic rebuilds
- Browser auto-refresh capabilities

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

**HMR Development debugging:**

- Use `npm run dev:hmr` for rapid iteration in LogSeq
- Edit source → Auto-rebuild → Click "Reload" → Instant feedback
- LogSeq dev tools show real plugin behavior

**Visual debugging:**

- Use `npm run serve:visual-test:auto` for standalone debugging
- Real-time URL detection and metadata fetching
- Production code testing without LogSeq overhead
- Auto-refresh eliminates manual reload cycles

## Contributing

1. **Fork and clone** the repository
2. **Install dependencies:** `npm install`
3. **Start HMR development:** `npm run dev:hmr`
4. **Load plugin in LogSeq** from `dist-dev/` folder
5. **Make changes** to `src/` files (auto-rebuild enabled)
6. **Test thoroughly:**
   - `npm test` (fast unit tests)
   - `npm run test:web` (real API integration tests)
   - `npm run serve:visual-test:auto` (visual testing)
7. **Production build:** `npm run build`
8. **Final test in LogSeq** with production build from `dist/`
9. **Submit PR** with clear description

**Development tips:**

- **Use HMR workflow** (`npm run dev:hmr`) for rapid LogSeq plugin iteration
- **Use auto-refresh visual tests** (`npm run serve:visual-test:auto`) for UI debugging
- **Fast feedback loop:** Edit → Auto-rebuild → Reload → Test
- **Use fast `npm test`** for quick iteration on logic
- **Use `npm run test:web`** before submitting PRs to validate real APIs
- **Check both `dist/` and `dist-dev/`** are working as expected
- **LogSeq dev tools** show plugin console output and errors
