import manifestJson from "../../public/assets/manifest.json";
import type {
  AssetManifest,
  AssetManifestEntry,
  DestinationId,
  MusicAssetId,
} from "./types";

function parseAssetManifest(input: unknown): AssetManifest {
  if (!input || typeof input !== "object") {
    throw new Error("Asset manifest must be an object.");
  }

  const candidate = input as Partial<AssetManifest>;
  if (candidate.schemaVersion !== "1.0" || !Array.isArray(candidate.assets)) {
    throw new Error("Unsupported or malformed asset manifest.");
  }

  const ids = new Set<string>();
  for (const asset of candidate.assets) {
    if (!asset.id || ids.has(asset.id)) {
      throw new Error(`Asset manifest contains a missing or duplicate id: ${asset.id}`);
    }
    ids.add(asset.id);

    if (asset.assetStatus === "placeholder" && asset.approvalStatus !== "pending") {
      throw new Error(`Placeholder asset ${asset.id} must remain pending.`);
    }

    if (!asset.source || !asset.arranger || !asset.license) {
      throw new Error(`Asset ${asset.id} is missing provenance or rights metadata.`);
    }
  }

  return input as AssetManifest;
}

export const ASSET_MANIFEST = parseAssetManifest(manifestJson);

export const ASSET_BY_ID = Object.fromEntries(
  ASSET_MANIFEST.assets.map((asset) => [asset.id, asset]),
) as Readonly<Record<MusicAssetId, AssetManifestEntry>>;

export function getAssetManifestEntry(id: MusicAssetId): AssetManifestEntry {
  return ASSET_BY_ID[id];
}

export function getAssetsForDestination(
  destinationId: DestinationId,
): readonly AssetManifestEntry[] {
  return ASSET_MANIFEST.assets.filter(
    (asset) => asset.destinationId === destinationId,
  );
}
