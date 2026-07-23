import type { Melody, NoteEvent } from "./types";

export const DEFAULT_CAPTURE_BPM = 100;
export const EIGHTH_NOTE_BEATS = 0.5;

export type QuantizeRhythmOptions = Readonly<{
  /** Two subdivisions per quarter-note beat gives the MVP's 1/8-note grid. */
  subdivisionsPerBeat?: number;
  preserveMonophony?: boolean;
  outputId?: string;
}>;

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number.`);
  }
}

function roundToGrid(value: number, gridBeats: number): number {
  const rounded = Math.round((value + Number.EPSILON) / gridBeats) * gridBeats;
  // Keep common fractional grids stable for equality checks and serialization.
  return Number(rounded.toFixed(9));
}

function floorToGrid(value: number, gridBeats: number): number {
  const floored = Math.floor((value + Number.EPSILON) / gridBeats) * gridBeats;
  return Number(floored.toFixed(9));
}

/**
 * Lightly clean a recorded monophonic performance on an 1/8-note grid.
 * Event ids, pitch, velocity, tempo, and time signature are retained.
 */
export function quantizeRhythm(
  melody: Melody,
  options: QuantizeRhythmOptions = {},
): Melody {
  const subdivisionsPerBeat = options.subdivisionsPerBeat ?? 2;
  assertPositiveFinite(subdivisionsPerBeat, "subdivisionsPerBeat");
  const gridBeats = 1 / subdivisionsPerBeat;
  const preserveMonophony = options.preserveMonophony ?? true;

  const ordered = melody.events
    .map((event, sourceIndex) => ({ event, sourceIndex }))
    .sort(
      (left, right) =>
        left.event.startBeats - right.event.startBeats ||
        left.sourceIndex - right.sourceIndex,
    );

  const quantizedCandidates: NoteEvent[] = ordered.map(({ event }) => {
    if (!Number.isFinite(event.startBeats)) {
      throw new RangeError(`Event ${event.id} has an invalid start time.`);
    }
    assertPositiveFinite(event.durationBeats, `Event ${event.id} duration`);

    return {
      ...event,
      startBeats: Math.max(0, roundToGrid(event.startBeats, gridBeats)),
      durationBeats: Math.max(
        gridBeats,
        roundToGrid(event.durationBeats, gridBeats),
      ),
    };
  });

  if (!preserveMonophony) {
    return {
      ...melody,
      id: options.outputId ?? `${melody.id}--quantized`,
      events: quantizedCandidates,
    };
  }

  const inputEndBeats = ordered.reduce(
    (latest, { event }) =>
      Math.max(latest, event.startBeats + event.durationBeats),
    0,
  );
  // The minimum note duration may add one grid after a very short final note,
  // but quantization must never stretch a dense performance without bound.
  const latestOutputEndBeats = floorToGrid(
    Math.max(0, inputEndBeats) + gridBeats,
    gridBeats,
  );

  // Stable de-duplication policy: when several events round to the same onset,
  // retain the chronologically first one (the source-order tie-break above is
  // stable) and discard later events in that grid cell.
  const uniqueOnsets = quantizedCandidates.filter(
    (event, index, events) =>
      index === 0 || event.startBeats !== events[index - 1]?.startBeats,
  );
  const scheduled: NoteEvent[] = [];

  for (const candidate of uniqueOnsets) {
    const previous = scheduled[scheduled.length - 1];
    const earliestStart = previous
      ? previous.startBeats + gridBeats
      : 0;
    let startBeats = Math.max(candidate.startBeats, earliestStart);

    if (startBeats + gridBeats > latestOutputEndBeats) {
      const finalAvailableSlot = latestOutputEndBeats - gridBeats;
      if (finalAvailableSlot < earliestStart) {
        // No monophonic grid slot remains. Retaining the earlier event is the
        // deterministic choice and avoids extending the captured phrase.
        continue;
      }
      startBeats = finalAvailableSlot;
    }

    scheduled.push({ ...candidate, startBeats });
  }

  const quantized = scheduled.map((event, index) => {
    const nextStart = scheduled[index + 1]?.startBeats;
    const availableDuration =
      (nextStart ?? latestOutputEndBeats) - event.startBeats;

    return {
      ...event,
      durationBeats: Number(
        Math.min(event.durationBeats, availableDuration).toFixed(9),
      ),
    };
  });

  return {
    ...melody,
    id: options.outputId ?? `${melody.id}--quantized`,
    events: quantized,
  };
}
