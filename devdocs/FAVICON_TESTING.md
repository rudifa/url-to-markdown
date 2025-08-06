# 🎯 Testing the addFaviconToMarkdownLink Function

## ✅ **Vitest Tests (All Passing!)**

The function has been thoroughly tested with 10 test cases covering:

- ✅ Default behavior (favicon before link)
- ✅ Custom position (after link)
- ✅ Custom favicon size
- ✅ Custom alt text templates
- ✅ URLs with paths and subdomains
- ✅ Error handling for invalid inputs
- ✅ Edge cases (empty titles, special characters)

**Run tests:**

```bash
npm test metadata.test.ts
```

## 🌐 **Browser Console Testing**

Open the visual test in your browser and try these commands in the console:

```javascript
// Basic usage
await addFaviconToMarkdownLink("[GitHub](https://github.com)");
// Result: "![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=16) [GitHub](https://github.com)"

// Custom size
await addFaviconToMarkdownLink("[GitHub](https://github.com)", {size: 32});
// Result: "![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=32) [GitHub](https://github.com)"

// Position after
await addFaviconToMarkdownLink("[GitHub](https://github.com)", {
  position: "after",
});
// Result: "[GitHub](https://github.com) ![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=16)"

// Custom alt text
await addFaviconToMarkdownLink("[NPM](https://npmjs.com)", {
  altTextTemplate: (hostname) => `🔗 ${hostname}`,
});
// Result: "![🔗 npmjs.com](https://www.google.com/s2/favicons?domain=npmjs.com&sz=16) [NPM](https://npmjs.com)"
```

## 📦 **Function Features**

- **🎨 Favicon Integration**: Uses Google's favicon service for reliable icons
- **⚙️ Configurable**: Size, position, and alt text customization
- **🛡️ Error Handling**: Gracefully handles invalid URLs and malformed markdown
- **🏗️ TypeScript**: Full type safety and IntelliSense support
- **🧪 Well Tested**: Comprehensive test coverage

## 🚀 **Usage Examples**

```typescript
import {addFaviconToMarkdownLink} from "./src/utils/metadata.js";

// Add favicon to existing markdown links
const enhanced = await addFaviconToMarkdownLink("[GitHub](https://github.com)");
console.log(enhanced);
// Output: "![github.com-favicon](https://www.google.com/s2/favicons?domain=github.com&sz=16) [GitHub](https://github.com)"
```

The function is now exported and ready for use in both Node.js and browser environments! 🎉
