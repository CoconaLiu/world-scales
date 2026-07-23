import assert from "node:assert/strict";
import test from "node:test";
import type { Melody } from "../music/types";
import { AudioEngine } from "./AudioEngine";

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

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
}

class FakeAudioContext {
  currentTime = 1;
  state: AudioContextState = "running";
  destination = {} as AudioDestinationNode;
  readonly oscillators: FakeOscillatorNode[] = [];
  resumeCalls = 0;
  private resumeGate: Deferred | null = null;

  createGain(): GainNode {
    return new FakeGainNode() as unknown as GainNode;
  }

  createOscillator(): OscillatorNode {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator as unknown as OscillatorNode;
  }

  addEventListener(): void {}

  removeEventListener(): void {}

  async resume(): Promise<void> {
    this.resumeCalls += 1;
    await this.resumeGate?.promise;
    this.state = "running";
    this.resumeGate = null;
  }

  async close(): Promise<void> {
    this.state = "closed";
  }

  suspendUntilReleased(): Deferred {
    let resolvePromise: () => void = () => undefined;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    const gate = { promise, resolve: resolvePromise };
    this.resumeGate = gate;
    this.state = "suspended";
    return gate;
  }
}

class FakeAudioParam {
  value = 0;

  setValueAtTime(value: number): AudioParam {
    this.value = value;
    return this as unknown as AudioParam;
  }

  linearRampToValueAtTime(value: number): AudioParam {
    this.value = value;
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

  connect(): void {}

  disconnect(): void {}

  addEventListener(): void {}

  start(): void {}

  stop(): void {}
}
