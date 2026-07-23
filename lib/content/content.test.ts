import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { SCALES } from "../music";
import {
  ASSET_MANIFEST,
  DESTINATIONS,
  MUSIC_ASSET_IDS,
  getMelodyByAssetId,
} from "./index";

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

  it("resolves every displayed track to matching manifest and melody data", () => {
    const registeredMelodyIds = new Set<string>();

    for (const destination of DESTINATIONS) {
      for (const mode of ["local", "comparison"] as const) {
        const track = destination.tracks[mode];
        const manifestEntry = ASSET_MANIFEST.assets.find(
          (asset) => asset.id === track.assetId,
        );
        const melody = getMelodyByAssetId(track.assetId);

        assert.ok(manifestEntry, `missing manifest entry for ${track.assetId}`);
        assert.equal(manifestEntry.destinationId, destination.id);
        assert.equal(manifestEntry.scaleId, destination.scaleId);
        assert.equal(
          manifestEntry.role,
          mode === "local" ? "local-example" : "comparison",
        );
        assert.deepEqual(manifestEntry.title, track.title);
        assert.equal(melody.scaleId, destination.scaleId);
        assert.equal(
          track.defaultTimbre,
          "neutral",
          `${track.assetId} must not imply an unimplemented regional instrument`,
        );
        registeredMelodyIds.add(melody.id);
      }
    }

    assert.equal(registeredMelodyIds.size, MUSIC_ASSET_IDS.length);
    assert.deepEqual(
      ASSET_MANIFEST.assets.map((asset) => asset.id).sort(),
      [...MUSIC_ASSET_IDS].sort(),
    );
  });
});
