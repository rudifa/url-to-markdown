/**
 * Test setup file for vitest
 * Configures global polyfills and test environment setup
 */

import {fetch} from "undici";

// Polyfill fetch for Node.js test environment
// This ensures all tests have access to a reliable fetch implementation
globalThis.fetch = fetch as any;
