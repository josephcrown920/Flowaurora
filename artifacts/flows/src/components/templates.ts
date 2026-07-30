import { Edge, Node } from '@xyflow/react';

export interface TemplateData {
  nodes: Node[];
  edges: Edge[];
}

export const TEMPLATE_LAYOUTS: Record<string, TemplateData> = {
  // 1. Image to video
  '1': {
    nodes: [
      { id: 't1-prompt', type: 'PromptNode', position: { x: 100, y: 150 }, data: { prompt: 'Cinematic pan over the scene' } },
      { id: 't1-image', type: 'ImageUploadNode', position: { x: 100, y: 350 }, data: {} },
      { id: 't1-ltx', type: 'LTXProNode', position: { x: 500, y: 200 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't1-prompt', target: 't1-ltx', targetHandle: 'prompt', animated: true },
      { id: 'e2', source: 't1-image', target: 't1-ltx', targetHandle: 'image', animated: true },
    ]
  },

  // 2. Image to campaign video
  '2': {
    nodes: [
      { id: 't2-prompt', type: 'PromptNode', position: { x: 100, y: 100 }, data: { prompt: 'A premium product lifestyle shot' } },
      { id: 't2-image', type: 'ImageUploadNode', position: { x: 100, y: 300 }, data: {} },
      { id: 't2-text', type: 'TextIteratorNode', position: { x: 100, y: 550 }, data: {} },
      { id: 't2-ltx', type: 'LTXProNode', position: { x: 450, y: 250 }, data: {} },
      { id: 't2-ext', type: 'VideoExtendNode', position: { x: 800, y: 250 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't2-prompt', target: 't2-ltx', targetHandle: 'prompt', animated: true },
      { id: 'e2', source: 't2-image', target: 't2-ltx', targetHandle: 'image', animated: true },
      { id: 'e3', source: 't2-text', target: 't2-ext', targetHandle: 'prompt', animated: true },
      { id: 'e4', source: 't2-ltx', target: 't2-ext', targetHandle: 'video', animated: true },
    ]
  },

  // 3. Subject in multiple environments
  '3': {
    nodes: [
      { id: 't3-image', type: 'ImageUploadNode', position: { x: 50, y: 100 }, data: {} },
      { id: 't3-text', type: 'TextIteratorNode', position: { x: 50, y: 350 }, data: {} },
      { id: 't3-pb', type: 'PromptBuilderNode', position: { x: 50, y: 650 }, data: {} },
      { id: 't3-nb', type: 'NanoBananaProNode', position: { x: 400, y: 250 }, data: {} },
      { id: 't3-ltx', type: 'LTXProNode', position: { x: 750, y: 250 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't3-image', target: 't3-nb', targetHandle: 'image', animated: true },
      { id: 'e2', source: 't3-text', target: 't3-nb', targetHandle: 'prompt', animated: true },
      { id: 'e3', source: 't3-nb', target: 't3-ltx', targetHandle: 'image', animated: true },
    ]
  },

  // 4. Camera angle ideation
  '4': {
    nodes: [
      { id: 't4-image', type: 'ImageUploadNode', position: { x: 100, y: 150 }, data: {} },
      { id: 't4-prompt', type: 'PromptNode', position: { x: 100, y: 400 }, data: { prompt: 'Wide shot, high angle, dramatic lighting' } },
      { id: 't4-nb', type: 'NanoBananaProNode', position: { x: 500, y: 200 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't4-image', target: 't4-nb', targetHandle: 'image', animated: true },
      { id: 'e2', source: 't4-prompt', target: 't4-nb', targetHandle: 'prompt', animated: true },
    ]
  },

  // 5. Changing object or element
  '5': {
    nodes: [
      { id: 't5-image', type: 'ImageUploadNode', position: { x: 100, y: 150 }, data: {} },
      { id: 't5-prompt', type: 'PromptNode', position: { x: 100, y: 400 }, data: { prompt: 'Change the red mug to a blue glass' } },
      { id: 't5-nb', type: 'NanoBananaProNode', position: { x: 500, y: 200 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't5-image', target: 't5-nb', targetHandle: 'image', animated: true },
      { id: 'e2', source: 't5-prompt', target: 't5-nb', targetHandle: 'prompt', animated: true },
    ]
  },

  // 6. Batch background removal
  '6': {
    nodes: [
      { id: 't6-ii', type: 'ImageIteratorNode', position: { x: 100, y: 200 }, data: {} },
      { id: 't6-rb', type: 'RemoveBackgroundNode', position: { x: 450, y: 200 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't6-ii', target: 't6-rb', targetHandle: 'in', animated: true },
    ]
  },

  // 7. Text iterator
  '7': {
    nodes: [
      { id: 't7-ti', type: 'TextIteratorNode', position: { x: 100, y: 150 }, data: {} },
      { id: 't7-image', type: 'ImageUploadNode', position: { x: 100, y: 400 }, data: {} },
      { id: 't7-nb', type: 'NanoBananaProNode', position: { x: 500, y: 200 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't7-ti', target: 't7-nb', targetHandle: 'prompt', animated: true },
      { id: 'e2', source: 't7-image', target: 't7-nb', targetHandle: 'image', animated: true },
    ]
  },

  // 8. Thumbnail variations
  '8': {
    nodes: [
      { id: 't8-ti', type: 'TextIteratorNode', position: { x: 50, y: 100 }, data: {} },
      { id: 't8-pb', type: 'PromptBuilderNode', position: { x: 50, y: 350 }, data: {} },
      { id: 't8-image', type: 'ImageUploadNode', position: { x: 50, y: 550 }, data: {} },
      { id: 't8-nb', type: 'NanoBananaProNode', position: { x: 400, y: 250 }, data: {} },
      { id: 't8-tu', type: 'TopazUpscaleNode', position: { x: 750, y: 250 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't8-ti', target: 't8-nb', targetHandle: 'prompt', animated: true },
      { id: 'e2', source: 't8-image', target: 't8-nb', targetHandle: 'image', animated: true },
      { id: 'e3', source: 't8-nb', target: 't8-tu', targetHandle: 'in', animated: true },
    ]
  },

  // 9. Grid extraction and iteration
  '9': {
    nodes: [
      { id: 't9-ti', type: 'TextIteratorNode', position: { x: 100, y: 100 }, data: {} },
      { id: 't9-image', type: 'ImageUploadNode', position: { x: 100, y: 350 }, data: {} },
      { id: 't9-nb', type: 'NanoBananaProNode', position: { x: 500, y: 200 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't9-ti', target: 't9-nb', targetHandle: 'prompt', animated: true },
      { id: 'e2', source: 't9-image', target: 't9-nb', targetHandle: 'image', animated: true },
    ]
  },

  // 10. Multi-camera audio scene
  '10': {
    nodes: [
      { id: 't10-prompt', type: 'PromptNode', position: { x: 100, y: 100 }, data: { prompt: 'Different camera angles' } },
      { id: 't10-ii', type: 'ImageIteratorNode', position: { x: 100, y: 300 }, data: {} },
      { id: 't10-audio', type: 'AudioUploadNode', position: { x: 100, y: 550 }, data: {} },
      { id: 't10-a2v', type: 'AudioToVideoNode', position: { x: 500, y: 250 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't10-audio', target: 't10-a2v', targetHandle: 'audio', animated: true },
      { id: 'e2', source: 't10-ii', target: 't10-a2v', targetHandle: 'image', animated: true },
    ]
  },

  // 11. Chained video generation
  '11': {
    nodes: [
      { id: 't11-prompt1', type: 'PromptNode', position: { x: 50, y: 100 }, data: { prompt: 'Scene 1 start' } },
      { id: 't11-image', type: 'ImageUploadNode', position: { x: 50, y: 300 }, data: {} },
      { id: 't11-ltx1', type: 'LTXProNode', position: { x: 400, y: 150 }, data: {} },
      { id: 't11-extract', type: 'ExtractFrameNode', position: { x: 750, y: 150 }, data: {} },
      { id: 't11-prompt2', type: 'PromptNode', position: { x: 750, y: 350 }, data: { prompt: 'Scene 2 continuation' } },
      { id: 't11-ltx2', type: 'LTXProNode', position: { x: 1100, y: 200 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't11-prompt1', target: 't11-ltx1', targetHandle: 'prompt', animated: true },
      { id: 'e2', source: 't11-image', target: 't11-ltx1', targetHandle: 'image', animated: true },
      { id: 'e3', source: 't11-ltx1', target: 't11-extract', targetHandle: 'in', animated: true },
      { id: 'e4', source: 't11-extract', target: 't11-ltx2', targetHandle: 'image', animated: true },
      { id: 'e5', source: 't11-prompt2', target: 't11-ltx2', targetHandle: 'prompt', animated: true },
    ]
  },

  // 12. Spokesperson video dubbing
  '12': {
    nodes: [
      { id: 't12-video', type: 'VideoUploadNode', position: { x: 100, y: 300 }, data: {} },
      { id: 't12-dub1', type: 'DubbingNode', position: { x: 500, y: 100 }, data: {} },
      { id: 't12-dub2', type: 'DubbingNode', position: { x: 500, y: 300 }, data: {} },
      { id: 't12-dub3', type: 'DubbingNode', position: { x: 500, y: 500 }, data: {} }
    ],
    edges: [
      { id: 'e1', source: 't12-video', target: 't12-dub1', targetHandle: 'in', animated: true },
      { id: 'e2', source: 't12-video', target: 't12-dub2', targetHandle: 'in', animated: true },
      { id: 'e3', source: 't12-video', target: 't12-dub3', targetHandle: 'in', animated: true },
    ]
  },

  // 13. Director-driven story (NEW)
  '13': {
    nodes: [
      { id: 't13-char', type: 'CharacterNode', position: { x: 50, y: 200 }, data: { name: 'Hero', description: 'Mid-30s, weathered jacket, determined expression' } },
      { id: 't13-dir', type: 'DirectorNode', position: { x: 350, y: 100 }, data: { script: 'A lone traveler arrives at a fog-covered city at dawn, walks through empty streets, and finds a hidden door', style: 'moody noir, desaturated, handheld', scenes: 3 } },
      { id: 't13-ltx1', type: 'LTXProNode', position: { x: 780, y: 50 }, data: {} },
      { id: 't13-ltx2', type: 'LTXProNode', position: { x: 780, y: 280 }, data: {} },
      { id: 't13-ltx3', type: 'LTXProNode', position: { x: 780, y: 510 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 't13-char', target: 't13-dir', targetHandle: 'character', animated: true },
      { id: 'e2', source: 't13-dir', sourceHandle: 'scene-1', target: 't13-ltx1', targetHandle: 'prompt', animated: true },
      { id: 'e3', source: 't13-dir', sourceHandle: 'scene-2', target: 't13-ltx2', targetHandle: 'prompt', animated: true },
      { id: 'e4', source: 't13-dir', sourceHandle: 'scene-3', target: 't13-ltx3', targetHandle: 'prompt', animated: true },
    ]
  },

  // 14. Character consistency — image series (NEW)
  '14': {
    nodes: [
      { id: 't14-char', type: 'CharacterNode', position: { x: 50, y: 150 }, data: { name: 'Brand Persona', description: 'Professional woman, 40s, warm smile, red blazer' } },
      { id: 't14-ti', type: 'TextIteratorNode', position: { x: 50, y: 420 }, data: {} },
      { id: 't14-img1', type: 'ImageGenNode', position: { x: 430, y: 100 }, data: { model: 'flux-dev' } },
      { id: 't14-img2', type: 'ImageGenNode', position: { x: 430, y: 360 }, data: { model: 'flux-dev' } },
      { id: 't14-img3', type: 'ImageGenNode', position: { x: 430, y: 620 }, data: { model: 'flux-dev' } },
    ],
    edges: [
      { id: 'e1', source: 't14-char', target: 't14-img1', targetHandle: 'character', animated: true },
      { id: 'e2', source: 't14-char', target: 't14-img2', targetHandle: 'character', animated: true },
      { id: 'e3', source: 't14-char', target: 't14-img3', targetHandle: 'character', animated: true },
      { id: 'e4', source: 't14-ti', target: 't14-img1', targetHandle: 'prompt', animated: true },
      { id: 'e5', source: 't14-ti', target: 't14-img2', targetHandle: 'prompt', animated: true },
      { id: 'e6', source: 't14-ti', target: 't14-img3', targetHandle: 'prompt', animated: true },
    ]
  },

  // 15. Character video series — consistent character across scenes (NEW)
  '15': {
    nodes: [
      { id: 't15-char', type: 'CharacterNode', position: { x: 50, y: 250 }, data: { name: 'Protagonist', description: 'Young man, short curly hair, green hoodie' } },
      { id: 't15-dir', type: 'DirectorNode', position: { x: 360, y: 80 }, data: { script: 'Character wakes up, discovers something strange outside the window, steps out into a transformed world', style: 'bright magical realism, wide lenses', scenes: 3 } },
      { id: 't15-gen1', type: 'ImageGenNode', position: { x: 790, y: 50 }, data: {} },
      { id: 't15-gen2', type: 'ImageGenNode', position: { x: 790, y: 280 }, data: {} },
      { id: 't15-gen3', type: 'ImageGenNode', position: { x: 790, y: 510 }, data: {} },
      { id: 't15-ltx1', type: 'LTXProNode', position: { x: 1130, y: 50 }, data: {} },
      { id: 't15-ltx2', type: 'LTXProNode', position: { x: 1130, y: 280 }, data: {} },
      { id: 't15-ltx3', type: 'LTXProNode', position: { x: 1130, y: 510 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 't15-char', target: 't15-dir', targetHandle: 'character', animated: true },
      { id: 'e2', source: 't15-char', target: 't15-gen1', targetHandle: 'character', animated: true },
      { id: 'e3', source: 't15-char', target: 't15-gen2', targetHandle: 'character', animated: true },
      { id: 'e4', source: 't15-char', target: 't15-gen3', targetHandle: 'character', animated: true },
      { id: 'e5', source: 't15-dir', sourceHandle: 'scene-1', target: 't15-gen1', targetHandle: 'prompt', animated: true },
      { id: 'e6', source: 't15-dir', sourceHandle: 'scene-2', target: 't15-gen2', targetHandle: 'prompt', animated: true },
      { id: 'e7', source: 't15-dir', sourceHandle: 'scene-3', target: 't15-gen3', targetHandle: 'prompt', animated: true },
      { id: 'e8', source: 't15-gen1', target: 't15-ltx1', targetHandle: 'image', animated: true },
      { id: 'e9', source: 't15-gen2', target: 't15-ltx2', targetHandle: 'image', animated: true },
      { id: 'e10', source: 't15-gen3', target: 't15-ltx3', targetHandle: 'image', animated: true },
    ]
  },

  // 16. Image gen with style variations (NEW)
  '16': {
    nodes: [
      { id: 't16-prompt', type: 'PromptNode', position: { x: 100, y: 200 }, data: { prompt: 'A futuristic cityscape at sunset' } },
      { id: 't16-ti', type: 'TextIteratorNode', position: { x: 100, y: 430 }, data: {} },
      { id: 't16-img1', type: 'ImageGenNode', position: { x: 500, y: 100 }, data: { model: 'flux-dev' } },
      { id: 't16-img2', type: 'ImageGenNode', position: { x: 500, y: 360 }, data: { model: 'sdxl' } },
      { id: 't16-img3', type: 'ImageGenNode', position: { x: 500, y: 620 }, data: { model: 'ideogram' } },
      { id: 't16-up', type: 'TopazUpscaleNode', position: { x: 870, y: 360 }, data: {} },
    ],
    edges: [
      { id: 'e1', source: 't16-prompt', target: 't16-img1', targetHandle: 'prompt', animated: true },
      { id: 'e2', source: 't16-prompt', target: 't16-img2', targetHandle: 'prompt', animated: true },
      { id: 'e3', source: 't16-prompt', target: 't16-img3', targetHandle: 'prompt', animated: true },
      { id: 'e4', source: 't16-ti', target: 't16-img1', targetHandle: 'style', animated: true },
      { id: 'e5', source: 't16-ti', target: 't16-img2', targetHandle: 'style', animated: true },
      { id: 'e6', source: 't16-ti', target: 't16-img3', targetHandle: 'style', animated: true },
      { id: 'e7', source: 't16-img2', target: 't16-up', targetHandle: 'in', animated: true },
    ]
  },
};
