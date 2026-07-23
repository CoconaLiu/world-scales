/** The five datasets appear in this order throughout the guided experience. */
export const SCALE_IDS = [
  "hijaz",
  "dorian",
  "gong",
  "miyakobushi",
  "degung",
] as const;

export type ScaleId = (typeof SCALE_IDS)[number];

export type ReviewStatus = "approved" | "provisional";

export type LocalizedText = Readonly<{
  en: string;
  zh: string;
  local?: string;
}>;

export type ScaleDefinition = Readonly<{
  id: ScaleId;
  name: LocalizedText;
  destination: Readonly<{
    en: string;
    zh: string;
  }>;
  /** MIDI note used as the playback and remapping root. */
  tonicMidi: number;
  /** Sorted, unique pitch classes relative to the root, in the range 0...11. */
  semitones: readonly number[];
  degreeLabels: Readonly<{
    en: readonly string[];
    zh?: readonly string[];
    local?: readonly string[];
  }>;
  color: string;
  status: ReviewStatus;
  disclaimer?: LocalizedText;
}>;

export type NoteEvent = Readonly<{
  id: string;
  midi: number;
  startBeats: number;
  durationBeats: number;
  /** Normalized gain/velocity proxy in the inclusive range 0...1. */
  velocity: number;
}>;

export type TimeSignature = readonly [beatsPerBar: number, beatUnit: number];

export type Melody = Readonly<{
  id: string;
  bpm: number;
  timeSignature: TimeSignature;
  events: readonly NoteEvent[];
  /** Marks development data that must be replaced or reviewed before release. */
  status?: ReviewStatus;
  scaleId?: ScaleId;
}>;

export type MelodyCollection = Readonly<Record<ScaleId, Melody>>;

export type TonicDetectionReason =
  | "first-stable-note"
  | "longest-note"
  | "fallback-c";

export type TonicDetection = Readonly<{
  /** A register-aware MIDI tonic close to the chosen source note. */
  midi: number;
  pitchClass: number;
  confidence: number;
  reason: TonicDetectionReason;
}>;

