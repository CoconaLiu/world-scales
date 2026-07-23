"use client";

type CircleScale = {
  id: string;
  tonicMidi: number;
  semitones: readonly number[];
  name: { en: string; zh: string; local?: string };
};

type ScaleCircleProps = {
  scale: CircleScale;
  activeMidi: number | null;
  noteNames?: readonly string[];
  onAudition: (midi: number) => void;
  compact?: boolean;
  locale?: "zh" | "en";
  showReferenceTicks?: boolean;
};

const DEFAULT_NOTE_NAMES = [
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
];

function pointAt(semitone: number, radius: number) {
  const radians = ((semitone * 30 - 90) * Math.PI) / 180;
  return {
    x: 50 + Math.cos(radians) * radius,
    y: 50 + Math.sin(radians) * radius,
  };
}

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export function ScaleCircle({
  scale,
  activeMidi,
  noteNames = DEFAULT_NOTE_NAMES,
  onAudition,
  compact = false,
  locale = "zh",
  showReferenceTicks = true,
}: ScaleCircleProps) {
  const activePitchClass =
    activeMidi === null
      ? null
      : positiveModulo(activeMidi - scale.tonicMidi, 12);
  const polygon = scale.semitones
    .map((semitone) => {
      const point = pointAt(semitone, 31);
      return `${point.x},${point.y}`;
    })
    .join(" ");

  return (
    <div
      className="circle-wrap"
      aria-label={
        locale === "zh"
          ? `${scale.name.zh} 音阶圆环`
          : `${scale.name.en} scale circle`
      }
    >
      <svg
        className="scale-circle"
        viewBox="0 0 100 100"
        role="img"
        aria-labelledby={`circle-title-${scale.id} circle-desc-${scale.id}`}
      >
        <title id={`circle-title-${scale.id}`}>
          {locale === "zh" ? scale.name.zh : scale.name.en}
        </title>
        <desc id={`circle-desc-${scale.id}`}>
          {locale === "zh"
            ? `十二个刻度代表一个八度，当前音阶选择了 ${scale.semitones.length} 个音。`
            : `Twelve ticks represent one octave. This scale selects ${scale.semitones.length} notes.`}
        </desc>
        <circle className="circle-ring" cx="50" cy="50" r="39" />
        <circle className="circle-inner" cx="50" cy="50" r="31" />

        {showReferenceTicks ? Array.from({ length: 12 }, (_, semitone) => {
          const inner = pointAt(semitone, 35.4);
          const outer = pointAt(semitone, 39);
          const isScale = scale.semitones.includes(semitone);
          return (
            <line
              key={semitone}
              className={`tick-line${isScale ? " is-scale" : ""}`}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
            />
          );
        }) : null}

        {scale.semitones.length > 1 ? (
          <polygon className="scale-polygon" points={polygon} />
        ) : null}

        {scale.semitones.map((semitone, index) => {
          const point = pointAt(semitone, 31);
          const labelPoint = pointAt(semitone, 44.5);
          const midi = scale.tonicMidi + semitone;
          const note = noteNames[positiveModulo(midi, 12)] ?? `${midi}`;
          const isActive = activePitchClass === semitone;
          const isTonic = index === 0;

          return (
            <g
              className={`node-hit${isActive ? " is-active" : ""}${isTonic ? " is-tonic" : ""}`}
              key={semitone}
              role="button"
              tabIndex={0}
              aria-label={
                locale === "zh"
                  ? `${note}${isTonic ? "，主音" : ""}，试听`
                  : `Audition ${note}${isTonic ? ", tonic" : ""}`
              }
              aria-pressed={isActive}
              onClick={() => onAudition(midi)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onAudition(midi);
                }
              }}
            >
              <circle className="node-halo" cx={point.x} cy={point.y} r="7.2" />
              {isTonic ? (
                <rect
                  className="node-core"
                  x={point.x - 3.2}
                  y={point.y - 3.2}
                  width="6.4"
                  height="6.4"
                  rx="1"
                  transform={`rotate(45 ${point.x} ${point.y})`}
                />
              ) : (
                <circle className="node-core" cx={point.x} cy={point.y} r="3.1" />
              )}
              <text className="note-label" x={labelPoint.x} y={labelPoint.y}>
                {note}
              </text>
            </g>
          );
        })}

        {!compact ? (
          <>
            <text className="circle-center-meta" x="50" y="46">
              {scale.semitones.length} NOTES · 1 OCTAVE
            </text>
            <text className="circle-center-label" x="50" y="53">
              {scale.name.local ?? scale.name.en}
            </text>
          </>
        ) : null}
      </svg>
    </div>
  );
}
