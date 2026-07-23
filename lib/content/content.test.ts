import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SCALES } from "../music";
import { ASSET_MANIFEST, DESTINATIONS } from "./index";

describe("content joins", () => {
  it("joins every destination to one canonical music scale id", () => {
    const musicIds = SCALES.map((scale) => scale.id).sort();
    const contentIds = DESTINATIONS.map((destination) => destination.scaleId).sort();

    assert.deepEqual(contentIds, musicIds);
    assert.equal(new Set(contentIds).size, SCALES.length);
  });

  it("tracks one local and one comparison asset for every scale", () => {
    for (const scale of SCALES) {
      const assets = ASSET_MANIFEST.assets.filter(
        (asset) => asset.scaleId === scale.id,
      );
      assert.equal(assets.length, 2, scale.id);
      assert.deepEqual(
        assets.map((asset) => asset.role).sort(),
        ["comparison", "local-example"],
      );
    }
  });
});
