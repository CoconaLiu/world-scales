const A4_MIDI = 69;
const A4_FREQUENCY = 440;

export function midiToFrequency(midi: number): number {
  if (!Number.isFinite(midi)) {
    throw new TypeError("MIDI note must be a finite number.");
  }

  return A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12);
}

export function clampUnitInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

/** A perceptually friendlier curve than sending a slider value to gain. */
export function volumeToGain(value: number): number {
  const normalized = clampUnitInterval(value);
  return normalized * normalized;
}
