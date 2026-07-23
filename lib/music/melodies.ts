import type {
  Melody,
  MelodyCollection,
  NoteEvent,
  ScaleId,
  TimeSignature,
} from "./types";

type Step = Readonly<{
  midi: number;
  durationBeats: number;
  velocity?: number;
}>;

type MelodyInput = Readonly<{
  id: string;
  bpm: number;
  scaleId: ScaleId;
  steps: readonly Step[];
  timeSignature?: TimeSignature;
}>;

/** Build a sequential melody without mutating the provided step data. */
export function createSequentialMelody({
  id,
  bpm,
  scaleId,
  steps,
  timeSignature = [4, 4],
}: MelodyInput): Melody {
  let cursor = 0;
  const events: NoteEvent[] = steps.map((step, index) => {
    const event: NoteEvent = {
      id: `${id}-${index + 1}`,
      midi: step.midi,
      startBeats: cursor,
      durationBeats: step.durationBeats,
      velocity: step.velocity ?? (index % 4 === 0 ? 0.82 : 0.7),
    };
    cursor += step.durationBeats;
    return event;
  });

  return {
    id,
    bpm,
    timeSignature,
    events,
    status: "provisional",
    scaleId,
  };
}

function steps(
  pitches: readonly number[],
  durations: readonly number[],
): readonly Step[] {
  if (pitches.length !== durations.length) {
    throw new RangeError("Placeholder pitch and duration counts must match.");
  }

  return pitches.map((midi, index) => ({
    midi,
    durationBeats: durations[index] ?? 1,
  }));
}

const ODE_RHYTHM = [
  1, 1, 1, 1,
  1, 1, 1, 1,
  1, 1, 1, 1,
  1.5, 0.5, 2,
] as const;

/**
 * Five explicit, independently editable placeholder arrangements of the first
 * Ode to Joy phrase. They are not produced by `remapMelody` at runtime.
 */
export const COMPARISON_MELODIES: MelodyCollection = {
  hijaz: createSequentialMelody({
    id: "comparison-ode-hijaz-placeholder",
    bpm: 96,
    scaleId: "hijaz",
    steps: steps(
      [64, 64, 65, 67, 67, 65, 64, 61, 60, 60, 61, 64, 64, 61, 61],
      ODE_RHYTHM,
    ),
  }),
  dorian: createSequentialMelody({
    id: "comparison-ode-dorian-placeholder",
    bpm: 96,
    scaleId: "dorian",
    steps: steps(
      [63, 63, 65, 67, 67, 65, 63, 62, 60, 60, 62, 63, 63, 62, 62],
      ODE_RHYTHM,
    ),
  }),
  gong: createSequentialMelody({
    id: "comparison-ode-gong-placeholder",
    bpm: 96,
    scaleId: "gong",
    steps: steps(
      [64, 64, 67, 69, 69, 67, 64, 62, 60, 60, 62, 64, 64, 62, 62],
      ODE_RHYTHM,
    ),
  }),
  miyakobushi: createSequentialMelody({
    id: "comparison-ode-miyakobushi-placeholder",
    bpm: 96,
    scaleId: "miyakobushi",
    steps: steps(
      [65, 65, 67, 68, 68, 67, 65, 61, 60, 60, 61, 65, 65, 61, 61],
      ODE_RHYTHM,
    ),
  }),
  degung: createSequentialMelody({
    id: "comparison-ode-degung-placeholder",
    bpm: 96,
    scaleId: "degung",
    steps: steps(
      [63, 63, 67, 68, 68, 67, 63, 61, 60, 60, 61, 63, 63, 61, 61],
      ODE_RHYTHM,
    ),
  }),
};

/**
 * Original synthetic study melodies. These deliberately avoid copying the
 * unresolved repertoire named in the PRD while giving every prototype scale a
 * clearly audible contour and at least ~15 seconds of material.
 */
export const LOCAL_MELODIES: MelodyCollection = {
  hijaz: createSequentialMelody({
    id: "local-hijaz-original-placeholder",
    bpm: 96,
    scaleId: "hijaz",
    steps: steps(
      [60, 61, 64, 65, 67, 68, 70, 68, 67, 65, 64, 61, 60, 55, 60, 61, 64, 60],
      [1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 2, 3],
    ),
  }),
  dorian: createSequentialMelody({
    id: "local-dorian-original-placeholder",
    bpm: 104,
    scaleId: "dorian",
    steps: steps(
      [60, 62, 63, 67, 65, 63, 62, 60, 58, 60, 62, 65, 67, 69, 67, 65, 63, 60],
      [1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1, 2, 4],
    ),
  }),
  gong: createSequentialMelody({
    id: "local-gong-original-placeholder",
    bpm: 90,
    scaleId: "gong",
    steps: steps(
      [60, 64, 67, 69, 67, 64, 62, 60, 57, 60, 62, 64, 69, 67, 64, 62, 60],
      [1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 4],
    ),
  }),
  miyakobushi: createSequentialMelody({
    id: "local-miyakobushi-original-placeholder",
    bpm: 82,
    scaleId: "miyakobushi",
    steps: steps(
      [60, 61, 65, 68, 67, 65, 61, 60, 56, 60, 61, 67, 68, 67, 65, 61, 60],
      [1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 3],
    ),
  }),
  degung: createSequentialMelody({
    id: "local-degung-original-placeholder",
    bpm: 92,
    scaleId: "degung",
    steps: steps(
      [60, 63, 61, 67, 68, 67, 63, 61, 60, 56, 60, 61, 63, 68, 67, 63, 61, 60],
      [1, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 3],
    ),
  }),
};

export const comparisonMelodies = COMPARISON_MELODIES;
export const localMelodies = LOCAL_MELODIES;

export function getComparisonMelody(scaleId: ScaleId): Melody {
  return COMPARISON_MELODIES[scaleId];
}

export function getLocalMelody(scaleId: ScaleId): Melody {
  return LOCAL_MELODIES[scaleId];
}

