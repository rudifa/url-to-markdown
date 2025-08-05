// Quick test script to verify favicon integration
import { processBlockContentForURLs } from './src/utils/metadata.js';

async function testFaviconIntegration() {
  console.log('🧪 Testing favicon integration...\n');

  const testContent = 'Check out this site: https://github.com and also https://stackoverflow.com';

  // Test without favicons (original behavior)
  console.log('1. Testing without favicons:');
  const basicResult = await processBlockContentForURLs(testContent);
  console.log('Result:', basicResult);
  console.log('');

  // Test with favicons enabled
  console.log('2. Testing with favicons enabled:');
  const faviconResult = await processBlockContentForURLs(testContent, {
    includeFavicon: true,
    faviconSize: 16,
    faviconPosition: 'before'
  });
  console.log('Result:', faviconResult);
  console.log('');

  // Test with favicons after the link
  console.log('3. Testing with favicons after link:');
  const faviconAfterResult = await processBlockContentForURLs(testContent, {
    includeFavicon: true,
    faviconSize: 20,
    faviconPosition: 'after'
  });
  console.log('Result:', faviconAfterResult);
}

testFaviconIntegration().catch(console.error);
