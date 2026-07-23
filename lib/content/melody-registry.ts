import {
  COMPARISON_MELODIES,
  LOCAL_MELODIES,
  type Melody,
} from "../music";
import type { MusicAssetId } from "./types";

/**
 * The canonical join between user-facing track metadata and playable data.
 * Keeping this keyed by asset id prevents a title from silently playing an
 * unrelated scale-level placeholder.
 */
export const MELODIES_BY_ASSET_ID = {
  "local-hijaz-scale-study": LOCAL_MELODIES.hijaz,
  "comparison-hijaz-ode-to-joy": COMPARISON_MELODIES.hijaz,
  "local-dorian-scale-study": LOCAL_MELODIES.dorian,
  "comparison-dorian-ode-to-joy": COMPARISON_MELODIES.dorian,
  "local-gong-scale-study": LOCAL_MELODIES.gong,
  "comparison-gong-ode-to-joy": COMPARISON_MELODIES.gong,
  "local-miyako-bushi-scale-study": LOCAL_MELODIES.miyakobushi,
  "comparison-miyako-bushi-ode-to-joy": COMPARISON_MELODIES.miyakobushi,
  "local-degung-scale-study": LOCAL_MELODIES.degung,
  "comparison-degung-ode-to-joy": COMPARISON_MELODIES.degung,
} as const satisfies Readonly<Record<MusicAssetId, Melody>>;

export function getMelodyByAssetId(assetId: MusicAssetId): Melody {
  return MELODIES_BY_ASSET_ID[assetId];
}
