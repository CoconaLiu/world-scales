import type { NoteEvent } from "../music/types";

export type AudioPlaybackState = "idle" | "playing" | "paused" | "ended";

export type AudioPauseReason = "user" | "visibility" | "context";

export type AudioContextStatus =
  | AudioContextState
  | "interrupted"
  | "unavailable";

export interface AudioPlaybackPosition {
  seconds: number;
  beats: number;
}

/**
 * A serializable view of the engine. React consumers can subscribe to state
 * changes while animation code reads the live position from the audio clock.
 */
export interface AudioEngineSnapshot {
  initialized: boolean;
  contextState: AudioContextStatus;
  playbackState: AudioPlaybackState;
  sessionId: number;
  melodyId: string | null;
  positionSeconds: number;
  positionBeats: number;
  durationSeconds: number;
  durationBeats: number;
  activeNoteId: string | null;
  pauseReason: AudioPauseReason | null;
  volume: number;
}

export interface AudioEngineOptions {
  /** Slider-style linear value in the inclusive range 0..1. */
  volume?: number;
  /** Overrides the default warm mallet-like harmonic timbre. */
  waveform?: OscillatorType;
  attackSeconds?: number;
  releaseSeconds?: number;
  scheduleAheadSeconds?: number;
  /** Primarily useful for deterministic unit tests. */
  contextFactory?: () => AudioContext;
}

export interface PlayOptions {
  /** Begin playback at this beat rather than at the start. */
  startAtBeats?: number;
  onEnded?: () => void;
}

export interface AuditionOptions {
  durationSeconds?: number;
  velocity?: number;
}

export type AudioEngineListener = (snapshot: AudioEngineSnapshot) => void;

export type ActiveNoteListener = (
  note: NoteEvent | null,
  snapshot: AudioEngineSnapshot,
) => void;

export type AudioEngineErrorCode =
  | "unsupported"
  | "initialization-failed"
  | "invalid-melody"
  | "disposed";

export class AudioEngineError extends Error {
  readonly code: AudioEngineErrorCode;

  constructor(code: AudioEngineErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AudioEngineError";
    this.code = code;
  }
}
