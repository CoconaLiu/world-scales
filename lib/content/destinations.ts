import type {
  DestinationContent,
  DestinationId,
  Locale,
  ScaleId,
} from "./types";

export const DESTINATIONS = [
  {
    id: "egypt",
    scaleId: "hijaz",
    order: 1,
    name: { en: "Egypt", zh: "埃及", local: "مصر" },
    scaleName: { en: "Maqam Hijaz", zh: "希贾兹调式", local: "مقام حجاز" },
    mapAnchor: {
      xPercent: 58.7,
      yPercent: 33.3,
      longitude: 31.2,
      latitude: 30,
    },
    theme: {
      background: "#160E0A",
      surface: "#2A1710",
      primary: "#D6A24C",
      secondary: "#B9583C",
      highlight: "#F4D58A",
      ink: "#FFF5DF",
      abstractMaterials: {
        zh: ["等高线", "星点网格", "颗粒光"],
        en: ["contour lines", "star grid", "granular light"],
      },
    },
    scale: {
      tonicMidi: 60,
      semitones: [0, 1, 4, 5, 7, 8, 10],
      degreeLabels: {
        zh: ["根音", "降二级", "大三度", "纯四度", "纯五度", "降六级", "降七级"],
        en: ["root", "minor 2nd", "major 3rd", "perfect 4th", "perfect 5th", "minor 6th", "minor 7th"],
      },
      reviewStatus: "provisional",
    },
    shortGuide: {
      zh: "留意根音上方紧邻的音，以及随后展开的宽音程。",
      en: "Listen for the close step above the root followed by a wide opening interval.",
    },
    theory: {
      summary: {
        zh: "这个七声音阶模型以半音与增二度的鲜明并置塑造轮廓。",
        en: "This seven-note model gets its distinctive contour from adjacent semitone and augmented-second motion.",
      },
      detail: {
        zh: "圆环只显示相对根音的十二平均律音级。真实 maqam 还涉及旋律进行、音高细节与表演传统，不能由一个固定多边形完整概括。",
        en: "The circle shows only 12-TET degrees relative to the root. A real maqam also involves melodic development, tuning nuance, and performance practice that a fixed polygon cannot fully represent.",
      },
    },
    disclaimer: {
      zh: "当前播放的是原创希贾兹音阶练习，不是《El Helwa Di》；后者的曲谱版本、编曲与权利仍待审核。",
      en: "The current audio is an original Hijaz scale study, not El Helwa Di; that song's score version, arrangement, and rights remain under review.",
    },
    tracks: {
      local: {
        assetId: "local-hijaz-scale-study",
        title: {
          en: "Hijaz scale study (placeholder)",
          zh: "原创希贾兹音阶练习（占位）",
          local: "Hijaz scale study",
        },
        modeLabel: { en: "Scale study", zh: "音阶练习" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
      comparison: {
        assetId: "comparison-hijaz-ode-to-joy",
        title: { en: "Ode to Joy · Hijaz", zh: "《欢乐颂》· 希贾兹", local: "Ode to Joy · Hijaz" },
        modeLabel: { en: "Compare the same melody", zh: "同曲比较" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
    },
  },
  {
    id: "north-atlantic",
    scaleId: "dorian",
    order: 2,
    name: { en: "North Atlantic", zh: "北大西洋", local: "North Atlantic" },
    scaleName: { en: "Dorian", zh: "多利亚调式", local: "Dorian" },
    mapAnchor: {
      xPercent: 43.1,
      yPercent: 19.4,
      longitude: -25,
      latitude: 55,
    },
    theme: {
      background: "#071517",
      surface: "#10272A",
      primary: "#3BAA84",
      secondary: "#397C92",
      highlight: "#9ADBC4",
      ink: "#E9FAF7",
      abstractMaterials: {
        zh: ["海岸线", "风线", "薄雾"],
        en: ["coastlines", "wind lines", "fog"],
      },
    },
    scale: {
      tonicMidi: 60,
      semitones: [0, 2, 3, 5, 7, 9, 10],
      degreeLabels: {
        zh: ["根音", "大二度", "小三度", "纯四度", "纯五度", "大六度", "小七度"],
        en: ["root", "major 2nd", "minor 3rd", "perfect 4th", "perfect 5th", "major 6th", "minor 7th"],
      },
      reviewStatus: "provisional",
    },
    shortGuide: {
      zh: "听一听小三度的阴影，如何被明亮的大六度提起。",
      en: "Hear how the minor third's shade is lifted by a bright major sixth.",
    },
    theory: {
      summary: {
        zh: "多利亚是带小三度与小七度的七声音阶，同时保留大六度。",
        en: "Dorian is a seven-note scale with a minor third and seventh, but a major sixth.",
      },
      detail: {
        zh: "与自然小调相比，第六级升高一个半音。比较旋律会保持节奏和大致走向，让这个音级变化更容易被听见。",
        en: "Compared with natural minor, its sixth degree is one semitone higher. The comparison keeps rhythm and broad contour stable so that change is easier to hear.",
      },
    },
    disclaimer: {
      zh: "“北大西洋”是本体验的宽泛地图分区；当前播放原创多利亚音阶练习，不是《醉酒的水手》。候选曲目的版本与权利仍待审核。",
      en: "North Atlantic is a broad map label. The current audio is an original Dorian scale study, not Drunken Sailor; the candidate repertoire version and rights remain under review.",
    },
    tracks: {
      local: {
        assetId: "local-dorian-scale-study",
        title: {
          en: "Dorian scale study (placeholder)",
          zh: "原创多利亚音阶练习（占位）",
          local: "Dorian scale study",
        },
        modeLabel: { en: "Scale study", zh: "音阶练习" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
      comparison: {
        assetId: "comparison-dorian-ode-to-joy",
        title: { en: "Ode to Joy · Dorian", zh: "《欢乐颂》· 多利亚", local: "Ode to Joy · Dorian" },
        modeLabel: { en: "Compare the same melody", zh: "同曲比较" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
    },
  },
  {
    id: "china",
    scaleId: "gong",
    order: 3,
    name: { en: "China", zh: "中国", local: "中国" },
    scaleName: { en: "Gong mode", zh: "宫调式", local: "宫调式" },
    mapAnchor: {
      xPercent: 78.9,
      yPercent: 30.6,
      longitude: 104,
      latitude: 35,
    },
    theme: {
      background: "#100F0B",
      surface: "#211D15",
      primary: "#C74435",
      secondary: "#315D52",
      highlight: "#C9A85C",
      ink: "#FFF7E8",
      abstractMaterials: {
        zh: ["山形等高线", "流动路径", "纸张颗粒"],
        en: ["mountain contours", "flowing routes", "paper grain"],
      },
    },
    scale: {
      tonicMidi: 60,
      semitones: [0, 2, 4, 7, 9],
      degreeLabels: {
        zh: ["宫", "商", "角", "徵", "羽"],
        en: ["gong", "shang", "jue", "zhi", "yu"],
      },
      reviewStatus: "provisional",
    },
    shortGuide: {
      zh: "五个音在圆环上留下更大的空隙，旋律仍能保持清楚的方向。",
      en: "Five notes leave wider gaps around the circle while the melody keeps a clear direction.",
    },
    theory: {
      summary: {
        zh: "原型以宫音为根音，使用宫、商、角、徵、羽五个音级。",
        en: "The prototype takes gong as the root and uses the five degrees gong, shang, jue, zhi, and yu.",
      },
      detail: {
        zh: "这里采用 C–D–E–G–A 的十二平均律归一化表示。调式判断仍取决于旋律重心、终止位置和具体版本，不能只看五个音的集合。",
        en: "Here it is normalized in 12-TET as C–D–E–G–A. Modal identity also depends on melodic center, cadences, and the specific version—not only the five-note collection.",
      },
    },
    disclaimer: {
      zh: "当前播放的是原创宫调式音阶练习，不是《茉莉花》；候选曲目的地区版本、调式分析、编曲与权利均待确认。",
      en: "The current audio is an original Gong-mode scale study, not Molihua; the candidate song's regional version, modal analysis, arrangement, and rights all require confirmation.",
    },
    tracks: {
      local: {
        assetId: "local-gong-scale-study",
        title: {
          en: "Gong-mode scale study (placeholder)",
          zh: "原创宫调式音阶练习（占位）",
          local: "原创宫调式音阶练习",
        },
        modeLabel: { en: "Scale study", zh: "音阶练习" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
      comparison: {
        assetId: "comparison-gong-ode-to-joy",
        title: { en: "Ode to Joy · Gong", zh: "《欢乐颂》· 宫调式", local: "欢乐颂 · 宫调式" },
        modeLabel: { en: "Compare the same melody", zh: "同曲比较" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
    },
  },
  {
    id: "japan",
    scaleId: "miyakobushi",
    order: 4,
    name: { en: "Japan", zh: "日本", local: "日本" },
    scaleName: { en: "Miyako-bushi", zh: "都节音阶", local: "都節音階" },
    mapAnchor: {
      xPercent: 88.3,
      yPercent: 30,
      longitude: 138,
      latitude: 36,
    },
    theme: {
      background: "#0D0A18",
      surface: "#1B1630",
      primary: "#C13B88",
      secondary: "#3E3B8F",
      highlight: "#F09BC7",
      ink: "#FFF2FA",
      abstractMaterials: {
        zh: ["岛屿轮廓", "雨线", "夜间微光"],
        en: ["island outlines", "rain lines", "night glow"],
      },
    },
    scale: {
      tonicMidi: 60,
      semitones: [0, 1, 5, 7, 8],
      degreeLabels: {
        zh: ["根音", "小二度", "纯四度", "纯五度", "小六度"],
        en: ["root", "minor 2nd", "perfect 4th", "perfect 5th", "minor 6th"],
      },
      reviewStatus: "provisional",
    },
    shortGuide: {
      zh: "注意半音的紧张感，和它两侧宽阔留白形成的对比。",
      en: "Notice the tension of semitone motion against the wide spaces around it.",
    },
    theory: {
      summary: {
        zh: "这个五声音阶原型包含两个相邻半音关系与明显的音程留白。",
        en: "This five-note prototype combines two semitone relationships with conspicuous intervallic space.",
      },
      detail: {
        zh: "圆环使用相对根音的 0、1、5、7、8 半音位置。名称、旋律功能与具体《樱花》版本仍需结合可靠来源复核。",
        en: "The circle uses positions 0, 1, 5, 7, and 8 semitones from the root. Naming, melodic function, and the selected Sakura version still require review against reliable sources.",
      },
    },
    disclaimer: {
      zh: "当前播放的是原创都节音阶练习，不是《樱花》；本体验也不代表所有日本音阶或表演传统。候选曲目的编曲与权利仍待审核。",
      en: "The current audio is an original Miyako-bushi scale study, not Sakura Sakura, and does not represent every Japanese scale or performance tradition. The candidate arrangement and rights remain under review.",
    },
    tracks: {
      local: {
        assetId: "local-miyako-bushi-scale-study",
        title: {
          en: "Miyako-bushi scale study (placeholder)",
          zh: "原创都节音阶练习（占位）",
          local: "都節音階の練習",
        },
        modeLabel: { en: "Scale study", zh: "音阶练习" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
      comparison: {
        assetId: "comparison-miyako-bushi-ode-to-joy",
        title: { en: "Ode to Joy · Miyako-bushi", zh: "《欢乐颂》· 都节音阶", local: "歓喜の歌 · 都節音階" },
        modeLabel: { en: "Compare the same melody", zh: "同曲比较" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
    },
  },
  {
    id: "sunda",
    scaleId: "degung",
    order: 5,
    name: { en: "Sunda", zh: "巽他地区", local: "Tatar Sunda" },
    scaleName: { en: "Degung approximation", zh: "Degung 近似音阶", local: "Laras Degung (aproksimasi)" },
    mapAnchor: {
      xPercent: 79.9,
      yPercent: 53.8,
      longitude: 107.6,
      latitude: -6.9,
    },
    theme: {
      background: "#061411",
      surface: "#102821",
      primary: "#83C94A",
      secondary: "#15877D",
      highlight: "#C4ED75",
      ink: "#F2FFE7",
      abstractMaterials: {
        zh: ["梯田线", "水系", "地形场"],
        en: ["terrace lines", "water systems", "topographic fields"],
      },
    },
    scale: {
      tonicMidi: 60,
      semitones: [0, 1, 3, 7, 8],
      degreeLabels: {
        zh: ["原型根音", "+1 半音", "+3 半音", "+7 半音", "+8 半音"],
        en: ["prototype root", "+1 semitone", "+3 semitones", "+7 semitones", "+8 semitones"],
      },
      reviewStatus: "provisional",
    },
    shortGuide: {
      zh: "先把它当作键盘上的近似轮廓来听，而不是一套真实乐团调律。",
      en: "Hear this first as an approximate keyboard contour—not as the tuning of a real ensemble.",
    },
    theory: {
      summary: {
        zh: "五个键盘音只提供可比较的十二平均律轮廓，不能重现 Degung 乐器的实际音高关系。",
        en: "Five keyboard pitches provide a comparable 12-TET contour but cannot reproduce the pitch relationships of Degung instruments.",
      },
      detail: {
        zh: "当前 0、1、3、7、8 半音集合完全是可替换的工程默认值。正式名称、音级、旋律与说明必须由巽他音乐顾问复核。",
        en: "The current 0, 1, 3, 7, 8 semitone set is a replaceable engineering default. A Sundanese music consultant must review the final naming, degrees, melody, and explanation.",
      },
    },
    disclaimer: {
      zh: "当前播放的是原创十二平均律近似音阶练习，不是真实 Degung 曲目或调律；曲目选择、音乐顾问复核与权利均尚未完成。",
      en: "The current audio is an original 12-TET approximation study, not authentic Degung repertoire or tuning; repertoire selection, specialist review, and rights remain pending.",
    },
    tracks: {
      local: {
        assetId: "local-degung-scale-study",
        title: {
          en: "Degung approximation study (placeholder)",
          zh: "原创 Degung 近似音阶练习（占位）",
          local: "Studi aproksimasi Degung",
        },
        modeLabel: { en: "Scale study", zh: "音阶练习" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
      comparison: {
        assetId: "comparison-degung-ode-to-joy",
        title: { en: "Ode to Joy · Degung approximation", zh: "《欢乐颂》· Degung 近似", local: "Ode to Joy · Aproksimasi Degung" },
        modeLabel: { en: "Compare the same melody", zh: "同曲比较" },
        status: "placeholder",
        defaultTimbre: "neutral",
      },
    },
  },
] as const satisfies readonly DestinationContent[];

export const DESTINATION_BY_ID = Object.fromEntries(
  DESTINATIONS.map((destination) => [destination.id, destination]),
) as Readonly<Record<DestinationId, (typeof DESTINATIONS)[number]>>;

export const DESTINATION_BY_SCALE_ID = Object.fromEntries(
  DESTINATIONS.map((destination) => [destination.scaleId, destination]),
) as Readonly<Record<ScaleId, (typeof DESTINATIONS)[number]>>;

export function getDestination(id: DestinationId): DestinationContent {
  return DESTINATION_BY_ID[id];
}

export function getDestinationByScaleId(scaleId: ScaleId): DestinationContent {
  return DESTINATION_BY_SCALE_ID[scaleId];
}

export function getDestinationLabel(
  destination: DestinationContent,
  locale: Locale,
): string {
  return destination.name[locale];
}

export function getScaleLabel(
  destination: DestinationContent,
  locale: Locale,
): string {
  return destination.scaleName[locale];
}
