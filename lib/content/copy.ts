import type { Locale, LocalizedText, ProductCopy } from "./types";
import { SUPPORTED_LOCALES } from "./types";

export const COPY_BY_LOCALE = {
  zh: {
    brand: {
      productName: "World Scales",
      localizedTitle: "世界音阶地图",
      corePromise: "同一段旋律，换一种音阶，就会进入另一个听觉世界。",
    },
    landing: {
      description: "同一段旋律，换一种音阶，会发生什么？",
      primaryCta: "开始聆听",
      soundRecommended: "建议开启声音",
    },
    tutorial: {
      title: "一个圆，就是一个八度",
      skip: "跳过介绍",
      octaveMessage: "频率翻倍，音名回到相同位置。",
      scaleMessage: "音阶，就是从一个八度中选择一组音。",
      twelveTicksLabel: "十二平均律中的 12 个音高位置",
    },
    tour: {
      title: "环游五种音阶",
      progressLabel: "第 {current} 站，共 {total} 站",
      localMode: "原创音阶练习",
      comparisonMode: "同曲比较",
      localModeDescription: "先听一段原创合成音阶练习；它不是页面中候选曲目的编曲。",
      comparisonModeDescription: "再用相同节奏与轮廓，比较《欢乐颂》在不同音阶中的变化。",
      complete: "完成世界之旅",
    },
    transport: {
      play: "播放",
      pause: "暂停",
      resume: "继续",
      previous: "上一站",
      next: "下一站",
      replay: "重新播放",
      replayAll: "全部重播",
      loading: "正在准备声音…",
      soundOn: "开启声音",
      mute: "静音",
      unsupportedAudio: "声音暂时无法启动。请确认设备未静音，或点击重新尝试。",
      resumeAfterBackground: "播放已暂停。准备好后继续聆听。",
    },
    keyboard: {
      title: "你的旋律",
      prompt: "现在，弹奏属于你的旋律。",
      instructions: "用屏幕琴键、鼠标、触摸或电脑键盘录制一段单声部旋律。",
      startRecording: "开始录制",
      stopRecording: "停止录制",
      clear: "清空重录",
      replayOriginal: "回放原始旋律",
      remainingTime: "剩余 {seconds} 秒",
      minimumNoteRetry: "再试一次吧：至少弹奏 3 个音，我们才能比较五种音阶。",
      automaticStop: "录制会在 15 秒后自动停止。",
      privacy: "旋律只保存在当前浏览器内存中，不会上传。",
    },
    results: {
      title: "一段旋律，五种音阶",
      original: "原始旋律",
      automaticRemapping: "自动映射",
      neutralTimbre: "中性音色",
      regionalTimbre: "地域灵感音色",
      returnToKeyboard: "返回琴键",
      experimentDisclaimer: "这些结果是十二平均律中的音阶映射实验，不是对任何地区音乐的真实编曲。",
    },
    theory: {
      open: "查看音阶说明",
      close: "关闭音阶说明",
      intervalPattern: "音程结构",
      noteCount: "每个八度 {count} 个音",
      methodology: "方法",
      sources: "来源与版权",
      approximation: "近似说明",
    },
    settings: {
      language: "语言",
      sound: "声音",
      motion: "动态效果",
      standardMotion: "标准动态",
      reducedMotion: "减少动态",
      about: "关于与方法",
    },
    notices: {
      equalTemperament: "为了便于比较和琴键互动，MVP 中所有音阶均以十二平均律呈现。",
      culturalScope: "地点、颜色与抽象纹理是导航设计，不代表一个地区只有一种音阶或审美。",
      regionalTimbre: "地域灵感音色是编曲选择，并非音阶本身固有的声音。",
      placeholderAudio: "本地模式播放原创合成音阶练习，不代表候选曲目；正式曲目、编曲与权利仍待审核。",
      noUpload: "本体验不申请麦克风权限，也不会上传你的演奏数据。",
    },
    accessibility: {
      destinationNavigation: "音阶地点导航",
      scaleCircle: "一八度音阶圆环",
      currentNote: "当前音符：{note}",
      noActiveNote: "当前没有正在播放的音符",
      auditionDegree: "试听音阶音 {degree}：{note}",
    },
  },
  en: {
    brand: {
      productName: "World Scales",
      localizedTitle: "World Scale Atlas",
      corePromise: "Change the scale, and the same melody enters another listening world.",
    },
    landing: {
      description: "What happens when the same melody changes scale?",
      primaryCta: "Start listening",
      soundRecommended: "Sound recommended",
    },
    tutorial: {
      title: "One circle is one octave",
      skip: "Skip introduction",
      octaveMessage: "Double the frequency and the note name returns to the same position.",
      scaleMessage: "A scale selects a set of notes from within one octave.",
      twelveTicksLabel: "The 12 pitch positions of equal temperament",
    },
    tour: {
      title: "Travel through five scales",
      progressLabel: "Stop {current} of {total}",
      localMode: "Original scale study",
      comparisonMode: "Compare the same melody",
      localModeDescription: "First, hear an original synthesized scale study—not an arrangement of the candidate repertoire.",
      comparisonModeDescription: "Then compare how Ode to Joy changes while its rhythm and broad contour stay familiar.",
      complete: "Complete the world tour",
    },
    transport: {
      play: "Play",
      pause: "Pause",
      resume: "Resume",
      previous: "Previous stop",
      next: "Next stop",
      replay: "Replay",
      replayAll: "Replay all",
      loading: "Preparing sound…",
      soundOn: "Turn sound on",
      mute: "Mute",
      unsupportedAudio: "Sound could not start. Check that your device is not muted, or try again.",
      resumeAfterBackground: "Playback is paused. Resume when you are ready to listen.",
    },
    keyboard: {
      title: "Your melody",
      prompt: "Now, play a melody of your own.",
      instructions: "Use the on-screen keys, mouse, touch, or computer keyboard to record one note at a time.",
      startRecording: "Start recording",
      stopRecording: "Stop recording",
      clear: "Clear and retry",
      replayOriginal: "Replay original",
      remainingTime: "{seconds} seconds remaining",
      minimumNoteRetry: "Try once more: play at least 3 notes so we can compare all five scales.",
      automaticStop: "Recording stops automatically after 15 seconds.",
      privacy: "Your melody stays in this browser's memory and is never uploaded.",
    },
    results: {
      title: "One melody, five scales",
      original: "Original melody",
      automaticRemapping: "Automatic remapping",
      neutralTimbre: "Neutral timbre",
      regionalTimbre: "Region-inspired timbre",
      returnToKeyboard: "Return to keyboard",
      experimentDisclaimer: "These results are 12-tone equal-temperament scale-remapping experiments, not authentic regional arrangements.",
    },
    theory: {
      open: "Open scale notes",
      close: "Close scale notes",
      intervalPattern: "Interval pattern",
      noteCount: "{count} notes per octave",
      methodology: "Method",
      sources: "Sources and rights",
      approximation: "Approximation note",
    },
    settings: {
      language: "Language",
      sound: "Sound",
      motion: "Motion",
      standardMotion: "Standard motion",
      reducedMotion: "Reduced motion",
      about: "About and method",
    },
    notices: {
      equalTemperament: "For comparison and keyboard interaction, every MVP scale is presented in 12-tone equal temperament.",
      culturalScope: "Locations, colors, and abstract textures are navigation choices; they do not suggest that a region has only one scale or aesthetic.",
      regionalTimbre: "Region-inspired timbres are arrangement choices, not an inherent sound of the scale.",
      placeholderAudio: "Local mode uses original synthesized scale studies, not the candidate songs; final repertoire, arrangements, and rights remain under review.",
      noUpload: "This experience does not request microphone access or upload your performance data.",
    },
    accessibility: {
      destinationNavigation: "Scale destination navigation",
      scaleCircle: "One-octave scale circle",
      currentNote: "Current note: {note}",
      noActiveNote: "No note is currently playing",
      auditionDegree: "Audition scale degree {degree}: {note}",
    },
  },
} as const satisfies Readonly<Record<Locale, ProductCopy>>;

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Chinese is the product default; any explicit English locale resolves to English. */
export function normalizeLocale(value?: string | null): Locale {
  if (!value) return "zh";

  const language = value.trim().toLowerCase();
  if (language === "en" || language.startsWith("en-")) return "en";
  return "zh";
}

export function getProductCopy(locale: Locale): ProductCopy {
  return COPY_BY_LOCALE[locale];
}

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

export function formatCopy(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
