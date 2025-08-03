import "@logseq/libs";
import {analyzeBlockURLs} from "./utils/urlFind";
import {fetchPageTitle} from "./utils/metadata";

// Use an async IIFE to run the main function after Logseq is ready.
(async () => {
  await logseq.ready();
  main().catch(console.error);
})();

// Main function
async function main() {
  console.log("main url-to-markdown 2.8");

  // Listen to block changes and process each changed block
  logseq.DB.onChanged(async (e: any) => {
    console.log("📥 DB.onChanged event:", e);
    if (e.blocks && Array.isArray(e.blocks)) {
      for (const block of e.blocks) {
        if (block?.uuid) {
          await processBlockForURLs(block.uuid);
        }
      }
    }
  });
}

async function processBlockForURLs(blockUuid: string) {
  try {
    console.log(`🔍 Processing block: ${blockUuid}`);

    // Get the block content
    const block = await logseq.Editor.getBlock(blockUuid);
    if (!block?.content) {
      console.warn(`No block content found for ${blockUuid}`);
      return;
    }

    const content = block.content;
    console.log(`📝 Block content: ${content}`);

    // Analyze URLs in the content using urlFind
    const urlAnalysis = analyzeBlockURLs(content);

    // Check if there are any raw URLs to process
    if (urlAnalysis.raw.length === 0) {
      console.log(`No raw URLs found in block`);
      return;
    }

    console.log(`🔗 Found ${urlAnalysis.raw.length} raw URL(s) to process`);

    // Process only the FIRST raw URL to avoid coordinate shifting issues
    // Subsequent URLs will be processed in the next DB change event
    const firstRawURL = urlAnalysis.raw[0];
    const {url} = firstRawURL;
    console.log(`🔗 Processing first URL: ${url}`);

    if (!isValidURL(url)) {
      console.log(`❌ Invalid URL: ${url}`);
      return;
    }

    // Fetch page title and create markdown
    console.log(`🌐 Fetching title for: ${url}`);
    const {title} = await fetchPageTitle(url);

    // Create markdown - just use the title for clean formatting
    const markdown = `[${title}](${url})`;
    console.log(`✨ Generated markdown: ${markdown}`);

    // Replace the URL with markdown using precise coordinates
    const updatedContent =
      content.substring(0, firstRawURL.start) +
      markdown +
      content.substring(firstRawURL.end);

    // Update the block
    await logseq.Editor.updateBlock(blockUuid, updatedContent);
    console.log(`✅ Updated block ${blockUuid} content:\n${updatedContent}\n`);

    if (urlAnalysis.raw.length > 1) {
      console.log(
        `📝 Block has ${
          urlAnalysis.raw.length - 1
        } more raw URL(s) - will be processed in next change event`
      );
    }
  } catch (error) {
    console.error(`❌ Error processing block ${blockUuid}:`, error);
  }
}

function attachToCurrentEditor() {
  // This function is no longer needed with the new approach
  console.log("attachToCurrentEditor - not needed with block-based approach");
}

function isValidURL(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function debounce(fn: (...args: any[]) => void, delay = 300) {
  // Debounce function kept for potential future use
  let timer: number | undefined;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
