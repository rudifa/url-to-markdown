import "@logseq/libs";
import {processBlockContentForURLs} from "./utils/metadata";

// Plugin settings interface
interface PluginSettings {
  enableFavicons: boolean;
  faviconSize: number;
  faviconPosition: "before" | "after";
}

// Default settings
const defaultSettings: PluginSettings = {
  enableFavicons: true,
  faviconSize: 16,
  faviconPosition: "before",
};

// Use an async IIFE to run the main function after Logseq is ready.
(async () => {
  await logseq.ready();
  main().catch(console.error);
})();

// Main function
async function main() {
  console.log("main url-to-markdown 3.5.6 with favicon support");

  // Register plugin settings
  logseq.useSettingsSchema([
    {
      key: "enableFavicons",
      type: "boolean",
      title: "Enable Favicons",
      description: "Add favicons to markdown links",
      default: defaultSettings.enableFavicons,
    },
    {
      key: "faviconSize",
      type: "number",
      title: "Favicon Size",
      description: "Size of favicons in pixels",
      default: defaultSettings.faviconSize,
    },
    {
      key: "faviconPosition",
      type: "enum",
      title: "Favicon Position",
      description: "Position of favicon relative to link text",
      default: defaultSettings.faviconPosition,
      enumChoices: ["before", "after"],
      enumPicker: "radio",
    },
  ]);

  // Listen to block changes and process each changed block
  logseq.DB.onChanged(async (e: any) => {
    console.log(
      `📥 DB.onChanged event: ${e}, e.txMeta.outlinerOp: ${e.txMeta.outlinerOp}`
    );
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
      return;
    }

    const content = block.content;

    // Get plugin settings
    const settings = logseq.settings as unknown as PluginSettings;
    const faviconOptions = {
      includeFavicon:
        settings?.enableFavicons ?? defaultSettings.enableFavicons,
      faviconSize: settings?.faviconSize ?? defaultSettings.faviconSize,
      faviconPosition:
        settings?.faviconPosition ?? defaultSettings.faviconPosition,
    };

    // Process block content for URLs
    const updatedContent = await processBlockContentForURLs(
      content,
      faviconOptions
    );

    // Only update the block if content actually changed
    if (updatedContent !== content) {
      // Update the block
      await logseq.Editor.updateBlock(blockUuid, updatedContent);
      console.log(
        `✅ Block ${blockUuid} content (updated):\n${updatedContent}\n`
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

function debounce(fn: (...args: any[]) => void, delay = 300) {
  // Debounce function kept for potential future use
  let timer: number | undefined;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
