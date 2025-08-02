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
