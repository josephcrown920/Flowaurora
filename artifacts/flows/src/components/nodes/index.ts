import { createNodeRegistry } from '@workspace/flow-nodes';
export { availableNodeTypes, nodeCatalog } from '@workspace/flow-nodes';
export type { AvailableNodeType } from '@workspace/flow-nodes';

import { 
  ImageUploadNode, VideoUploadNode, AudioUploadNode, ImageIteratorNode, 
  PromptNode, PromptBuilderNode, TextIteratorNode, 
  LTXProNode, NanoBananaProNode, RemoveBackgroundNode, TopazUpscaleNode, 
  VideoExtendNode, ExtractFrameNode, DubbingNode, AudioToVideoNode,
  DirectorNode, CharacterNode, ImageGenNode
} from './custom-nodes';

export const nodeTypes = createNodeRegistry({
  ImageUploadNode,
  VideoUploadNode,
  AudioUploadNode,
  ImageIteratorNode,
  PromptNode,
  PromptBuilderNode,
  TextIteratorNode,
  LTXProNode,
  NanoBananaProNode,
  RemoveBackgroundNode,
  TopazUpscaleNode,
  VideoExtendNode,
  ExtractFrameNode,
  DubbingNode,
  AudioToVideoNode,
  DirectorNode,
  CharacterNode,
  ImageGenNode,
});
