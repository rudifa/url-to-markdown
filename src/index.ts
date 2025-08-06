import "@logseq/libs";
import {processBlockContentForURLs, PluginSettings} from "./utils/metadata";

// Main function
async function main() {
  console.log("main url-to-markdown 3.9.1");

  // Register plugin settings
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

    // Get favicon options with default fallbacks
    const faviconOptions = getFaviconOptions();

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

// Helper function to get favicon options with fallbacks to default settings
function getFaviconOptions() {
  const settings = logseq.settings as unknown as PluginSettings;
  return {
    includeFavicon: settings?.enableFavicons ?? true,
    faviconSize: settings?.faviconSize ?? 16,
    faviconPosition: settings?.faviconPosition ?? "before",
  };
}

// Initialize the plugin
logseq.ready(main).catch(console.error);
