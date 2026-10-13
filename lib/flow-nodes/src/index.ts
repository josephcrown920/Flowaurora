// Framework-free catalog shared by the canvas registry and the Director prompt.
export const nodeCatalog = {
  PromptNode: { group: "Inputs", description: "text prompt input" },
  PromptBuilderNode: { group: "Inputs", description: "dynamic prompt with variables" },
  TextIteratorNode: { group: "Inputs", description: "iterate through multiple text prompts" },
  ImageUploadNode: { group: "Inputs", description: "provide a reference image" },
  VideoUploadNode: { group: "Inputs", description: "provide a reference video" },
  AudioUploadNode: { group: "Inputs", description: "provide audio" },
  ImageIteratorNode: { group: "Inputs", description: "iterate through multiple images" },
  DirectorNode: { group: "Directors", description: "AI script director — breaks a logline into scene prompts" },
  CharacterNode: { group: "Directors", description: "character reference for visual consistency" },
  ImageGenNode: { group: "AI Models", description: "image generation (FLUX, SDXL, Ideogram)" },
  LTXProNode: { group: "AI Models", description: "LTX-2.3 Pro — image+prompt → video" },
  NanoBananaProNode: { group: "AI Models", description: "high-quality video generation" },
  AudioToVideoNode: { group: "AI Models", description: "audio-driven video generation" },
  RemoveBackgroundNode: { group: "Post-processing", description: "remove background from image" },
  TopazUpscaleNode: { group: "Post-processing", description: "upscale image or video" },
  VideoExtendNode: { group: "Post-processing", description: "extend video length" },
  ExtractFrameNode: { group: "Post-processing", description: "extract frame from video" },
  DubbingNode: { group: "Post-processing", description: "dub video to another language" },
} as const;

export type AvailableNodeType = keyof typeof nodeCatalog;

export const availableNodeTypes: readonly AvailableNodeType[] =
  Object.freeze(Object.keys(nodeCatalog) as AvailableNodeType[]);

// Require all supported renderers at compile time and register only catalog keys.
export function createNodeRegistry<Registry extends Record<AvailableNodeType, unknown>>(
  components: Registry,
): Pick<Registry, AvailableNodeType> {
  return Object.fromEntries(
    availableNodeTypes.map((type) => {
      if (components[type] == null) {
        throw new Error(`Missing canvas renderer for ${type}`);
      }
      return [type, components[type]];
    }),
  ) as Pick<Registry, AvailableNodeType>;
}

export function formatAvailableNodeTypes(): string {
  const groups = new Map<string, string[]>();
  for (const type of availableNodeTypes) {
    const { group, description } = nodeCatalog[type];
    const entries = groups.get(group) ?? [];
    entries.push(`  - ${type}: ${description}`);
    groups.set(group, entries);
  }
  return [...groups]
    .map(([group, entries]) => `${group}:\n${entries.join("\n")}`)
    .join("\n\n");
}
