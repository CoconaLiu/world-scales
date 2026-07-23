import { modulo12 } from "./scales";
import type { Melody, NoteEvent, TonicDetection } from "./types";

export type DetectTonicOptions = Readonly<{
  stableDurationBeats?: number;
  confidenceThreshold?: number;
  fallbackMidi?: number;
}>;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function chronological(events: readonly NoteEvent[]): readonly NoteEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort(
      (left, right) =>
        left.event.startBeats - right.event.startBeats || left.index - right.index,
    )
    .map(({ event }) => event);
}

/**
 * Pick the first sustained note, with duration support and phrase-ending
 * support used as a confidence check. Low-confidence material falls back to C4.
 */
export function detectTonic(
  melody: Melody,
  options: DetectTonicOptions = {},
): TonicDetection {
  const stableDurationBeats = options.stableDurationBeats ?? 1;
  const confidenceThreshold = options.confidenceThreshold ?? 0.5;
  const fallbackMidi = options.fallbackMidi ?? 60;

  if (!Number.isFinite(stableDurationBeats) || stableDurationBeats <= 0) {
    throw new RangeError("stableDurationBeats must be a positive finite number.");
  }
  if (
    !Number.isFinite(confidenceThreshold) ||
    confidenceThreshold < 0 ||
    confidenceThreshold > 1
  ) {
    throw new RangeError("confidenceThreshold must be in the range 0...1.");
  }
  if (!Number.isInteger(fallbackMidi)) {
    throw new RangeError("fallbackMidi must be an integer MIDI note.");
  }

  const events = chronological(
    melody.events.filter(
      (event) =>
        Number.isInteger(event.midi) &&
        Number.isFinite(event.durationBeats) &&
        event.durationBeats > 0,
    ),
  );

  if (events.length === 0) {
    return {
      midi: fallbackMidi,
      pitchClass: modulo12(fallbackMidi),
      confidence: 0,
      reason: "fallback-c",
    };
  }

  const firstStable = events.find(
    (event) => event.durationBeats >= stableDurationBeats,
  );
  const longest = events.reduce((best, event) =>
    event.durationBeats > best.durationBeats ? event : best,
  );
  const candidate = firstStable ?? longest;
  const candidatePitchClass = modulo12(candidate.midi);
  const totalDuration = events.reduce(
    (total, event) => total + event.durationBeats,
    0,
  );
  const supportedDuration = events.reduce(
    (total, event) =>
      modulo12(event.midi) === candidatePitchClass
        ? total + event.durationBeats
        : total,
    0,
  );
  const endingSupport =
    modulo12(events[events.length - 1]?.midi ?? fallbackMidi) ===
    candidatePitchClass
      ? 1
      : 0;

  const lengthScore = clamp01(candidate.durationBeats / stableDurationBeats);
  const durationShare = totalDuration > 0 ? supportedDuration / totalDuration : 0;
  const confidence = clamp01(
    0.65 * lengthScore + 0.25 * durationShare + 0.1 * endingSupport,
  );

  if (confidence < confidenceThreshold) {
    return {
      midi: fallbackMidi,
      pitchClass: modulo12(fallbackMidi),
      confidence,
      reason: "fallback-c",
    };
  }

  return {
    midi: candidate.midi,
    pitchClass: candidatePitchClass,
    confidence,
    reason: firstStable ? "first-stable-note" : "longest-note",
  };
}

export function detectTonicMidi(
  melody: Melody,
  options: DetectTonicOptions = {},
): number {
  return detectTonic(melody, options).midi;
}

