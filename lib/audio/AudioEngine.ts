import type { Melody, NoteEvent } from "../music/types";
import { clampUnitInterval, midiToFrequency, volumeToGain } from "./synthesis";
import {
  AudioEngineError,
  type ActiveNoteListener,
  type AudioEngineListener,
  type AudioEngineOptions,
  type AudioEngineSnapshot,
  type AudioPauseReason,
  type AudioPlaybackPosition,
  type AuditionOptions,
  type PlayOptions,
} from "./types";

const DEFAULT_VOLUME = 0.72;
const DEFAULT_ATTACK_SECONDS = 0.008;
const DEFAULT_RELEASE_SECONDS = 0.028;
const DEFAULT_SCHEDULE_AHEAD_SECONDS = 0.04;
const DEFAULT_AUDITION_SECONDS = 0.48;
const DEFAULT_VELOCITY = 0.78;
const VOICE_PEAK_GAIN = 0.2;
const SOURCE_STOP_PADDING_SECONDS = 0.012;

interface ScheduledVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  stopped: boolean;
}

interface PlaybackSession {
  id: number;
  melody: Melody;
  events: NoteEvent[];
  durationBeats: number;
  durationSeconds: number;
  offsetSeconds: number;
  audioStartTime: number | null;
  voices: Set<ScheduledVoice>;
  onEnded?: () => void;
}

interface ResumeOperation {
  version: number;
  promise: Promise<boolean>;
}

type SafariAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

/**
 * Framework-independent Web Audio transport for monophonic melodies.
 *
 * Call `init()` from a user gesture. Sound is scheduled exclusively against
 * `AudioContext.currentTime`; requestAnimationFrame is used only to report the
 * currently active note to visuals.
 */
export class AudioEngine {
  static isSupported(): boolean {
    return Boolean(getAudioContextConstructor());
  }

  private readonly options: Required<
    Pick<
      AudioEngineOptions,
      "waveform" | "attackSeconds" | "releaseSeconds" | "scheduleAheadSeconds"
    >
  > &
    Pick<AudioEngineOptions, "contextFactory">;

  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private session: PlaybackSession | null = null;
  private readonly auditions = new Set<ScheduledVoice>();
  private readonly listeners = new Set<AudioEngineListener>();
  private readonly activeNoteListeners = new Set<ActiveNoteListener>();
  private frameId: number | null = null;
  private nextSessionId = 1;
  private playRequestVersion = 0;
  private auditionRequestVersion = 0;
  private resumeRequestVersion = 0;
  private resumeOperation: ResumeOperation | null = null;
  private disposed = false;
  private visibilityCleanup: (() => void) | null = null;
  private readonly handleContextStateChange = () => {
    if (!this.context) {
      return;
    }

    const contextState = this.context.state as AudioEngineSnapshot["contextState"];
    this.updateSnapshot({ contextState }, true);

    if (
      contextState !== "running" &&
      this.snapshot.playbackState === "playing"
    ) {
      this.pause("context");
    }
  };

  private snapshot: AudioEngineSnapshot;

  constructor(options: AudioEngineOptions = {}) {
    const volume = clampUnitInterval(options.volume ?? DEFAULT_VOLUME);

    this.options = {
      waveform: options.waveform ?? "triangle",
      attackSeconds: nonNegativeOrDefault(
        options.attackSeconds,
        DEFAULT_ATTACK_SECONDS,
      ),
      releaseSeconds: nonNegativeOrDefault(
        options.releaseSeconds,
        DEFAULT_RELEASE_SECONDS,
      ),
      scheduleAheadSeconds: nonNegativeOrDefault(
        options.scheduleAheadSeconds,
        DEFAULT_SCHEDULE_AHEAD_SECONDS,
      ),
      contextFactory: options.contextFactory,
    };

    this.snapshot = {
      initialized: false,
      contextState: "unavailable",
      playbackState: "idle",
      sessionId: 0,
      melodyId: null,
      positionSeconds: 0,
      positionBeats: 0,
      durationSeconds: 0,
      durationBeats: 0,
      activeNoteId: null,
      pauseReason: null,
      volume,
    };
  }

  /** Must be called as a direct consequence of a click, tap, or key press. */
  async init(): Promise<void> {
    this.assertNotDisposed();

    if (this.context) {
      await this.resumeContext();
      return;
    }

    let context: AudioContext;

    try {
      if (this.options.contextFactory) {
        context = this.options.contextFactory();
      } else {
        const Context = getAudioContextConstructor();

        if (!Context) {
          throw new AudioEngineError(
            "unsupported",
            "Web Audio is not supported in this browser.",
          );
        }

        context = new Context({ latencyHint: "interactive" });
      }

      const masterGain = context.createGain();
      masterGain.gain.setValueAtTime(
        volumeToGain(this.snapshot.volume),
        context.currentTime,
      );
      masterGain.connect(context.destination);
      context.addEventListener("statechange", this.handleContextStateChange);

      this.context = context;
      this.masterGain = masterGain;
      this.updateSnapshot(
        {
          initialized: true,
          contextState: context.state,
        },
        true,
      );

      await this.resumeContext();
    } catch (error) {
      if (error instanceof AudioEngineError) {
        throw error;
      }

      throw new AudioEngineError(
        "initialization-failed",
        "The audio system could not be initialized.",
        { cause: error },
      );
    }
  }

  /** Plays one short pitch without altering the melody transport. */
  async audition(midi: number, options: AuditionOptions = {}): Promise<void> {
    validateMidi(midi);
    const requestVersion = ++this.auditionRequestVersion;
    await this.init();

    if (requestVersion !== this.auditionRequestVersion) {
      return;
    }

    const context = this.requireContext();
    const durationSeconds = positiveOrDefault(
      options.durationSeconds,
      DEFAULT_AUDITION_SECONDS,
    );
    const velocity = clampUnitInterval(options.velocity ?? DEFAULT_VELOCITY);
    const startsAt = context.currentTime + 0.006;

    this.stopAudition();

    const voice = this.createVoice(
      midi,
      velocity,
      startsAt,
      startsAt + durationSeconds,
      this.auditions,
    );
    this.auditions.add(voice);
  }

  /** Fades any currently auditioned pitch without changing transport state. */
  stopAudition(): void {
    this.auditionRequestVersion += 1;

    if (!this.context) {
      this.auditions.clear();
      return;
    }

    const now = this.context.currentTime;
    for (const voice of this.auditions) {
      this.fadeAndStopVoice(voice, now);
    }
    this.auditions.clear();
  }

  /** Starts a new, exclusive playback session. Any old session is cancelled. */
  async play(melody: Melody, options: PlayOptions = {}): Promise<void> {
    validateMelody(melody);
    this.invalidatePendingResume();
    const requestVersion = ++this.playRequestVersion;
    await this.init();

    if (requestVersion !== this.playRequestVersion) {
      return;
    }

    this.cancelCurrentSession(false);

    const events = [...melody.events].sort(compareEvents);
    const durationBeats = events.reduce(
      (latest, event) =>
        Math.max(latest, event.startBeats + event.durationBeats),
      0,
    );
    const durationSeconds = beatsToSeconds(durationBeats, melody.bpm);
    const requestedBeat = options.startAtBeats ?? 0;
    const startAtBeats = Math.min(
      durationBeats,
      Math.max(0, Number.isFinite(requestedBeat) ? requestedBeat : 0),
    );
    const session: PlaybackSession = {
      id: this.nextSessionId++,
      melody,
      events,
      durationBeats,
      durationSeconds,
      offsetSeconds: beatsToSeconds(startAtBeats, melody.bpm),
      audioStartTime: null,
      voices: new Set(),
      onEnded: options.onEnded,
    };

    this.session = session;

    if (session.offsetSeconds >= session.durationSeconds) {
      this.updateSnapshot(
        {
          playbackState: "ended",
          sessionId: session.id,
          melodyId: melody.id,
          positionSeconds: durationSeconds,
          positionBeats: durationBeats,
          durationSeconds,
          durationBeats,
          activeNoteId: null,
          pauseReason: null,
        },
        true,
      );
      this.callSafely(options.onEnded);
      return;
    }

    this.scheduleSession(session);
    this.updateSnapshot(
      {
        playbackState: "playing",
        sessionId: session.id,
        melodyId: melody.id,
        positionSeconds: session.offsetSeconds,
        positionBeats: startAtBeats,
        durationSeconds,
        durationBeats,
        activeNoteId: null,
        pauseReason: null,
      },
      true,
    );
    this.startVisualClock();
  }

  /** Returns false when there is no running session to pause. */
  pause(reason: AudioPauseReason = "user"): boolean {
    this.invalidatePendingResume();
    const session = this.session;
    if (!session || this.snapshot.playbackState !== "playing") {
      return false;
    }

    session.offsetSeconds = this.getPlaybackPosition().seconds;
    session.audioStartTime = null;
    this.cancelFrame();
    this.stopSessionVoices(session);
    this.updatePositionSnapshot(session, session.offsetSeconds);
    this.setActiveNote(null);
    this.updateSnapshot(
      { playbackState: "paused", pauseReason: reason },
      true,
    );
    return true;
  }

  /** Returns false when there is no paused session to resume. */
  resume(): Promise<boolean> {
    if (this.resumeOperation) {
      return this.resumeOperation.promise;
    }

    const session = this.session;
    if (!session || this.snapshot.playbackState !== "paused") {
      return Promise.resolve(false);
    }

    const version = ++this.resumeRequestVersion;
    const promise = this.resumeSession(session, version);
    this.resumeOperation = { version, promise };

    const clearOperation = () => {
      if (this.resumeOperation?.version === version) {
        this.resumeOperation = null;
      }
    };
    void promise.then(clearOperation, clearOperation);

    return promise;
  }

  private async resumeSession(
    session: PlaybackSession,
    version: number,
  ): Promise<boolean> {
    await this.init();

    if (
      version !== this.resumeRequestVersion ||
      session !== this.session ||
      this.snapshot.playbackState !== "paused"
    ) {
      return false;
    }

    if (session.offsetSeconds >= session.durationSeconds) {
      this.finishSession(session);
      return false;
    }

    this.scheduleSession(session);
    this.updateSnapshot(
      { playbackState: "playing", pauseReason: null },
      true,
    );
    this.startVisualClock();
    return true;
  }

  /** Stops playback and clears the current melody. */
  stop(): void {
    this.invalidatePendingResume();
    this.playRequestVersion += 1;
    this.cancelCurrentSession(true);
  }

  setVolume(volume: number): void {
    const normalized = clampUnitInterval(volume);
    this.updateSnapshot({ volume: normalized }, true);

    if (!this.context || !this.masterGain) {
      return;
    }

    const now = this.context.currentTime;
    holdAudioParam(this.masterGain.gain, now);
    this.masterGain.gain.linearRampToValueAtTime(
      volumeToGain(normalized),
      now + 0.02,
    );
  }

  getVolume(): number {
    return this.snapshot.volume;
  }

  /** Stable until the engine emits another state or active-note change. */
  getSnapshot(): AudioEngineSnapshot {
    return this.snapshot;
  }

  /** Reads the live transport position directly from AudioContext.currentTime. */
  getPlaybackPosition(): AudioPlaybackPosition {
    const session = this.session;

    if (!session) {
      return { seconds: 0, beats: 0 };
    }

    let seconds = session.offsetSeconds;

    if (
      this.snapshot.playbackState === "playing" &&
      session.audioStartTime !== null &&
      this.context
    ) {
      seconds += Math.max(0, this.context.currentTime - session.audioStartTime);
    }

    seconds = Math.min(session.durationSeconds, Math.max(0, seconds));
    return {
      seconds,
      beats: secondsToBeats(seconds, session.melody.bpm),
    };
  }

  subscribe(listener: AudioEngineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  onActiveNoteChange(listener: ActiveNoteListener): () => void {
    this.activeNoteListeners.add(listener);
    return () => {
      this.activeNoteListeners.delete(listener);
    };
  }

  /**
   * Pauses on backgrounding and deliberately does not auto-resume. The returned
   * cleanup removes the listener. A second call replaces the previous binding.
   */
  bindVisibilityHandling(target?: Document): () => void {
    this.visibilityCleanup?.();

    const visibilityTarget =
      target ?? (typeof document === "undefined" ? undefined : document);

    if (!visibilityTarget) {
      return () => undefined;
    }

    const onVisibilityChange = () => {
      this.handleVisibilityChange(visibilityTarget.hidden);
    };

    visibilityTarget.addEventListener("visibilitychange", onVisibilityChange);

    const cleanup = () => {
      visibilityTarget.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      );
      if (this.visibilityCleanup === cleanup) {
        this.visibilityCleanup = null;
      }
    };

    this.visibilityCleanup = cleanup;
    return cleanup;
  }

  /** Allows a framework lifecycle hook to forward visibility without binding. */
  handleVisibilityChange(hidden: boolean): void {
    if (hidden) {
      this.pause("visibility");
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.visibilityCleanup?.();
    this.invalidatePendingResume();
    this.playRequestVersion += 1;
    this.auditionRequestVersion += 1;
    this.cancelCurrentSession(false);
    this.stopAudition();
    this.disposed = true;

    const context = this.context;
    if (context) {
      context.removeEventListener("statechange", this.handleContextStateChange);
      if (context.state !== "closed") {
        await context.close();
      }
    }

    this.context = null;
    this.masterGain = null;
    this.listeners.clear();
    this.activeNoteListeners.clear();
    this.snapshot = {
      ...this.snapshot,
      initialized: false,
      contextState: "unavailable",
      playbackState: "idle",
      melodyId: null,
      activeNoteId: null,
      pauseReason: null,
      positionSeconds: 0,
      positionBeats: 0,
      durationSeconds: 0,
      durationBeats: 0,
    };
  }

  private async resumeContext(): Promise<void> {
    const context = this.requireContext();
    const state = context.state as AudioEngineSnapshot["contextState"];

    if (state === "closed") {
      throw new AudioEngineError(
        "initialization-failed",
        "The audio output is closed and cannot be resumed.",
      );
    }

    if (state !== "running") {
      await context.resume();
    }

    const resumedState = context.state as AudioEngineSnapshot["contextState"];
    this.updateSnapshot({ contextState: resumedState }, true);

    if (resumedState !== "running") {
      throw new AudioEngineError(
        "initialization-failed",
        "Audio output is not currently available.",
      );
    }
  }

  private scheduleSession(session: PlaybackSession): void {
    const context = this.requireContext();
    const startsAt = context.currentTime + this.options.scheduleAheadSeconds;
    session.audioStartTime = startsAt;
    session.voices.clear();

    for (const event of session.events) {
      const eventStart = beatsToSeconds(event.startBeats, session.melody.bpm);
      const eventEnd = beatsToSeconds(
        event.startBeats + event.durationBeats,
        session.melody.bpm,
      );

      if (eventEnd <= session.offsetSeconds) {
        continue;
      }

      const voiceStart = startsAt + Math.max(0, eventStart - session.offsetSeconds);
      const voiceEnd = startsAt + eventEnd - session.offsetSeconds;
      const voice = this.createVoice(
        event.midi,
        event.velocity,
        voiceStart,
        voiceEnd,
        session.voices,
      );
      session.voices.add(voice);
    }
  }

  private createVoice(
    midi: number,
    velocity: number,
    startsAt: number,
    endsAt: number,
    owner: Set<ScheduledVoice>,
  ): ScheduledVoice {
    const context = this.requireContext();
    const masterGain = this.requireMasterGain();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const duration = Math.max(0.001, endsAt - startsAt);
    const attack = Math.min(this.options.attackSeconds, duration * 0.45);
    const release = Math.min(this.options.releaseSeconds, duration * 0.45);
    const peak = clampUnitInterval(velocity) * VOICE_PEAK_GAIN;
    const voice: ScheduledVoice = { oscillator, gain, stopped: false };

    oscillator.type = this.options.waveform;
    oscillator.frequency.setValueAtTime(midiToFrequency(midi), startsAt);
    gain.gain.setValueAtTime(0, startsAt);
    gain.gain.linearRampToValueAtTime(peak, startsAt + attack);
    gain.gain.setValueAtTime(peak, Math.max(startsAt + attack, endsAt - release));
    gain.gain.linearRampToValueAtTime(0, endsAt);

    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.addEventListener(
      "ended",
      () => {
        voice.stopped = true;
        owner.delete(voice);
        oscillator.disconnect();
        gain.disconnect();
      },
      { once: true },
    );
    oscillator.start(startsAt);
    oscillator.stop(endsAt + SOURCE_STOP_PADDING_SECONDS);

    return voice;
  }

  private fadeAndStopVoice(voice: ScheduledVoice, now: number): void {
    if (voice.stopped) {
      return;
    }

    voice.stopped = true;

    try {
      holdAudioParam(voice.gain.gain, now);
      voice.gain.gain.linearRampToValueAtTime(
        0,
        now + this.options.releaseSeconds,
      );
      voice.oscillator.stop(
        now + this.options.releaseSeconds + SOURCE_STOP_PADDING_SECONDS,
      );
    } catch {
      // A naturally ended oscillator can race a pause/stop call. It is safe to
      // ignore InvalidStateError because its output is already silent.
    }
  }

  private stopSessionVoices(session: PlaybackSession): void {
    if (!this.context) {
      session.voices.clear();
      return;
    }

    const now = this.context.currentTime;
    for (const voice of session.voices) {
      this.fadeAndStopVoice(voice, now);
    }
    session.voices.clear();
  }

  private cancelCurrentSession(emit: boolean): void {
    this.cancelFrame();

    if (this.session) {
      this.stopSessionVoices(this.session);
      this.session = null;
    }

    this.setActiveNote(null);
    this.updateSnapshot(
      {
        playbackState: "idle",
        melodyId: null,
        positionSeconds: 0,
        positionBeats: 0,
        durationSeconds: 0,
        durationBeats: 0,
        activeNoteId: null,
        pauseReason: null,
      },
      emit,
    );
  }

  private invalidatePendingResume(): void {
    this.resumeRequestVersion += 1;
    this.resumeOperation = null;
  }

  private startVisualClock(): void {
    this.cancelFrame();

    const tick = () => {
      this.frameId = null;
      const session = this.session;

      if (!session || this.snapshot.playbackState !== "playing") {
        return;
      }

      const position = this.getPlaybackPosition();

      const beforeScheduledStart =
        session.audioStartTime !== null &&
        this.context !== null &&
        this.context.currentTime < session.audioStartTime;
      const activeNote = beforeScheduledStart
        ? null
        : findActiveNote(session.events, position.beats);
      if (this.snapshot.activeNoteId !== (activeNote?.id ?? null)) {
        this.updatePositionSnapshot(session, position.seconds);
      }
      this.setActiveNote(activeNote);

      if (position.seconds >= session.durationSeconds) {
        this.finishSession(session);
        return;
      }

      this.frameId = requestFrame(tick);
    };

    this.frameId = requestFrame(tick);
  }

  private finishSession(session: PlaybackSession): void {
    if (session !== this.session) {
      return;
    }

    this.cancelFrame();
    session.offsetSeconds = session.durationSeconds;
    session.audioStartTime = null;
    this.updatePositionSnapshot(session, session.durationSeconds);
    this.setActiveNote(null);
    this.updateSnapshot(
      { playbackState: "ended", pauseReason: null },
      true,
    );
    this.callSafely(session.onEnded);
  }

  private updatePositionSnapshot(
    session: PlaybackSession,
    seconds: number,
  ): void {
    this.snapshot = {
      ...this.snapshot,
      positionSeconds: seconds,
      positionBeats: secondsToBeats(seconds, session.melody.bpm),
    };
  }

  private setActiveNote(note: NoteEvent | null): void {
    const noteId = note?.id ?? null;
    if (this.snapshot.activeNoteId === noteId) {
      return;
    }

    this.snapshot = { ...this.snapshot, activeNoteId: noteId };
    this.emitState();

    for (const listener of this.activeNoteListeners) {
      this.callSafely(listener, note, this.snapshot);
    }
  }

  private updateSnapshot(
    update: Partial<AudioEngineSnapshot>,
    emit: boolean,
  ): void {
    this.snapshot = { ...this.snapshot, ...update };
    if (emit) {
      this.emitState();
    }
  }

  private emitState(): void {
    for (const listener of this.listeners) {
      this.callSafely(listener, this.snapshot);
    }
  }

  private callSafely<TArguments extends unknown[]>(
    callback: ((...args: TArguments) => void) | undefined,
    ...args: TArguments
  ): void {
    if (!callback) {
      return;
    }

    try {
      callback(...args);
    } catch (error) {
      reportCallbackError(error);
    }
  }

  private cancelFrame(): void {
    if (this.frameId === null) {
      return;
    }

    cancelFrame(this.frameId);
    this.frameId = null;
  }

  private requireContext(): AudioContext {
    if (!this.context) {
      throw new AudioEngineError(
        "initialization-failed",
        "AudioEngine.init() must complete before audio can be used.",
      );
    }
    return this.context;
  }

  private requireMasterGain(): GainNode {
    if (!this.masterGain) {
      throw new AudioEngineError(
        "initialization-failed",
        "The audio output graph is unavailable.",
      );
    }
    return this.masterGain;
  }

  private assertNotDisposed(): void {
    if (this.disposed) {
      throw new AudioEngineError(
        "disposed",
        "This AudioEngine has been disposed and cannot be reused.",
      );
    }
  }
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const audioWindow = window as SafariAudioWindow;
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
}

function requestFrame(callback: FrameRequestCallback): number {
  if (
    typeof window !== "undefined" &&
    typeof window.requestAnimationFrame === "function"
  ) {
    return window.requestAnimationFrame(callback);
  }

  return -1;
}

function cancelFrame(id: number): void {
  if (
    id >= 0 &&
    typeof window !== "undefined" &&
    typeof window.cancelAnimationFrame === "function"
  ) {
    window.cancelAnimationFrame(id);
  }
}

function findActiveNote(
  events: readonly NoteEvent[],
  positionBeats: number,
): NoteEvent | null {
  let active: NoteEvent | null = null;

  for (const event of events) {
    if (event.startBeats > positionBeats) {
      break;
    }

    if (positionBeats < event.startBeats + event.durationBeats) {
      active = event;
    }
  }

  return active;
}

function compareEvents(left: NoteEvent, right: NoteEvent): number {
  return left.startBeats - right.startBeats || left.midi - right.midi;
}

function validateMelody(melody: Melody): void {
  if (!melody || typeof melody !== "object") {
    throw invalidMelody("Melody must be an object.");
  }
  if (!melody.id || typeof melody.id !== "string") {
    throw invalidMelody("Melody.id must be a non-empty string.");
  }
  if (!Number.isFinite(melody.bpm) || melody.bpm <= 0) {
    throw invalidMelody("Melody.bpm must be greater than zero.");
  }
  if (!Array.isArray(melody.events) || melody.events.length === 0) {
    throw invalidMelody("Melody.events must contain at least one note.");
  }

  for (const event of melody.events) {
    if (!event.id || typeof event.id !== "string") {
      throw invalidMelody("Every note event needs a non-empty id.");
    }
    validateMidi(event.midi, true);
    if (!Number.isFinite(event.startBeats) || event.startBeats < 0) {
      throw invalidMelody("Note startBeats must be zero or greater.");
    }
    if (!Number.isFinite(event.durationBeats) || event.durationBeats <= 0) {
      throw invalidMelody("Note durationBeats must be greater than zero.");
    }
    if (
      !Number.isFinite(event.velocity) ||
      event.velocity < 0 ||
      event.velocity > 1
    ) {
      throw invalidMelody("Note velocity must be in the range 0..1.");
    }
  }
}

function validateMidi(midi: number, asMelodyError = false): void {
  if (!Number.isFinite(midi) || midi < 0 || midi > 127) {
    if (asMelodyError) {
      throw invalidMelody("Note MIDI values must be in the range 0..127.");
    }
    throw new RangeError("MIDI note must be in the range 0..127.");
  }
}

function invalidMelody(message: string): AudioEngineError {
  return new AudioEngineError("invalid-melody", message);
}

function beatsToSeconds(beats: number, bpm: number): number {
  return (beats * 60) / bpm;
}

function secondsToBeats(seconds: number, bpm: number): number {
  return (seconds * bpm) / 60;
}

function positiveOrDefault(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function nonNegativeOrDefault(
  value: number | undefined,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function holdAudioParam(param: AudioParam, atTime: number): void {
  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(atTime);
    return;
  }

  const currentValue = param.value;
  param.cancelScheduledValues(atTime);
  param.setValueAtTime(currentValue, atTime);
}

function reportCallbackError(error: unknown): void {
  const globalWithReporter = globalThis as typeof globalThis & {
    reportError?: (reportedError: unknown) => void;
  };

  globalWithReporter.reportError?.(error);
}
