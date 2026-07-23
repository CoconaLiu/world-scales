"use client";

import { useEffect, useMemo, useRef } from "react";

type PianoKeyboardProps = {
  activeMidi: number | null;
  disabled?: boolean;
  onNoteStart: (midi: number) => void;
  onNoteEnd: (midi: number) => void;
  locale?: "zh" | "en";
};

const KEYBOARD_KEYS = [
  "a",
  "w",
  "s",
  "e",
  "d",
  "f",
  "t",
  "g",
  "y",
  "h",
  "u",
  "j",
  "k",
  "o",
  "l",
  "p",
  ";",
  "'",
] as const;

const NOTE_NAMES = [
  "C",
  "C♯",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
] as const;

const WHITE_WIDTH = 58;
const LEFT_GUTTER = 61;

function noteName(midi: number) {
  const pitch = NOTE_NAMES[midi % 12] ?? "";
  const octave = Math.floor(midi / 12) - 1;
  return `${pitch}${octave}`;
}

function isBlack(midi: number) {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

export function PianoKeyboard({
  activeMidi,
  disabled = false,
  onNoteStart,
  onNoteEnd,
  locale = "zh",
}: PianoKeyboardProps) {
  const heldKeys = useRef(new Set<string>());
  const notes = useMemo(
    () => Array.from({ length: 18 }, (_, index) => 60 + index),
    [],
  );

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (disabled || event.repeat) return;
      const key = event.key.toLowerCase();
      const index = KEYBOARD_KEYS.indexOf(
        key as (typeof KEYBOARD_KEYS)[number],
      );
      if (index < 0 || heldKeys.current.has(key)) return;
      event.preventDefault();
      heldKeys.current.add(key);
      onNoteStart(60 + index);
    };

    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const index = KEYBOARD_KEYS.indexOf(
        key as (typeof KEYBOARD_KEYS)[number],
      );
      if (index < 0 || !heldKeys.current.has(key)) return;
      event.preventDefault();
      heldKeys.current.delete(key);
      onNoteEnd(60 + index);
    };

    const releaseAll = () => {
      for (const key of heldKeys.current) {
        const index = KEYBOARD_KEYS.indexOf(
          key as (typeof KEYBOARD_KEYS)[number],
        );
        if (index >= 0) onNoteEnd(60 + index);
      }
      heldKeys.current.clear();
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", releaseAll);
      releaseAll();
    };
  }, [disabled, onNoteEnd, onNoteStart]);

  let whiteIndex = 0;
  const positions = notes.map((midi, index) => {
    const black = isBlack(midi);
    const currentWhiteIndex = whiteIndex;
    if (!black) whiteIndex += 1;
    return {
      midi,
      keyLabel: KEYBOARD_KEYS[index]?.toUpperCase() ?? "",
      black,
      left: black
        ? LEFT_GUTTER + currentWhiteIndex * WHITE_WIDTH
        : LEFT_GUTTER + currentWhiteIndex * WHITE_WIDTH,
    };
  });

  return (
    <div className="piano-scroller">
      <div
        className="piano"
        role="group"
        aria-label={locale === "zh" ? "屏幕钢琴键盘" : "On-screen piano keyboard"}
      >
        {positions
          .filter((note) => !note.black)
          .map((note) => (
            <PianoKey
              key={note.midi}
              {...note}
              active={activeMidi === note.midi}
              disabled={disabled}
              onNoteStart={onNoteStart}
              onNoteEnd={onNoteEnd}
              locale={locale}
            />
          ))}
        {positions
          .filter((note) => note.black)
          .map((note) => (
            <PianoKey
              key={note.midi}
              {...note}
              active={activeMidi === note.midi}
              disabled={disabled}
              onNoteStart={onNoteStart}
              onNoteEnd={onNoteEnd}
              locale={locale}
            />
          ))}
      </div>
    </div>
  );
}

type PianoKeyProps = {
  midi: number;
  keyLabel: string;
  black: boolean;
  left: number;
  active: boolean;
  disabled: boolean;
  onNoteStart: (midi: number) => void;
  onNoteEnd: (midi: number) => void;
  locale: "zh" | "en";
};

function PianoKey({
  midi,
  keyLabel,
  black,
  left,
  active,
  disabled,
  onNoteStart,
  onNoteEnd,
  locale,
}: PianoKeyProps) {
  return (
    <button
      type="button"
      className={`piano-key ${black ? "black" : "white"}${active ? " is-active" : ""}`}
      style={{ left }}
      disabled={disabled}
      aria-label={
        locale === "zh"
          ? `${noteName(midi)}，电脑键 ${keyLabel}`
          : `${noteName(midi)}, computer key ${keyLabel}`
      }
      aria-pressed={active}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onNoteStart(midi);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onNoteEnd(midi);
      }}
      onPointerCancel={() => onNoteEnd(midi)}
      onPointerLeave={(event) => {
        if (event.buttons > 0) onNoteEnd(midi);
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          onNoteStart(midi);
        }
      }}
      onKeyUp={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNoteEnd(midi);
        }
      }}
      onBlur={() => onNoteEnd(midi)}
    >
      <span>{keyLabel}</span>
    </button>
  );
}
