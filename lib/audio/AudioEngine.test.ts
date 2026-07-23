import assert from "node:assert/strict";
import test from "node:test";
import type { Melody } from "../music/types";
import { AudioEngine } from "./AudioEngine";
import { volumeToGain } from "./synthesis";

const MELODY: Melody = {
  id: "resume-race",
  bpm: 120,
  timeSignature: [4, 4],
  events: [
    {
      id: "note-1",
      midi: 60,
      startBeats: 0,
      durationBeats: 1,
      velocity: 0.8,
    },
  ],
};

test("concurrent resume calls share one scheduling operation", async () => {
  const context = new FakeAudioContext();
  const engine = new AudioEngine({
    contextFactory: () => context as unknown as AudioContext,
  });

  await engine.play(MELODY);
  assert.equal(engine.pause(), true);
  assert.equal(context.oscillators.length, 1);

  const gate = context.suspendUntilReleased();
  const firstResume = engine.resume();
  const secondResume = engine.resume();

  assert.strictEqual(secondResume, firstResume);
  assert.equal(context.resumeCalls, 1);

  gate.resolve();
  assert.deepEqual(await Promise.all([firstResume, secondResume]), [true, true]);
  assert.equal(context.oscillators.length, 2);

  await engine.dispose();
});

test("a pause request invalidates an in-flight resume", async () => {
  const context = new FakeAudioContext();
  const engine = new AudioEngine({
    contextFactory: () => context as unknown as AudioContext,
  });

  await engine.play(MELODY);
  engine.pause();

  const gate = context.suspendUntilReleased();
  const pendingResume = engine.resume();
  engine.pause("visibility");
  gate.resolve();

  assert.equal(await pendingResume, false);
  assert.equal(context.oscillators.length, 1);
  assert.equal(engine.getSnapshot().playbackState, "paused");

  await engine.dispose();
});

test("first play resumes a suspended context before scheduling audible voices", async () => {
  const context = new FakeAudioContext();
  context.setState("suspended");
  const engine = new AudioEngine({
    contextFactory: () => context as unknown as AudioContext,
  });

  await engine.play(MELODY);

  assert.equal(context.resumeCalls, 1);
  assert.equal(context.state, "running");
  assert.equal(engine.getSnapshot().contextState, "running");
  assert.equal(engine.getSnapshot().playbackState, "playing");
  assert.equal(context.oscillators.length, 1);
  assert.equal(context.gains[0]?.gain.value, volumeToGain(0.72));
  assert.ok(
    context.gains[1]?.gain.scheduledValues.some((value) => value > 0),
    "the voice gain should schedule an audible peak",
  );
  assert.equal(context.periodicWaves.length, 1);
  assertArrayCloseTo(
    context.periodicWaves[0]?.imaginary ?? [],
    [0, 1, 0.32, 0.12, 0.055, 0.025, 0.012],
  );
  assert.strictEqual(
    context.oscillators[0]?.periodicWave,
    context.periodicWaves[0],
  );
  assert.equal(context.filters.length, 1);
  assert.equal(context.filters[0]?.type, "lowpass");
  assert.deepEqual(context.filters[0]?.Q.scheduledValues, [0.65]);
  assert.deepEqual(
    context.filters[0]?.frequency.scheduledMethods,
    ["set", "exponential"],
  );

  const voiceEnvelope = context.gains[1]?.gain;
  assert.ok(voiceEnvelope);
  const audibleValues = voiceEnvelope.scheduledValues.filter(
    (value) => value > 0,
  );
  assert.equal(audibleValues.length, 3);
  assert.ok(
    audibleValues[1] < audibleValues[0],
    "the voice should decay from its mallet-like attack into a softer sustain",
  );
  assert.equal(audibleValues[2], audibleValues[1]);
  assert.ok(
    voiceEnvelope.scheduledTimes.at(-1)! > 1.54,
    "the release should ring beyond the nominal half-second note",
  );

  await engine.dispose();
});

test("the warm periodic wave is cached while each note gets its own filter", async () => {
  const context = new FakeAudioContext();
  const engine = new AudioEngine({
    contextFactory: () => context as unknown as AudioContext,
  });

  await engine.play(MELODY);
  engine.pause();
  assert.ok(
    (context.oscillators[0]?.stopTimes.at(-1) ?? Infinity) -
      context.currentTime <
      0.04,
    "transport pause should cut the natural tail before the next scheduled note",
  );
  await engine.resume();

  assert.equal(context.oscillators.length, 2);
  assert.equal(context.periodicWaves.length, 1);
  assert.equal(context.filters.length, 2);
  assert.strictEqual(
    context.oscillators[0]?.periodicWave,
    context.oscillators[1]?.periodicWave,
  );

  await engine.dispose();
});

test("an explicit oscillator waveform remains supported", async () => {
  const context = new FakeAudioContext();
  const engine = new AudioEngine({
    waveform: "square",
    contextFactory: () => context as unknown as AudioContext,
  });

  await engine.play(MELODY);

  assert.equal(context.periodicWaves.length, 0);
  assert.equal(context.oscillators[0]?.periodicWave, null);
  assert.equal(context.oscillators[0]?.type, "square");
  assert.equal(context.filters.length, 1);

  await engine.dispose();
});

test("an interrupted context is resumed before playback is reported", async () => {
  const context = new FakeAudioContext();
  context.setState("interrupted");
  const engine = new AudioEngine({
    contextFactory: () => context as unknown as AudioContext,
  });

  await engine.play(MELODY);

  assert.equal(context.resumeCalls, 1);
  assert.equal(context.state, "running");
  assert.equal(context.oscillators.length, 1);
  assert.equal(engine.getSnapshot().playbackState, "playing");

  await engine.dispose();
});

test("a context that stays suspended cannot enter playing state", async () => {
  const context = new FakeAudioContext();
  context.setState("suspended");
  context.resumeTargetState = "suspended";
  const engine = new AudioEngine({
    contextFactory: () => context as unknown as AudioContext,
  });

  await assert.rejects(engine.play(MELODY), /Audio output is not currently available/);

  assert.equal(context.resumeCalls, 1);
  assert.equal(context.oscillators.length, 0);
  assert.equal(engine.getSnapshot().playbackState, "idle");
  assert.equal(engine.getSnapshot().contextState, "suspended");

  await engine.dispose();
});

test("a context interruption pauses transport until the user resumes", async () => {
  const context = new FakeAudioContext();
  const engine = new AudioEngine({
    contextFactory: () => context as unknown as AudioContext,
  });

  await engine.play(MELODY);
  context.setState("interrupted");

  assert.equal(engine.getSnapshot().playbackState, "paused");
  assert.equal(engine.getSnapshot().pauseReason, "context");
  assert.ok((context.oscillators[0]?.stopCalls ?? 0) > 0);

  assert.equal(await engine.resume(), true);
  assert.equal(context.resumeCalls, 1);
  assert.equal(engine.getSnapshot().playbackState, "playing");
  assert.equal(engine.getSnapshot().pauseReason, null);
  assert.equal(context.oscillators.length, 2);

  await engine.dispose();
});

test("mute and unmute update both the snapshot and master gain", async () => {
  const context = new FakeAudioContext();
  const engine = new AudioEngine({
    contextFactory: () => context as unknown as AudioContext,
  });

  await engine.init();
  const masterGain = context.gains[0];
  assert.ok(masterGain);

  engine.setVolume(0);
  assert.equal(engine.getSnapshot().volume, 0);
  assert.equal(masterGain.gain.value, 0);

  engine.setVolume(0.72);
  assert.equal(engine.getSnapshot().volume, 0.72);
  assert.equal(masterGain.gain.value, volumeToGain(0.72));

  await engine.dispose();
});

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

class FakeAudioContext {
  currentTime = 1;
  state: AudioContextState | "interrupted" = "running";
  destination = {} as AudioDestinationNode;
  readonly oscillators: FakeOscillatorNode[] = [];
  readonly gains: FakeGainNode[] = [];
  readonly filters: FakeBiquadFilterNode[] = [];
  readonly periodicWaves: FakePeriodicWave[] = [];
  resumeCalls = 0;
  resumeTargetState: AudioContextState | "interrupted" = "running";
  private resumeGate: Deferred | null = null;
  private readonly stateListeners = new Set<() => void>();

  createGain(): GainNode {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain as unknown as GainNode;
  }

  createOscillator(): OscillatorNode {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  createBiquadFilter(): BiquadFilterNode {
    const filter = new FakeBiquadFilterNode();
    this.filters.push(filter);
    return filter as unknown as BiquadFilterNode;
  }

  createPeriodicWave(
    real: Float32Array,
    imaginary: Float32Array,
  ): PeriodicWave {
    const wave = new FakePeriodicWave(real, imaginary);
    this.periodicWaves.push(wave);
    return wave as unknown as PeriodicWave;
  }

  addEventListener(type: string, listener: () => void): void {
    if (type === "statechange") {
      this.stateListeners.add(listener);
    }
  }

  removeEventListener(type: string, listener: () => void): void {
    if (type === "statechange") {
      this.stateListeners.delete(listener);
    }
  }

  async resume(): Promise<void> {
    this.resumeCalls += 1;
    await this.resumeGate?.promise;
    this.setState(this.resumeTargetState);
    this.resumeGate = null;
  }

  async close(): Promise<void> {
    this.setState("closed");
  }

  suspendUntilReleased(): Deferred {
    let resolvePromise: () => void = () => undefined;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    const gate = { promise, resolve: resolvePromise };
    this.resumeGate = gate;
    this.setState("suspended");
    return gate;
  }

  setState(state: AudioContextState | "interrupted"): void {
    this.state = state;
    for (const listener of this.stateListeners) {
      listener();
    }
  }
}

class FakeAudioParam {
  value = 0;
  readonly scheduledValues: number[] = [];
  readonly scheduledMethods: string[] = [];
  readonly scheduledTimes: number[] = [];

  setValueAtTime(value: number, time = 0): AudioParam {
    this.value = value;
    this.scheduledValues.push(value);
    this.scheduledMethods.push("set");
    this.scheduledTimes.push(time);
    return this as unknown as AudioParam;
  }

  linearRampToValueAtTime(value: number, time = 0): AudioParam {
    this.value = value;
    this.scheduledValues.push(value);
    this.scheduledMethods.push("linear");
    this.scheduledTimes.push(time);
    return this as unknown as AudioParam;
  }

  exponentialRampToValueAtTime(value: number, time = 0): AudioParam {
    this.value = value;
    this.scheduledValues.push(value);
    this.scheduledMethods.push("exponential");
    this.scheduledTimes.push(time);
    return this as unknown as AudioParam;
  }

  cancelAndHoldAtTime(): AudioParam {
    return this as unknown as AudioParam;
  }

  cancelScheduledValues(): AudioParam {
    return this as unknown as AudioParam;
  }
}

class FakeGainNode {
  readonly gain = new FakeAudioParam();

  connect(): void {}

  disconnect(): void {}
}

class FakeOscillatorNode {
  type: OscillatorType = "sine";
  readonly frequency = new FakeAudioParam();
  periodicWave: FakePeriodicWave | null = null;
  stopCalls = 0;
  readonly stopTimes: number[] = [];

  connect(): void {}

  disconnect(): void {}

  addEventListener(): void {}

  setPeriodicWave(wave: PeriodicWave): void {
    this.periodicWave = wave as unknown as FakePeriodicWave;
  }

  start(): void {}

  stop(when = 0): void {
    this.stopCalls += 1;
    this.stopTimes.push(when);
  }
}

class FakeBiquadFilterNode {
  type: BiquadFilterType = "lowpass";
  readonly frequency = new FakeAudioParam();
  readonly Q = new FakeAudioParam();

  connect(): void {}

  disconnect(): void {}
}

class FakePeriodicWave {
  readonly real: number[];
  readonly imaginary: number[];

  constructor(real: Float32Array, imaginary: Float32Array) {
    this.real = Array.from(real);
    this.imaginary = Array.from(imaginary);
  }
}

function assertArrayCloseTo(
  actual: readonly number[],
  expected: readonly number[],
): void {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) => {
    assert.ok(
      Math.abs(value - expected[index]!) < 1e-6,
      `expected harmonic ${index} to be close to ${expected[index]}`,
    );
  });
}
