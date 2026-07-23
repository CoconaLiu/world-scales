"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AtlasMap } from "./atlas-map";
import { PianoKeyboard } from "./piano-keyboard";
import { ScaleCircle } from "./scale-circle";
import {
  AudioEngine,
  type AudioEngineSnapshot,
} from "@/lib/audio";
import {
  DESTINATIONS,
  formatCopy,
  getProductCopy,
  type Locale,
} from "@/lib/content";
import {
  COMPARISON_MELODIES,
  LOCAL_MELODIES,
  SCALES,
  quantizeRhythm,
  remapMelody,
  type Melody,
  type NoteEvent,
} from "@/lib/music";

type Phase = "landing" | "tutorial" | "tour" | "keyboard" | "results";
type TourMode = "local" | "comparison";

const CAPTURE_BPM = 100;
const MAX_RECORDING_SECONDS = 15;
const DESTINATION_BY_SCALE_ID = new Map(
  DESTINATIONS.map((item) => [item.scaleId, item] as const),
);
const ORDERED_DESTINATIONS = SCALES.map((scale) => {
  const destination = DESTINATION_BY_SCALE_ID.get(scale.id);
  if (!destination) {
    throw new Error(`Missing destination content for scale: ${scale.id}`);
  }
  return destination;
});

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
}

function playIcon(playing: boolean) {
  return playing ? "Ⅱ" : "▶";
}

function midiNoteName(midi: number) {
  const names = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export function WorldScalesExperience() {
  const [engine] = useState(() => new AudioEngine({ waveform: "triangle" }));
  const [phase, setPhase] = useState<Phase>("landing");
  const [locale, setLocale] = useState<Locale>("zh");
  const [activeIndex, setActiveIndex] = useState(0);
  const [tourMode, setTourMode] = useState<TourMode>("local");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [audioSnapshot, setAudioSnapshot] = useState<AudioEngineSnapshot>(() =>
    engine.getSnapshot(),
  );
  const [transportMidi, setTransportMidi] = useState<number | null>(null);
  const [auditionMidi, setAuditionMidi] = useState<number | null>(null);
  const [clockSeconds, setClockSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [recordStatus, setRecordStatus] = useState<string | null>(null);
  const [originalMelody, setOriginalMelody] = useState<Melody | null>(null);
  const [capturedMelody, setCapturedMelody] = useState<Melody | null>(null);
  const [resultPlayingOriginal, setResultPlayingOriginal] = useState(false);
  const [tutorialInterrupted, setTutorialInterrupted] = useState(false);

  const copy = getProductCopy(locale);
  const scale = SCALES[activeIndex] ?? SCALES[0];
  const destination = DESTINATION_BY_SCALE_ID.get(scale.id) ?? DESTINATIONS[0];
  const themeColor = destination.theme.primary;
  const isPlaying = audioSnapshot.playbackState === "playing";
  const isPaused = audioSnapshot.playbackState === "paused";
  const activeMidi = auditionMidi ?? transportMidi;

  const experienceStyle = {
    "--theme": themeColor,
    "--theme-rgb": hexToRgb(themeColor),
    "--theme-text": destination.theme.highlight,
  } as CSSProperties &
    Record<"--theme" | "--theme-rgb" | "--theme-text", string>;

  const playTourRef = useRef<
    (index: number, mode: TourMode) => Promise<void>
  >(async () => undefined);
  const stopRecordingRef = useRef<(playOriginalAfter?: boolean) => void>(
    () => undefined,
  );
  const phaseRef = useRef<Phase>(phase);
  const recordStartRef = useRef<number | null>(null);
  const recordingRef = useRef(false);
  const rawEventsRef = useRef<NoteEvent[]>([]);
  const pendingNoteRef = useRef<{ midi: number; startMs: number } | null>(null);
  const keyboardAuditionMidiRef = useRef<number | null>(null);
  const auditionTimerRef = useRef<number | null>(null);
  const disposeTimerRef = useRef<number | null>(null);
  const resultQueueTokenRef = useRef(0);
  const aboutButtonRef = useRef<HTMLButtonElement | null>(null);
  const aboutDialogRef = useRef<HTMLDialogElement | null>(null);

  const resultMelodies = useMemo(
    () =>
      capturedMelody
        ? SCALES.map((targetScale) =>
            remapMelody(capturedMelody, targetScale, {
              outputId: `${capturedMelody.id}-${targetScale.id}`,
            }),
          )
        : [],
    [capturedMelody],
  );

  useEffect(() => {
    if (disposeTimerRef.current !== null) {
      window.clearTimeout(disposeTimerRef.current);
      disposeTimerRef.current = null;
    }
    const unsubscribeState = engine.subscribe(setAudioSnapshot);
    const unsubscribeNote = engine.onActiveNoteChange((note) => {
      setTransportMidi(note?.midi ?? null);
    });
    const unbindVisibility = engine.bindVisibilityHandling();
    return () => {
      unsubscribeState();
      unsubscribeNote();
      unbindVisibility();
      // React Strict Mode replays effects during development. Defer disposal
      // one task so the replayed setup can retain the same engine instance.
      disposeTimerRef.current = window.setTimeout(() => {
        disposeTimerRef.current = null;
        void engine.dispose();
      }, 0);
    };
  }, [engine]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const closeAbout = useCallback(() => {
    if (aboutDialogRef.current?.open) aboutDialogRef.current.close();
    setAboutOpen(false);
    window.requestAnimationFrame(() => aboutButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!aboutOpen) return;
    const dialog = aboutDialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, [aboutOpen]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>(
        `[data-phase-heading="${phase}"]`,
      );
      heading?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) return;
      engine.stopAudition();
      keyboardAuditionMidiRef.current = null;
      setAuditionMidi(null);
      if (phaseRef.current === "tutorial") {
        setTutorialInterrupted(true);
      }
      if (recordingRef.current) {
        stopRecordingRef.current(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [engine]);

  useEffect(() => {
    if (audioSnapshot.playbackState !== "playing") return;
    const interval = window.setInterval(() => {
      setClockSeconds(engine.getPlaybackPosition().seconds);
    }, 100);
    return () => window.clearInterval(interval);
  }, [audioSnapshot.playbackState, engine]);

  const handleAudioFailure = useCallback(
    (error: unknown) => {
      console.error(error);
      setAudioError(true);
    },
    [],
  );

  const clearAudition = useCallback(() => {
    engine.stopAudition();
    keyboardAuditionMidiRef.current = null;
    if (auditionTimerRef.current !== null) {
      window.clearTimeout(auditionTimerRef.current);
      auditionTimerRef.current = null;
    }
    setAuditionMidi(null);
  }, [engine]);

  const playTour = useCallback(
    async (index: number, mode: TourMode) => {
      const nextScale = SCALES[index];
      if (!nextScale) return;
      const melody =
        mode === "local"
          ? LOCAL_MELODIES[nextScale.id]
          : COMPARISON_MELODIES[nextScale.id];

      setActiveIndex(index);
      setTourMode(mode);
      setResultPlayingOriginal(false);
      setClockSeconds(0);
      clearAudition();

      try {
        await engine.play(melody, {
          onEnded: () => {
            if (mode === "local") {
              setTourMode("comparison");
              void playTourRef.current(index, "comparison");
              return;
            }
            if (index < SCALES.length - 1) {
              setActiveIndex(index + 1);
              setTourMode("local");
              void playTourRef.current(index + 1, "local");
              return;
            }
            setPhase("keyboard");
            setTransportMidi(null);
            setAuditionMidi(null);
          },
        });
      } catch (error) {
        handleAudioFailure(error);
      }
    },
    [clearAudition, engine, handleAudioFailure],
  );

  useEffect(() => {
    playTourRef.current = playTour;
  }, [playTour]);

  const startTour = useCallback(() => {
    setPhase("tour");
    setTutorialInterrupted(false);
    setTutorialStep(2);
    setActiveIndex(0);
    setTourMode("local");
    void playTourRef.current(0, "local");
  }, []);

  useEffect(() => {
    if (phase !== "tutorial" || tutorialInterrupted) return;
    void engine.audition(60, { durationSeconds: 0.75 }).catch(handleAudioFailure);

    const octaveTimer = window.setTimeout(() => {
      setTutorialStep(1);
      void engine.audition(72, { durationSeconds: 0.85 }).catch(handleAudioFailure);
    }, 1350);
    const scaleTimer = window.setTimeout(() => setTutorialStep(2), 3600);
    const finishTimer = window.setTimeout(startTour, 7200);

    return () => {
      window.clearTimeout(octaveTimer);
      window.clearTimeout(scaleTimer);
      window.clearTimeout(finishTimer);
      engine.stopAudition();
    };
  }, [engine, handleAudioFailure, phase, startTour, tutorialInterrupted]);

  const startExperience = async () => {
    setAudioError(false);
    if (!AudioEngine.isSupported()) {
      setAudioError(true);
      return;
    }
    try {
      await engine.init();
      setTutorialStep(0);
      setTutorialInterrupted(false);
      setPhase("tutorial");
    } catch (error) {
      handleAudioFailure(error);
    }
  };

  const audition = useCallback(
    (midi: number) => {
      setAuditionMidi(midi);
      keyboardAuditionMidiRef.current = null;
      void engine.audition(midi).catch(handleAudioFailure);
      if (auditionTimerRef.current !== null) {
        window.clearTimeout(auditionTimerRef.current);
      }
      auditionTimerRef.current = window.setTimeout(() => {
        if (!recordingRef.current) setAuditionMidi(null);
      }, 520);
    },
    [engine, handleAudioFailure],
  );

  const auditionKeyboard = useCallback(
    (midi: number) => {
      if (auditionTimerRef.current !== null) {
        window.clearTimeout(auditionTimerRef.current);
        auditionTimerRef.current = null;
      }
      setAuditionMidi(midi);
      keyboardAuditionMidiRef.current = midi;
      void engine
        .audition(midi, { durationSeconds: MAX_RECORDING_SECONDS })
        .catch(handleAudioFailure);
    },
    [engine, handleAudioFailure],
  );

  const closePendingNote = useCallback((nowMs: number, expectedMidi?: number) => {
    const pending = pendingNoteRef.current;
    const recordStart = recordStartRef.current;
    if (!pending || recordStart === null) return;
    if (expectedMidi !== undefined && pending.midi !== expectedMidi) return;

    const deadline = recordStart + MAX_RECORDING_SECONDS * 1000;
    if (pending.startMs >= deadline) {
      pendingNoteRef.current = null;
      return;
    }
    const boundedEnd = Math.min(Math.max(nowMs, pending.startMs + 1), deadline);
    const startBeats = ((pending.startMs - recordStart) / 1000) * (CAPTURE_BPM / 60);
    const durationBeats = Math.max(
      0.001,
      ((boundedEnd - pending.startMs) / 1000) * (CAPTURE_BPM / 60),
    );
    rawEventsRef.current.push({
      id: `capture-${rawEventsRef.current.length + 1}`,
      midi: pending.midi,
      startBeats: Math.max(0, startBeats),
      durationBeats,
      velocity: 0.78,
    });
    pendingNoteRef.current = null;
  }, []);

  const onKeyboardNoteStart = useCallback(
    (midi: number) => {
      auditionKeyboard(midi);
      if (!recordingRef.current) return;
      const now = performance.now();
      const recordStart = recordStartRef.current;
      if (
        recordStart !== null &&
        now >= recordStart + MAX_RECORDING_SECONDS * 1000
      ) {
        stopRecordingRef.current();
        return;
      }
      closePendingNote(now);
      pendingNoteRef.current = { midi, startMs: now };
    },
    [auditionKeyboard, closePendingNote],
  );

  const onKeyboardNoteEnd = useCallback(
    (midi: number) => {
      if (recordingRef.current) closePendingNote(performance.now(), midi);
      if (keyboardAuditionMidiRef.current !== midi) return;
      engine.stopAudition();
      keyboardAuditionMidiRef.current = null;
      setAuditionMidi(null);
    },
    [closePendingNote, engine],
  );

  const stopRecording = useCallback((playOriginalAfter = true) => {
    if (!recordingRef.current) return;
    const recordStart = recordStartRef.current;
    const stoppedAt =
      recordStart === null
        ? performance.now()
        : Math.min(
            performance.now(),
            recordStart + MAX_RECORDING_SECONDS * 1000,
          );
    closePendingNote(stoppedAt);
    recordingRef.current = false;
    setRecording(false);
    clearAudition();

    const captured = [...rawEventsRef.current];
    if (captured.length < 3) {
      setRecordStatus(copy.keyboard.minimumNoteRetry);
      return;
    }

    const rawMelody: Melody = {
      id: `user-melody-${Date.now()}`,
      bpm: CAPTURE_BPM,
      timeSignature: [4, 4],
      events: captured,
      status: "provisional",
    };
    const cleaned = quantizeRhythm(rawMelody, {
      outputId: `${rawMelody.id}-clean`,
    });
    setOriginalMelody(rawMelody);
    setCapturedMelody(cleaned);
    setResultPlayingOriginal(true);
    setActiveIndex(0);
    setPhase("results");
    setRecordStatus(null);
    setClockSeconds(0);
    if (playOriginalAfter) {
      void engine.play(rawMelody).catch(handleAudioFailure);
    }
  }, [clearAudition, closePendingNote, copy.keyboard.minimumNoteRetry, engine, handleAudioFailure]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  useEffect(() => {
    if (!recording) return;
    const interval = window.setInterval(() => {
      const start = recordStartRef.current;
      if (start === null) return;
      const elapsed = Math.min(
        MAX_RECORDING_SECONDS,
        (performance.now() - start) / 1000,
      );
      setRecordingElapsed(elapsed);
      if (elapsed >= MAX_RECORDING_SECONDS) stopRecordingRef.current(true);
    }, 80);
    return () => window.clearInterval(interval);
  }, [recording]);

  const startRecording = async () => {
    try {
      await engine.init();
    } catch (error) {
      handleAudioFailure(error);
      return;
    }
    engine.stop();
    clearAudition();
    rawEventsRef.current = [];
    pendingNoteRef.current = null;
    recordStartRef.current = performance.now();
    recordingRef.current = true;
    setRecording(true);
    setRecordingElapsed(0);
    setRecordStatus(null);
  };

  const playResult = useCallback(
    async (index: number) => {
      resultQueueTokenRef.current += 1;
      const melody = resultMelodies[index];
      if (!melody) return;
      setActiveIndex(index);
      setResultPlayingOriginal(false);
      setClockSeconds(0);
      clearAudition();
      try {
        await engine.play(melody);
      } catch (error) {
        handleAudioFailure(error);
      }
    },
    [clearAudition, engine, handleAudioFailure, resultMelodies],
  );

  const playOriginal = async () => {
    resultQueueTokenRef.current += 1;
    if (!originalMelody) return;
    setResultPlayingOriginal(true);
    setClockSeconds(0);
    clearAudition();
    try {
      await engine.play(originalMelody);
    } catch (error) {
      handleAudioFailure(error);
    }
  };

  const replayAllResults = useCallback(() => {
    const token = resultQueueTokenRef.current + 1;
    resultQueueTokenRef.current = token;

    const playAt = async (index: number): Promise<void> => {
      if (token !== resultQueueTokenRef.current) return;
      const melody = resultMelodies[index];
      if (!melody) return;

      setActiveIndex(index);
      setResultPlayingOriginal(false);
      setClockSeconds(0);
      clearAudition();
      try {
        await engine.play(melody, {
          onEnded: () => {
            if (token === resultQueueTokenRef.current) {
              void playAt(index + 1);
            }
          },
        });
      } catch (error) {
        handleAudioFailure(error);
      }
    };

    void playAt(0);
  }, [clearAudition, engine, handleAudioFailure, resultMelodies]);

  const togglePlayback = async () => {
    if (isPlaying) {
      engine.pause();
      return;
    }
    if (isPaused) {
      try {
        await engine.resume();
      } catch (error) {
        handleAudioFailure(error);
      }
      return;
    }
    if (phase === "tour") {
      await playTour(activeIndex, tourMode);
    } else if (phase === "results") {
      if (resultPlayingOriginal) await playOriginal();
      else await playResult(activeIndex);
    }
  };

  const selectDestination = (index: number) => {
    engine.stop();
    clearAudition();
    setActiveIndex(index);
    setTourMode("local");
    setTransportMidi(null);
    setClockSeconds(0);
  };

  const changeTourMode = (mode: TourMode) => {
    engine.stop();
    clearAudition();
    setTourMode(mode);
    setTransportMidi(null);
    setClockSeconds(0);
  };

  const previous = () => {
    if (phase === "tour") {
      selectDestination(Math.max(0, activeIndex - 1));
      return;
    }
    if (phase === "results") void playResult(Math.max(0, activeIndex - 1));
  };

  const next = () => {
    if (phase === "tour") {
      if (activeIndex >= SCALES.length - 1) {
        engine.stop();
        clearAudition();
        setPhase("keyboard");
      } else {
        selectDestination(activeIndex + 1);
      }
      return;
    }
    if (phase === "results") {
      void playResult(Math.min(SCALES.length - 1, activeIndex + 1));
    }
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    engine.setVolume(nextMuted ? 0 : 0.72);
  };

  const tutorialScale = {
    ...SCALES[2],
    semitones: tutorialStep < 2 ? ([0] as readonly number[]) : SCALES[2].semitones,
  };

  const track = destination.tracks[tourMode];
  const nowPlayingTitle =
    phase === "results"
      ? resultPlayingOriginal
        ? copy.results.original
        : `${destination.scaleName[locale]} · ${copy.results.automaticRemapping}`
      : track.title[locale];

  return (
    <div
      className={`experience${reducedMotion ? " reduce-motion" : ""}`}
      style={experienceStyle}
    >
      <div className="noise" aria-hidden="true" />
      <header className="topbar">
        <div className="brand" aria-label="World Scales">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <strong>World Scales</strong>
            <span>{copy.brand.localizedTitle}</span>
          </div>
        </div>
        <div className="global-controls">
          <button
            className="text-button"
            type="button"
            onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
            aria-label={copy.settings.language}
          >
            {locale === "zh" ? "EN" : "中文"}
          </button>
          <button
            className="text-button motion-control"
            type="button"
            onClick={() => setReducedMotion((value) => !value)}
            aria-pressed={reducedMotion}
          >
            {reducedMotion ? copy.settings.reducedMotion : copy.settings.standardMotion}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={toggleMute}
            aria-label={muted ? copy.transport.soundOn : copy.transport.mute}
            aria-pressed={muted}
          >
            {muted ? "×♪" : "♪"}
          </button>
          <button
            ref={aboutButtonRef}
            className="icon-button"
            type="button"
            onClick={() => setAboutOpen(true)}
            aria-label={copy.settings.about}
          >
            ?
          </button>
        </div>
      </header>

      <main className="main-shell">
        <AtlasMap activeIndex={activeIndex} />

        {phase === "landing" ? (
          <section className="center-stage" style={{ gridColumn: "1 / -1" }}>
            <div className="hero-copy">
              <p className="eyebrow">
                {locale === "zh" ? "一张可演奏的音乐地图" : "An interactive musical atlas"}
              </p>
              <h1 data-phase-heading="landing" tabIndex={-1}>
                World
                <br />
                Scales
                <em>{copy.brand.localizedTitle}</em>
              </h1>
              <p>{copy.landing.description}</p>
              <button className="primary-button" type="button" onClick={startExperience}>
                {copy.landing.primaryCta} &nbsp; ↗
              </button>
              <span className="sound-note">♪ {copy.landing.soundRecommended}</span>
              {audioError ? (
                <p className="record-status is-error">{copy.transport.unsupportedAudio}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {phase === "tutorial" ? (
          <section className="center-stage" style={{ gridColumn: "1 / -1" }}>
            <div
              className={`octave-demo${tutorialStep >= 1 ? " is-merged" : ""}`}
              aria-hidden="true"
            >
              <span className="octave-note low">C4</span>
              <span className="octave-note high">C5</span>
            </div>
            <ScaleCircle
              scale={tutorialScale}
              activeMidi={tutorialStep === 0 ? 60 : tutorialStep === 1 ? 72 : null}
              onAudition={audition}
              locale={locale}
              showReferenceTicks={tutorialStep >= 2}
            />
            <div className="tutorial-card" role="status" aria-live="polite">
              <p className="eyebrow">
                {locale === "zh" ? "八度入门" : "Octave tutorial"} · 00:0
                {tutorialStep + 1}
              </p>
              <div className="tutorial-progress">
                <span style={{ width: `${((tutorialStep + 1) / 3) * 100}%` }} />
              </div>
              <h2 data-phase-heading="tutorial" tabIndex={-1}>
                {copy.tutorial.title}
              </h2>
              <p>
                {tutorialStep === 0
                  ? copy.tutorial.twelveTicksLabel
                  : tutorialStep === 1
                    ? copy.tutorial.octaveMessage
                    : copy.tutorial.scaleMessage}
              </p>
              <button className="secondary-button" type="button" onClick={startTour}>
                {copy.tutorial.skip} →
              </button>
            </div>
          </section>
        ) : null}

        {phase === "tour" ? (
          <>
            <aside className="side-rail" aria-label={copy.accessibility.destinationNavigation}>
              <p className="eyebrow">
                {locale === "zh" ? "引导式世界巡游" : "Guided world tour"}
              </p>
              <h1 className="rail-title">{copy.tour.title}</h1>
              <nav className="destination-list">
                {ORDERED_DESTINATIONS.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`destination-button${index === activeIndex ? " is-active" : ""}`}
                    onClick={() => selectDestination(index)}
                    aria-current={index === activeIndex ? "step" : undefined}
                  >
                    <span className="destination-number">0{index + 1}</span>
                    <span className="destination-name">
                      <strong>{item.name[locale]}</strong>
                      <span>{item.scaleName[locale]}</span>
                    </span>
                    <span className="destination-dots" aria-hidden="true">
                      {index === activeIndex ? "••" : "·"}
                    </span>
                  </button>
                ))}
              </nav>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${((activeIndex + 1) / SCALES.length) * 100}%` }} />
              </div>
            </aside>

            <section className="center-stage">
              <nav className="mobile-destinations" aria-label={copy.accessibility.destinationNavigation}>
                {ORDERED_DESTINATIONS.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    className={index === activeIndex ? "is-active" : ""}
                    onClick={() => selectDestination(index)}
                    aria-current={index === activeIndex ? "step" : undefined}
                  >
                    0{index + 1} · {item.name[locale]}
                  </button>
                ))}
              </nav>
              <div className="mobile-mode-switch segmented">
                <button
                  className={`segment-button${tourMode === "local" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => changeTourMode("local")}
                  aria-pressed={tourMode === "local"}
                >
                  {copy.tour.localMode}
                </button>
                <button
                  className={`segment-button${tourMode === "comparison" ? " is-active" : ""}`}
                  type="button"
                  onClick={() => changeTourMode("comparison")}
                  aria-pressed={tourMode === "comparison"}
                >
                  {copy.tour.comparisonMode}
                </button>
              </div>
              <ScaleCircle
                scale={scale}
                activeMidi={activeMidi}
                onAudition={audition}
                locale={locale}
              />
              <div className="stage-status" aria-live="polite">
                <h2 data-phase-heading="tour" tabIndex={-1}>
                  {track.title[locale]}
                </h2>
                <p>
                  {tourMode === "local" ? copy.tour.localMode : copy.tour.comparisonMode}
                  {track.status === "placeholder"
                    ? locale === "zh"
                      ? " · 合成占位音频"
                      : " · Synthesized placeholder"
                    : ""}
                </p>
                {scale.id === "degung" ? (
                  <p className="approximation-note">
                    12-TET approximation · consultant review pending
                  </p>
                ) : null}
              </div>
            </section>

            <aside className="info-panel">
              <div className="info-header">
                <div>
                  <span className="info-index">
                    {formatCopy(copy.tour.progressLabel, {
                      current: activeIndex + 1,
                      total: SCALES.length,
                    })}
                  </span>
                  <h2>
                    {destination.name[locale]}
                    <small>{destination.name.local}</small>
                  </h2>
                </div>
                <span className="status-pill">
                  {locale === "zh" ? "占位 · 权利待审" : "Placeholder · rights pending"}
                </span>
              </div>
              <p className="info-description">{destination.shortGuide[locale]}</p>
              {scale.id === "degung" ? (
                <p className="approximation-note">{destination.disclaimer[locale]}</p>
              ) : null}
              <div className="stat-grid">
                <div className="stat">
                  <span>{locale === "zh" ? "每八度音数" : "Notes per octave"}</span>
                  <strong>{scale.semitones.length} / 12</strong>
                </div>
                <div className="stat">
                  <span>{copy.theory.intervalPattern}</span>
                  <strong>{scale.semitones.join(" · ")}</strong>
                </div>
              </div>
              <div className="mode-box">
                <span>{locale === "zh" ? "聆听模式" : "Listening mode"}</span>
                <div className="segmented">
                  <button
                    className={`segment-button${tourMode === "local" ? " is-active" : ""}`}
                    type="button"
                    onClick={() => changeTourMode("local")}
                    aria-pressed={tourMode === "local"}
                  >
                    {copy.tour.localMode}
                  </button>
                  <button
                    className={`segment-button${tourMode === "comparison" ? " is-active" : ""}`}
                    type="button"
                    onClick={() => changeTourMode("comparison")}
                    aria-pressed={tourMode === "comparison"}
                  >
                    {copy.tour.comparisonMode}
                  </button>
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {phase === "keyboard" ? (
          <section className="center-stage" style={{ gridColumn: "1 / -1" }}>
            <div className="keyboard-stage">
              <div className="phase-heading">
                <p className="eyebrow">
                  {locale === "zh" ? "你的旋律 · 最长 15 秒" : "Your melody · 15 sec max"}
                </p>
                <h1 data-phase-heading="keyboard" tabIndex={-1}>
                  {copy.keyboard.prompt}
                </h1>
                <p>{copy.keyboard.instructions}</p>
              </div>
              <div className="recording-meter">
                <span>
                  {recording ? <span className="record-dot" /> : null}
                  {formatTime(recordingElapsed)}
                </span>
                <div>
                  <span style={{ width: `${(recordingElapsed / MAX_RECORDING_SECONDS) * 100}%` }} />
                </div>
                <span>0:15</span>
              </div>
              <span className="sr-only" aria-live="polite">
                {recording
                  ? formatCopy(copy.keyboard.remainingTime, {
                      seconds: Math.max(
                        0,
                        Math.ceil(MAX_RECORDING_SECONDS - recordingElapsed),
                      ),
                    })
                  : ""}
              </span>
              <PianoKeyboard
                activeMidi={activeMidi}
                onNoteStart={onKeyboardNoteStart}
                onNoteEnd={onKeyboardNoteEnd}
                locale={locale}
              />
              <div className="button-row">
                <button
                  className={recording ? "secondary-button" : "primary-button"}
                  type="button"
                  onClick={() => {
                    if (recording) stopRecording(true);
                    else void startRecording();
                  }}
                >
                  {recording ? `■ ${copy.keyboard.stopRecording}` : `● ${copy.keyboard.startRecording}`}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={recording}
                  onClick={() => {
                    engine.stop();
                    clearAudition();
                    rawEventsRef.current = [];
                    setRecordStatus(null);
                    setRecordingElapsed(0);
                  }}
                >
                  {copy.keyboard.clear}
                </button>
              </div>
              <div className={`record-status${recordStatus ? " is-error" : ""}`}>
                {recordStatus ?? copy.keyboard.privacy}
              </div>
            </div>
          </section>
        ) : null}

        {phase === "results" && capturedMelody ? (
          <section className="center-stage" style={{ gridColumn: "1 / -1" }}>
            <div className="results-stage">
              <div className="phase-heading">
                <p className="eyebrow">
                  {copy.results.automaticRemapping} · 12-TET
                </p>
                <h1 data-phase-heading="results" tabIndex={-1}>
                  {copy.results.title}
                </h1>
              </div>
              <div className="results-layout">
                <div className="results-circle">
                  <ScaleCircle
                    scale={scale}
                    activeMidi={activeMidi}
                    onAudition={audition}
                    compact
                    locale={locale}
                  />
                </div>
                <div className="result-info">
                  <span className="result-count">
                    0{activeIndex + 1} / 0{SCALES.length} · {copy.results.automaticRemapping}
                  </span>
                  <h2>{destination.scaleName[locale]}</h2>
                  <p>{copy.results.experimentDisclaimer}</p>
                  <div className="result-pills" aria-label={copy.results.title}>
                    {SCALES.map((item, index) => (
                      <button
                        type="button"
                        key={item.id}
                        className={index === activeIndex ? "is-active" : ""}
                        onClick={() => void playResult(index)}
                        aria-label={
                          DESTINATION_BY_SCALE_ID.get(item.id)?.scaleName[locale] ??
                          item.name[locale]
                        }
                        aria-pressed={index === activeIndex}
                      >
                        0{index + 1}
                      </button>
                    ))}
                  </div>
                  <div className="segmented">
                    <button
                      type="button"
                      className="segment-button is-active"
                      aria-pressed="true"
                    >
                      {copy.results.neutralTimbre}
                    </button>
                    <button
                      type="button"
                      className="segment-button"
                      disabled
                    >
                      {copy.results.regionalTimbre} · {locale === "zh" ? "待制作" : "Coming later"}
                    </button>
                  </div>
                  <p className="timbre-note">{copy.notices.regionalTimbre}</p>
                  <div className="button-row" style={{ marginTop: 16 }}>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={replayAllResults}
                    >
                      {copy.transport.replayAll}
                    </button>
                    <button className="secondary-button" type="button" onClick={playOriginal}>
                      {copy.results.original}
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => {
                        resultQueueTokenRef.current += 1;
                        engine.stop();
                        clearAudition();
                        setPhase("keyboard");
                        setTransportMidi(null);
                        setAuditionMidi(null);
                      }}
                    >
                      {copy.results.returnToKeyboard}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {(phase === "tour" || phase === "results") && (
        <footer
          className="transport"
          aria-label={locale === "zh" ? "音频播放控制" : "Audio transport"}
        >
          <div className="now-playing">
            <span className="album-dot" aria-hidden="true">♪</span>
            <span className="now-playing-text">
              <span>
                {isPlaying
                  ? locale === "zh"
                    ? "正在播放"
                    : "Now playing"
                  : isPaused
                    ? locale === "zh"
                      ? "已暂停"
                      : "Paused"
                    : locale === "zh"
                      ? "准备就绪"
                      : "Ready"}
              </span>
              <strong>{nowPlayingTitle}</strong>
            </span>
          </div>
          <div className="transport-row">
            <button
              className="transport-button"
              type="button"
              onClick={previous}
              aria-label={copy.transport.previous}
              disabled={activeIndex === 0}
            >
              ←
            </button>
            <button
              className="transport-button is-primary"
              type="button"
              onClick={() => void togglePlayback()}
              aria-label={isPlaying ? copy.transport.pause : isPaused ? copy.transport.resume : copy.transport.play}
            >
              {playIcon(isPlaying)}
            </button>
            <button
              className="transport-button"
              type="button"
              onClick={next}
              aria-label={copy.transport.next}
            >
              →
            </button>
          </div>
          <div className="timecode">
            {formatTime(clockSeconds)} / {formatTime(audioSnapshot.durationSeconds)}
          </div>
        </footer>
      )}

      {audioSnapshot.pauseReason === "visibility" ? (
        <div className="tutorial-card" role="alert">
          <p>{copy.transport.resumeAfterBackground}</p>
          <button className="primary-button" type="button" onClick={() => void togglePlayback()}>
            {copy.transport.resume}
          </button>
        </div>
      ) : null}

      {tutorialInterrupted && phase === "tutorial" ? (
        <div className="tutorial-card" role="alert">
          <p>{copy.transport.resumeAfterBackground}</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              void engine
                .init()
                .then(() => {
                  setTutorialStep(0);
                  setTutorialInterrupted(false);
                })
                .catch(handleAudioFailure);
            }}
          >
            {copy.transport.resume}
          </button>
        </div>
      ) : null}

      {aboutOpen ? (
        <dialog
          ref={aboutDialogRef}
          className="about-drawer"
          aria-label={copy.settings.about}
          onCancel={(event) => {
            event.preventDefault();
            closeAbout();
          }}
          onClose={() => {
            setAboutOpen(false);
            window.requestAnimationFrame(() => aboutButtonRef.current?.focus());
          }}
        >
          <button
            className="icon-button close"
            type="button"
            onClick={closeAbout}
            aria-label={copy.theory.close}
          >
            ×
          </button>
          <p className="eyebrow">
            {locale === "zh" ? "方法与来源" : "Method / sources"}
          </p>
          <h2>{copy.settings.about}</h2>
          <p>{copy.notices.equalTemperament}</p>
          <details open>
            <summary>{destination.scaleName[locale]}</summary>
            <p>{destination.theory.summary[locale]}</p>
            <p>{destination.theory.detail[locale]}</p>
          </details>
          <details>
            <summary>{copy.theory.approximation}</summary>
            <p>{destination.disclaimer[locale]}</p>
          </details>
          <details>
            <summary>{copy.theory.sources}</summary>
            <p>{copy.notices.placeholderAudio}</p>
            <p>{copy.notices.culturalScope}</p>
          </details>
          <p>{copy.notices.noUpload}</p>
        </dialog>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {activeMidi === null
          ? copy.accessibility.noActiveNote
          : formatCopy(copy.accessibility.currentNote, {
              note: midiNoteName(activeMidi),
            })}
      </div>
    </div>
  );
}
