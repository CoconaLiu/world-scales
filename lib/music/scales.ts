import type { ScaleDefinition, ScaleId } from "./types";

/** Normalize any integer pitch or interval into the pitch-class range 0...11. */
export function modulo12(value: number): number {
  return ((value % 12) + 12) % 12;
}

/** Convert a relative semitone into the clockwise circle angle used by the UI. */
export function scaleAngleDegrees(semitonesFromRoot: number): number {
  return (modulo12(semitonesFromRoot) / 12) * 360 - 90;
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * These are the replaceable 12-TET implementation defaults from the PRD.
 * They intentionally remain provisional until the content/musicology review.
 */
export const SCALES = [
  {
    id: "hijaz",
    name: { en: "Maqam Hijaz", zh: "希贾兹调式", local: "مقام حجاز" },
    destination: { en: "Egypt", zh: "埃及" },
    tonicMidi: 60,
    semitones: [0, 1, 4, 5, 7, 8, 10],
    degreeLabels: {
      en: ["1", "♭2", "3", "4", "5", "♭6", "♭7"],
      zh: ["主音", "降二级", "三级", "四级", "五级", "降六级", "降七级"],
    },
    color: "#D99545",
    status: "provisional",
  },
  {
    id: "dorian",
    name: { en: "Dorian", zh: "多利亚调式" },
    destination: { en: "North Atlantic", zh: "北大西洋" },
    tonicMidi: 60,
    semitones: [0, 2, 3, 5, 7, 9, 10],
    degreeLabels: {
      en: ["1", "2", "♭3", "4", "5", "6", "♭7"],
      zh: ["主音", "二级", "降三级", "四级", "五级", "六级", "降七级"],
    },
    color: "#3BA58B",
    status: "provisional",
  },
  {
    id: "gong",
    name: { en: "Gong Diao", zh: "宫调式", local: "宫调式" },
    destination: { en: "China", zh: "中国" },
    tonicMidi: 60,
    semitones: [0, 2, 4, 7, 9],
    degreeLabels: {
      en: ["Gong · 1", "Shang · 2", "Jue · 3", "Zhi · 5", "Yu · 6"],
      zh: ["宫 · 1", "商 · 2", "角 · 3", "徵 · 5", "羽 · 6"],
    },
    color: "#D54B3D",
    status: "provisional",
  },
  {
    id: "miyakobushi",
    name: {
      en: "Miyako-bushi",
      zh: "都节音阶",
      local: "都節音階",
    },
    destination: { en: "Japan", zh: "日本" },
    tonicMidi: 60,
    semitones: [0, 1, 5, 7, 8],
    degreeLabels: {
      en: ["1", "♭2", "4", "5", "♭6"],
      zh: ["主音", "降二级", "四级", "五级", "降六级"],
    },
    color: "#C554A5",
    status: "provisional",
  },
  {
    id: "degung",
    name: {
      en: "Degung (12-TET approximation)",
      zh: "德贡音阶（十二平均律近似）",
      local: "Laras degung",
    },
    destination: { en: "Sunda", zh: "巽他地区" },
    tonicMidi: 60,
    semitones: [0, 1, 3, 7, 8],
    degreeLabels: {
      en: ["1", "♭2", "♭3", "5", "♭6"],
      zh: ["主音", "降二级", "降三级", "五级", "降六级"],
    },
    color: "#65B96E",
    status: "provisional",
    disclaimer: {
      en: "For piano-keyboard interaction, this experience uses a 12-tone equal-tempered approximation. Real Degung tuning varies by ensemble and instrument.",
      zh: "为便于钢琴键盘互动，本体验使用十二平均律近似版本；真实 Degung 调律会因乐团与乐器而变化。",
      local: "Talaan ieu ngan ukur perkiraan dina sistem 12 nada sarua rata.",
    },
  },
] as const satisfies readonly ScaleDefinition[];

/** Lower-case alias kept intentionally simple for UI/data consumers. */
export const scales: readonly ScaleDefinition[] = SCALES;

export const SCALES_BY_ID: Readonly<Record<ScaleId, ScaleDefinition>> = {
  hijaz: SCALES[0],
  dorian: SCALES[1],
  gong: SCALES[2],
  miyakobushi: SCALES[3],
  degung: SCALES[4],
};

export function getScale(scaleId: ScaleId): ScaleDefinition {
  return SCALES_BY_ID[scaleId];
}
