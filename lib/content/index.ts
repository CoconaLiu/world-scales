export {
  ASSET_BY_ID,
  ASSET_MANIFEST,
  getAssetManifestEntry,
  getAssetsForDestination,
} from "./asset-manifest";

export {
  COPY_BY_LOCALE,
  formatCopy,
  getProductCopy,
  isSupportedLocale,
  localize,
  normalizeLocale,
} from "./copy";

export {
  DESTINATION_BY_ID,
  DESTINATION_BY_SCALE_ID,
  DESTINATIONS,
  getDestination,
  getDestinationByScaleId,
  getDestinationLabel,
  getScaleLabel,
} from "./destinations";

export {
  MELODIES_BY_ASSET_ID,
  getMelodyByAssetId,
} from "./melody-registry";

export {
  DESTINATION_IDS,
  MUSIC_ASSET_IDS,
  SCALE_IDS,
  SUPPORTED_LOCALES,
} from "./types";

export type {
  ApprovalStatus,
  AssetManifest,
  AssetManifestEntry,
  AssetRightsRecord,
  DestinationContent,
  DestinationId,
  DestinationTheme,
  HexColor,
  Locale,
  LocalizedName,
  LocalizedText,
  LocalizedTextList,
  MapAnchor,
  MusicAssetId,
  MusicAssetStatus,
  ProductCopy,
  ReviewStatus,
  RightsStatus,
  ScaleContent,
  ScaleId,
  TimbreMode,
  TrackContent,
} from "./types";
