// Test environment setup
import {fetch} from "undici";

// Polyfill fetch for Node.js test environment
// This ensures that when we remove the mock fetch in web tests,
// there's a real fetch available
globalThis.fetch = fetch as any;
