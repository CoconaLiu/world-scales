export const SUPPORTED_LOCALES = ["zh", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocalizedText = Readonly<Record<Locale, string>>;

export type LocalizedTextList = Readonly<Record<Locale, readonly string[]>>;

export type LocalizedName = Readonly<{
  en: string;
  zh: string;
  local: string;
}>;

export const DESTINATION_IDS = [
  "egypt",
  "north-atlantic",
  "china",
  "japan",
  "sunda",
] as const;

export type DestinationId = (typeof DESTINATION_IDS)[number];

export const SCALE_IDS = [
  "hijaz",
  "dorian",
  "gong",
  "miyakobushi",
  "degung",
] as const;

export type ScaleId = (typeof SCALE_IDS)[number];

export const MUSIC_ASSET_IDS = [
  "local-hijaz-el-helwa-di",
  "comparison-hijaz-ode-to-joy",
  "local-dorian-drunken-sailor",
  "comparison-dorian-ode-to-joy",
  "local-gong-molihua",
  "comparison-gong-ode-to-joy",
  "local-miyako-bushi-sakura",
  "comparison-miyako-bushi-ode-to-joy",
  "local-degung-selection-pending",
  "comparison-degung-ode-to-joy",
] as const;

export type MusicAssetId = (typeof MUSIC_ASSET_IDS)[number];

export type ReviewStatus = "provisional" | "approved";
export type MusicAssetStatus = "placeholder" | "approved";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type RightsStatus = ApprovalStatus | "not-applicable";
export type TimbreMode = "neutral" | "regional";

export type HexColor = `#${string}`;

export interface MapAnchor {
  /** Position on the stylized equirectangular map, from 0 to 100. */
  readonly xPercent: number;
  /** Position on the stylized equirectangular map, from 0 to 100. */
  readonly yPercent: number;
  /** Reference coordinate only; it does not claim a precise cultural boundary. */
  readonly longitude: number;
  /** Reference coordinate only; it does not claim a precise cultural boundary. */
  readonly latitude: number;
}

export interface DestinationTheme {
  readonly background: HexColor;
  readonly surface: HexColor;
  readonly primary: HexColor;
  readonly secondary: HexColor;
  readonly highlight: HexColor;
  readonly ink: HexColor;
  readonly abstractMaterials: LocalizedTextList;
}

export interface ScaleContent {
  readonly tonicMidi: number;
  readonly semitones: readonly number[];
  readonly degreeLabels: LocalizedTextList;
  readonly reviewStatus: ReviewStatus;
}

export interface TrackContent {
  readonly assetId: MusicAssetId;
  readonly title: LocalizedName;
  readonly modeLabel: LocalizedText;
  readonly status: MusicAssetStatus;
  readonly defaultTimbre: TimbreMode;
}

export interface DestinationContent {
  readonly id: DestinationId;
  readonly scaleId: ScaleId;
  readonly order: number;
  readonly name: LocalizedName;
  readonly scaleName: LocalizedName;
  readonly mapAnchor: MapAnchor;
  readonly theme: DestinationTheme;
  readonly scale: ScaleContent;
  readonly shortGuide: LocalizedText;
  readonly theory: Readonly<{
    summary: LocalizedText;
    detail: LocalizedText;
  }>;
  readonly disclaimer: LocalizedText;
  readonly tracks: Readonly<{
    local: TrackContent;
    comparison: TrackContent;
  }>;
}

export interface ProductCopy {
  readonly brand: {
    readonly productName: string;
    readonly localizedTitle: string;
    readonly corePromise: string;
  };
  readonly landing: {
    readonly description: string;
    readonly primaryCta: string;
    readonly soundRecommended: string;
  };
  readonly tutorial: {
    readonly title: string;
    readonly skip: string;
    readonly octaveMessage: string;
    readonly scaleMessage: string;
    readonly twelveTicksLabel: string;
  };
  readonly tour: {
    readonly title: string;
    readonly progressLabel: string;
    readonly localMode: string;
    readonly comparisonMode: string;
    readonly localModeDescription: string;
    readonly comparisonModeDescription: string;
    readonly complete: string;
  };
  readonly transport: {
    readonly play: string;
    readonly pause: string;
    readonly resume: string;
    readonly previous: string;
    readonly next: string;
    readonly replay: string;
    readonly replayAll: string;
    readonly loading: string;
    readonly soundOn: string;
    readonly mute: string;
    readonly unsupportedAudio: string;
    readonly resumeAfterBackground: string;
  };
  readonly keyboard: {
    readonly title: string;
    readonly prompt: string;
    readonly instructions: string;
    readonly startRecording: string;
    readonly stopRecording: string;
    readonly clear: string;
    readonly replayOriginal: string;
    readonly remainingTime: string;
    readonly minimumNoteRetry: string;
    readonly automaticStop: string;
    readonly privacy: string;
  };
  readonly results: {
    readonly title: string;
    readonly original: string;
    readonly automaticRemapping: string;
    readonly neutralTimbre: string;
    readonly regionalTimbre: string;
    readonly returnToKeyboard: string;
    readonly experimentDisclaimer: string;
  };
  readonly theory: {
    readonly open: string;
    readonly close: string;
    readonly intervalPattern: string;
    readonly noteCount: string;
    readonly methodology: string;
    readonly sources: string;
    readonly approximation: string;
  };
  readonly settings: {
    readonly language: string;
    readonly sound: string;
    readonly motion: string;
    readonly standardMotion: string;
    readonly reducedMotion: string;
    readonly about: string;
  };
  readonly notices: {
    readonly equalTemperament: string;
    readonly culturalScope: string;
    readonly regionalTimbre: string;
    readonly placeholderAudio: string;
    readonly noUpload: string;
  };
  readonly accessibility: {
    readonly destinationNavigation: string;
    readonly scaleCircle: string;
    readonly currentNote: string;
    readonly noActiveNote: string;
    readonly auditionDegree: string;
  };
}

export interface AssetRightsRecord {
  readonly status: RightsStatus;
  readonly license: string;
  readonly territories: readonly string[];
  readonly evidence: string | null;
}

export interface AssetManifestEntry {
  readonly id: MusicAssetId;
  readonly kind: "midi" | "audio" | "sample";
  readonly role: "local-example" | "comparison";
  readonly destinationId: DestinationId;
  readonly scaleId: ScaleId;
  readonly title: LocalizedName;
  readonly assetStatus: MusicAssetStatus;
  readonly approvalStatus: ApprovalStatus;
  readonly file: string | null;
  readonly source: {
    readonly composition: string;
    readonly selectionBasis: string;
    readonly referenceUrl: string | null;
  };
  readonly arranger: {
    readonly name: string;
    readonly status: ApprovalStatus;
  };
  readonly license: {
    readonly composition: AssetRightsRecord;
    readonly arrangement: AssetRightsRecord;
    readonly soundRecording: AssetRightsRecord;
  };
  readonly notes: string;
}

export interface AssetManifest {
  readonly schemaVersion: "1.0";
  readonly updatedAt: string;
  readonly policy: {
    readonly placeholderRule: string;
    readonly rightsRule: string;
  };
  readonly assets: readonly AssetManifestEntry[];
}
