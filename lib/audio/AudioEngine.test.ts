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

  setValueAtTime(value: number): AudioParam {
    this.value = value;
    this.scheduledValues.push(value);
    return this as unknown as AudioParam;
  }

  linearRampToValueAtTime(value: number): AudioParam {
    this.value = value;
    this.scheduledValues.push(value);
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
  stopCalls = 0;

  connect(): void {}

  disconnect(): void {}

  addEventListener(): void {}

  start(): void {}

  stop(): void {
    this.stopCalls += 1;
  }
}
