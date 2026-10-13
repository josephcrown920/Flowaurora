import assert from "node:assert/strict";
import test from "node:test";
import {
  availableNodeTypes,
  createNodeRegistry,
  formatAvailableNodeTypes,
  nodeCatalog,
} from "../src/index.ts";

test("the canvas registry and Director list contain exactly the catalog types", () => {
  const renderers = Object.fromEntries(
    availableNodeTypes.map((type) => [type, () => type]),
  );
  const registry = createNodeRegistry({ ...renderers, UnsupportedNode: () => null });
  const promptTypes = [...formatAvailableNodeTypes().matchAll(/^\s+- (\w+):/gm)]
    .map((match) => match[1]);
  assert.deepEqual(Object.keys(registry), Object.keys(nodeCatalog));
  assert.deepEqual(promptTypes, Object.keys(registry));
  for (const type of availableNodeTypes) {
    assert.equal(registry[type], renderers[type]);
    assert.ok(formatAvailableNodeTypes().includes(nodeCatalog[type].description));
  }
});

test("a catalog type without a renderer fails explicitly", () => {
  assert.throws(() => createNodeRegistry({}), /Missing canvas renderer for PromptNode/);
});

test("the available type list cannot be mutated", () => {
  assert.throws(() => availableNodeTypes.push("UnsupportedNode"), TypeError);
});
