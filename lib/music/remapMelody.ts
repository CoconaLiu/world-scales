import { modulo12 } from "./scales";
import { detectTonic } from "./tonicDetection";
import type { Melody, NoteEvent, ScaleDefinition } from "./types";

export type RemapMelodyOptions = Readonly<{
  /** Skip detection when the caller has an explicit source-tonic reference. */
  sourceTonicMidi?: number;
  /** Maximum leap introduced when the source did not itself make a large leap. */
  maxIntroducedLeapSemitones?: number;
  outputId?: string;
}>;

function circularDistance(left: number, right: number): number {
  const clockwise = modulo12(left - right);
  return Math.min(clockwise, 12 - clockwise);
}

function sign(value: number): -1 | 0 | 1 {
  return value === 0 ? 0 : value > 0 ? 1 : -1;
}

function uniqueAscending(values: readonly number[]): readonly number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

/** Return every equally-near degree; register and direction break the tie later. */
export function nearestScaleDegrees(
  relativePitchClass: number,
  scaleSemitones: readonly number[],
): readonly number[] {
  if (scaleSemitones.length === 0) {
    throw new RangeError("A target scale must contain at least one degree.");
  }
  const normalizedDegrees = uniqueAscending(scaleSemitones.map(modulo12));
  const source = modulo12(relativePitchClass);
  const minimumDistance = Math.min(
    ...normalizedDegrees.map((degree) => circularDistance(source, degree)),
  );
  return normalizedDegrees.filter(
    (degree) => circularDistance(source, degree) === minimumDistance,
  );
}

function candidateMidis(
  degrees: readonly number[],
  targetTonicMidi: number,
  desiredMidi: number,
  previousOutputMidi: number | undefined,
): readonly number[] {
  const candidates = new Set<number>();

  for (const degree of degrees) {
    const desiredOctave = Math.round(
      (desiredMidi - targetTonicMidi - degree) / 12,
    );
    for (let offset = -2; offset <= 2; offset += 1) {
      candidates.add(targetTonicMidi + degree + 12 * (desiredOctave + offset));
    }

    if (previousOutputMidi !== undefined) {
      const previousOctave = Math.round(
        (previousOutputMidi - targetTonicMidi - degree) / 12,
      );
      for (let offset = -1; offset <= 1; offset += 1) {
        candidates.add(targetTonicMidi + degree + 12 * (previousOctave + offset));
      }
    }
  }

  return [...candidates];
}

type CandidateContext = Readonly<{
  desiredMidi: number;
  previousOutputMidi?: number;
  sourceDelta?: number;
  maxIntroducedLeapSemitones: number;
}>;

function selectCandidate(
  candidates: readonly number[],
  context: CandidateContext,
): number {
  let pool = [...candidates];
  const { previousOutputMidi, sourceDelta } = context;

  // A small source move must never create an octave-sized target move.
  if (
    previousOutputMidi !== undefined &&
    sourceDelta !== undefined &&
    Math.abs(sourceDelta) <= context.maxIntroducedLeapSemitones
  ) {
    const guarded = pool.filter(
      (candidate) =>
        Math.abs(candidate - previousOutputMidi) <=
        context.maxIntroducedLeapSemitones,
    );
    if (guarded.length > 0) pool = guarded;
  }

  const nearestRegisterDistance = Math.min(
    ...pool.map((candidate) => Math.abs(candidate - context.desiredMidi)),
  );
  pool = pool.filter(
    (candidate) =>
      Math.abs(candidate - context.desiredMidi) === nearestRegisterDistance,
  );

  // Equal-distance pitch-class/register ties follow the source direction.
  if (
    pool.length > 1 &&
    previousOutputMidi !== undefined &&
    sourceDelta !== undefined
  ) {
    const sourceDirection = sign(sourceDelta);
    const directional = pool.filter(
      (candidate) => sign(candidate - previousOutputMidi) === sourceDirection,
    );
    if (directional.length > 0) pool = directional;

    if (pool.length > 1) {
      const closestContour = Math.min(
        ...pool.map((candidate) =>
          Math.abs(candidate - previousOutputMidi - sourceDelta),
        ),
      );
      pool = pool.filter(
        (candidate) =>
          Math.abs(candidate - previousOutputMidi - sourceDelta) ===
          closestContour,
      );
    }
  }

  // Stable final tie-break makes repeated conversions byte-for-byte predictable.
  return pool.sort((left, right) => left - right)[0] ?? context.desiredMidi;
}

function validateScale(scale: ScaleDefinition): void {
  if (!Number.isInteger(scale.tonicMidi)) {
    throw new RangeError("Target tonicMidi must be an integer MIDI note.");
  }
  if (
    scale.semitones.length === 0 ||
    scale.semitones.some(
      (degree) => !Number.isInteger(degree) || degree < 0 || degree > 11,
    )
  ) {
    throw new RangeError(
      "Target semitones must be non-empty integer pitch classes in 0...11.",
    );
  }
}

/**
 * Deterministically remap monophonic pitches while preserving all event timing.
 * This is an experiment-oriented nearest-scale mapping, not an authentic style
 * or culturally representative arrangement.
 */
export function remapMelody(
  melody: Melody,
  targetScale: ScaleDefinition,
  options: RemapMelodyOptions = {},
): Melody {
  validateScale(targetScale);
  const sourceTonicMidi =
    options.sourceTonicMidi ?? detectTonic(melody).midi;
  const maxIntroducedLeapSemitones =
    options.maxIntroducedLeapSemitones ?? 7;

  if (!Number.isInteger(sourceTonicMidi)) {
    throw new RangeError("sourceTonicMidi must be an integer MIDI note.");
  }
  if (
    !Number.isFinite(maxIntroducedLeapSemitones) ||
    maxIntroducedLeapSemitones <= 0
  ) {
    throw new RangeError(
      "maxIntroducedLeapSemitones must be a positive finite number.",
    );
  }

  let previousSourceMidi: number | undefined;
  let previousOutputMidi: number | undefined;

  const events: NoteEvent[] = melody.events.map((event) => {
    if (!Number.isInteger(event.midi)) {
      throw new RangeError(`Event ${event.id} must use an integer MIDI note.`);
    }

    const relativeSemitones = event.midi - sourceTonicMidi;
    const desiredMidi = targetScale.tonicMidi + relativeSemitones;
    const degrees = nearestScaleDegrees(relativeSemitones, targetScale.semitones);
    const sourceDelta =
      previousSourceMidi === undefined
        ? undefined
        : event.midi - previousSourceMidi;
    const candidates = candidateMidis(
      degrees,
      targetScale.tonicMidi,
      desiredMidi,
      previousOutputMidi,
    );
    const mappedMidi = selectCandidate(candidates, {
      desiredMidi,
      previousOutputMidi,
      sourceDelta,
      maxIntroducedLeapSemitones,
    });

    previousSourceMidi = event.midi;
    previousOutputMidi = mappedMidi;
    return { ...event, midi: mappedMidi };
  });

  return {
    ...melody,
    id: options.outputId ?? `${melody.id}--${targetScale.id}`,
    events,
    status: "provisional",
    scaleId: targetScale.id,
  };
}

export function remapMelodyToAllScales(
  melody: Melody,
  scales: readonly ScaleDefinition[],
  options: Omit<RemapMelodyOptions, "outputId"> = {},
): Readonly<Record<string, Melody>> {
  return Object.fromEntries(
    scales.map((scale) => [scale.id, remapMelody(melody, scale, options)]),
  );
}

