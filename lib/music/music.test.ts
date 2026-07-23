import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMPARISON_MELODIES,
  EIGHTH_NOTE_BEATS,
  LOCAL_MELODIES,
  SCALES,
  SCALES_BY_ID,
  createSequentialMelody,
  detectTonic,
  modulo12,
  nearestScaleDegrees,
  quantizeRhythm,
  remapMelody,
  type Melody,
} from "./index";

function melody(id: string, pitches: readonly number[]): Melody {
  return {
    id,
    bpm: 100,
    timeSignature: [4, 4],
    events: pitches.map((midi, index) => ({
      id: `${id}-${index}`,
      midi,
      startBeats: index,
      durationBeats: 1,
      velocity: 0.7,
    })),
  };
}

describe("scale and placeholder data", () => {
  it("defines exactly five ordered, valid scale subsets", () => {
    assert.deepEqual(
      SCALES.map((scale) => scale.id),
      ["hijaz", "dorian", "gong", "miyakobushi", "degung"],
    );

    for (const scale of SCALES) {
      assert.ok(scale.semitones.length >= 5);
      assert.deepEqual(
        scale.semitones,
        [...new Set(scale.semitones)].sort((left, right) => left - right),
      );
      assert.ok(scale.semitones.every((degree) => degree >= 0 && degree <= 11));
      assert.equal(scale.degreeLabels.en.length, scale.semitones.length);
    }
    assert.match(SCALES_BY_ID.degung.disclaimer?.en ?? "", /approximation/i);
  });

  it("keeps every placeholder pitch inside its declared scale", () => {
    for (const collection of [COMPARISON_MELODIES, LOCAL_MELODIES]) {
      for (const scale of SCALES) {
        const example = collection[scale.id];
        for (const event of example.events) {
          assert.ok(
            scale.semitones.some(
              (degree) => degree === modulo12(event.midi - scale.tonicMidi),
            ),
            `${example.id}: MIDI ${event.midi} is outside ${scale.id}`,
          );
        }
      }
    }
  });

  it("uses matching rhythm for all five explicit comparison arrangements", () => {
    const reference = COMPARISON_MELODIES.hijaz.events.map(
      ({ startBeats, durationBeats }) => [startBeats, durationBeats],
    );
    for (const scale of SCALES) {
      assert.deepEqual(
        COMPARISON_MELODIES[scale.id].events.map(
          ({ startBeats, durationBeats }) => [startBeats, durationBeats],
        ),
        reference,
      );
    }
  });

  it("provides at least fifteen seconds in every local placeholder", () => {
    for (const example of Object.values(LOCAL_MELODIES)) {
      const finalEvent = example.events.at(-1);
      const durationBeats = finalEvent
        ? finalEvent.startBeats + finalEvent.durationBeats
        : 0;
      assert.ok((durationBeats * 60) / example.bpm >= 15, example.id);
    }
  });

  it("adds breathing room while keeping accents aligned to the bar", () => {
    const example = createSequentialMelody({
      id: "articulation",
      bpm: 100,
      scaleId: "gong",
      steps: [60, 62, 64, 67, 69].map((midi) => ({
        midi,
        durationBeats: 1,
      })),
    });

    assert.deepEqual(
      example.events.map(({ startBeats, durationBeats, velocity }) => [
        startBeats,
        durationBeats,
        velocity,
      ]),
      [
        [0, 0.86, 0.84],
        [1, 0.86, 0.68],
        [2, 0.86, 0.76],
        [3, 0.86, 0.68],
        [4, 1, 0.84],
      ],
    );
  });
});

describe("quantizeRhythm", () => {
  it("rounds starts and durations to the 1/8-note grid with a minimum 1/8", () => {
    const source: Melody = {
      id: "loose",
      bpm: 100,
      timeSignature: [4, 4],
      events: [
        { id: "a", midi: 60, startBeats: 0.24, durationBeats: 0.26, velocity: 0.5 },
        { id: "b", midi: 62, startBeats: 0.74, durationBeats: 0.76, velocity: 0.6 },
        { id: "c", midi: 64, startBeats: 1.26, durationBeats: 0.2, velocity: 0.7 },
      ],
    };
    const result = quantizeRhythm(source);

    assert.deepEqual(
      result.events.map(({ startBeats, durationBeats }) => [
        startBeats,
        durationBeats,
      ]),
      [
        [0, 0.5],
        [0.5, 1],
        [1.5, 0.5],
      ],
    );
    assert.equal(result.events[1]?.midi, 62);
    assert.equal(result.events[1]?.velocity, 0.6);
    assert.equal(source.events[0]?.startBeats, 0.24, "source must remain unchanged");
  });

  it("trims a quantized overlap without creating polyphony", () => {
    const source: Melody = {
      id: "overlap",
      bpm: 100,
      timeSignature: [4, 4],
      events: [
        { id: "a", midi: 60, startBeats: 0.1, durationBeats: 1.4, velocity: 0.7 },
        { id: "b", midi: 62, startBeats: 0.9, durationBeats: 0.5, velocity: 0.7 },
      ],
    };
    const result = quantizeRhythm(source);
    assert.deepEqual(
      result.events.map(({ startBeats, durationBeats }) => [
        startBeats,
        durationBeats,
      ]),
      [
        [0, 1],
        [1, 0.5],
      ],
    );
  });

  it("stably keeps the first event when several notes land on one grid onset", () => {
    const source: Melody = {
      id: "same-grid",
      bpm: 100,
      timeSignature: [4, 4],
      events: [
        { id: "first", midi: 60, startBeats: 0.01, durationBeats: 0.08, velocity: 0.7 },
        { id: "second", midi: 62, startBeats: 0.1, durationBeats: 0.08, velocity: 0.7 },
        { id: "third", midi: 64, startBeats: 0.2, durationBeats: 0.08, velocity: 0.7 },
      ],
    };

    const first = quantizeRhythm(source);
    const second = quantizeRhythm(source);
    assert.deepEqual(first, second);
    assert.deepEqual(first.events.map((event) => event.id), ["first"]);
    assert.deepEqual(first.events.map((event) => event.midi), [60]);
  });

  it("does not stretch a dense monophonic capture past its end plus one grid", () => {
    const source: Melody = {
      id: "dense",
      bpm: 100,
      timeSignature: [4, 4],
      events: Array.from({ length: 100 }, (_, index) => ({
        id: `dense-${index}`,
        midi: 60 + (index % 2),
        startBeats: index * 0.25,
        durationBeats: 0.08,
        velocity: 0.7,
      })),
    };
    const result = quantizeRhythm(source);
    const inputEnd = Math.max(
      ...source.events.map(
        (event) => event.startBeats + event.durationBeats,
      ),
    );
    const outputEnd = Math.max(
      ...result.events.map(
        (event) => event.startBeats + event.durationBeats,
      ),
    );

    assert.ok(outputEnd <= inputEnd + EIGHTH_NOTE_BEATS);
    assert.ok(result.events.length < source.events.length);
    for (let index = 1; index < result.events.length; index += 1) {
      const previous = result.events[index - 1];
      const current = result.events[index];
      assert.ok(previous && current);
      assert.ok(
        current.startBeats >= previous.startBeats + previous.durationBeats,
      );
    }
  });
});

describe("detectTonic", () => {
  it("selects the first stable long note", () => {
    const source: Melody = {
      id: "tonic-d",
      bpm: 100,
      timeSignature: [4, 4],
      events: [
        { id: "pickup", midi: 67, startBeats: 0, durationBeats: 0.25, velocity: 0.7 },
        { id: "stable", midi: 62, startBeats: 0.25, durationBeats: 1, velocity: 0.7 },
        { id: "tail", midi: 65, startBeats: 1.25, durationBeats: 0.5, velocity: 0.7 },
      ],
    };
    assert.deepEqual(detectTonic(source), {
      midi: 62,
      pitchClass: 2,
      confidence: 0.7928571428571429,
      reason: "first-stable-note",
    });
  });

  it("falls back to C4 when short, unrelated notes provide low confidence", () => {
    const source = melody("uncertain", [61, 64, 68]);
    const shortened: Melody = {
      ...source,
      events: source.events.map((event) => ({ ...event, durationBeats: 0.25 })),
    };
    const result = detectTonic(shortened);
    assert.equal(result.midi, 60);
    assert.equal(result.pitchClass, 0);
    assert.equal(result.reason, "fallback-c");
  });
});

describe("remapMelody", () => {
  it("returns all equally-near scale degrees for later directional tie-breaking", () => {
    assert.deepEqual(nearestScaleDegrees(1, SCALES_BY_ID.gong.semitones), [0, 2]);
    assert.deepEqual(nearestScaleDegrees(11, SCALES_BY_ID.gong.semitones), [0]);
  });

  it("resolves an equal-distance tie in the source direction", () => {
    const upward = remapMelody(melody("up", [60, 61]), SCALES_BY_ID.gong, {
      sourceTonicMidi: 60,
    });
    const downward = remapMelody(melody("down", [62, 61]), SCALES_BY_ID.gong, {
      sourceTonicMidi: 60,
    });
    assert.deepEqual(upward.events.map((event) => event.midi), [60, 62]);
    assert.deepEqual(downward.events.map((event) => event.midi), [62, 60]);
  });

  it("does not introduce a >7-semitone leap when the source leap is <=7", () => {
    const source = melody("guard", [65, 72]);
    const result = remapMelody(source, SCALES_BY_ID.degung, {
      sourceTonicMidi: 60,
    });
    const leap = Math.abs(
      (result.events[1]?.midi ?? 0) - (result.events[0]?.midi ?? 0),
    );
    assert.ok(leap <= 7);
  });

  it("allows a comparable large leap that already exists in the source", () => {
    const source = melody("source-octave", [65, 77]);
    const result = remapMelody(source, SCALES_BY_ID.degung, {
      sourceTonicMidi: 60,
    });
    const leap = Math.abs(
      (result.events[1]?.midi ?? 0) - (result.events[0]?.midi ?? 0),
    );
    assert.ok(leap > 7);
  });

  it("is deterministic, scale-valid, timing-preserving, and non-mutating", () => {
    const source = melody("deterministic", [60, 61, 66, 71, 72]);
    const snapshot = structuredClone(source);
    const first = remapMelody(source, SCALES_BY_ID.miyakobushi, {
      sourceTonicMidi: 60,
    });
    const second = remapMelody(source, SCALES_BY_ID.miyakobushi, {
      sourceTonicMidi: 60,
    });

    assert.deepEqual(first, second);
    assert.deepEqual(source, snapshot);
    assert.deepEqual(
      first.events.map(({ startBeats, durationBeats, velocity }) => [
        startBeats,
        durationBeats,
        velocity,
      ]),
      source.events.map(({ startBeats, durationBeats, velocity }) => [
        startBeats,
        durationBeats,
        velocity,
      ]),
    );
    assert.ok(
      first.events.every((event) =>
        SCALES_BY_ID.miyakobushi.semitones.some(
          (degree) =>
            degree ===
            modulo12(event.midi - SCALES_BY_ID.miyakobushi.tonicMidi),
        ),
      ),
    );
  });
});
