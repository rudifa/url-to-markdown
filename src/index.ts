import "@logseq/libs";

// Use an async IIFE to run the main function after Logseq is ready.
(async () => {
  await logseq.ready();
  main().catch(console.error);
})();

// Main function
async function main() {
  console.log("main url-to-markdown 2.3");

  // Track recently processed blocks to prevent loops
  const recentlyProcessed = new Set<string>();

  // Listen to block changes and process each changed block
  logseq.DB.onChanged(async (e: any) => {
    console.log("📥 DB.onChanged event:", e);
    if (e.blocks && Array.isArray(e.blocks)) {
      for (const block of e.blocks) {
        if (block?.uuid && !recentlyProcessed.has(block.uuid)) {
          // Add to recently processed set
          recentlyProcessed.add(block.uuid);

          // Remove from set after 2 seconds to allow future processing
          setTimeout(() => {
            recentlyProcessed.delete(block.uuid);
          }, 2000);

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
    if (!block || !block.content) {
      console.warn(`No block content found for ${blockUuid}`);
      return;
    }

    const content = block.content;
    console.log(`📝 Block content: ${content}`);

    // Skip if content already contains markdown links (to prevent loops)
    if (content.includes("](") || content.includes("![")) {
      console.log(`⏭️ Block already contains markdown links, skipping`);
      return;
    }

    // Look for URLs at the end of the content
    const urlMatch = content.match(/(https?:\/\/[^\s]+)$/);
    if (!urlMatch) {
      console.warn(`No URL found at end of block`);
      return;
    }

    const url = urlMatch[1];
    console.log(`🔗 Found URL: ${url}`);

    if (!isValidURL(url)) {
      console.log(`❌ Invalid URL: ${url}`);
      return;
    }

    // Fetch metadata and create markdown
    console.log(`🌐 Fetching metadata for: ${url}`);
    const {title} = await fetchMetadata(url);

    // Create markdown - just use the title for clean formatting
    const markdown = `[${title}](${url})`;

    console.log(`✨ Generated markdown: ${markdown}`);

    // Replace the URL with markdown in the block
    const newContent = content.replace(url, markdown);

    // Update the block
    await logseq.Editor.updateBlock(blockUuid, newContent);
    console.log(`✅ Updated block ${blockUuid}`);
  } catch (error) {
    console.error(`❌ Error processing block ${blockUuid}:`, error);
  }
}

function attachToCurrentEditor() {
  // This function is no longer needed with the new approach
  console.log("attachToCurrentEditor - not needed with block-based approach");
}

async function fetchMetadata(
  url: string
): Promise<{title: string; icon?: string}> {
  try {
    const res = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}`
    );
    const data = await res.json();
    return {
      title: data.data.title || url,
      icon: data.data.logo || data.data.image?.url || "",
    };
  } catch {
    return {title: url};
  }
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
