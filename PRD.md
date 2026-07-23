# World Scales — Product Requirements Document

**Version:** 1.0  
**Status:** Ready for engineering handoff  
**Date:** 2026-07-22  
**Primary language:** Chinese, with English UI copy support  
**Product type:** Responsive interactive music-learning website

---

## 1. Product summary

World Scales is an interactive music-learning experience that shows how changing a scale changes the character of a melody.

The user travels through five locations on a stylized world map. At each destination they:

1. hear a familiar local melody that naturally demonstrates the selected scale;
2. see the scale as notes arranged around a one-octave circular visualization;
3. hear the same globally familiar comparison melody remapped into that scale;
4. after the guided tour, play and record a short monophonic melody on an on-screen keyboard and hear it remapped into all five scales.

### Core promise

> 同一段旋律，换一种音阶，就会进入另一个听觉世界。

### Primary product goal

After completing the experience, a non-musician should understand that:

- one circle represents one octave;
- a scale selects a subset of pitches inside that octave;
- changing that subset changes the perceived character of a melody even when rhythm and melodic contour remain similar.

### Primary success criterion

In a lightweight comprehension check, the user can correctly explain or identify the relationship between the circle, an octave, and the highlighted scale notes.

---

## 2. Confirmed product decisions

| Area | Decision |
|---|---|
| Primary positioning | Accessible music-education experience |
| Desired reaction | “原来同一首歌换音阶会差这么多。” |
| Guided demo conversion | Five manually curated arrangements, not raw automatic quantization |
| Repertoire | Familiar local melodies plus familiar common comparison melodies |
| User-created melody | Short monophonic keyboard recording, automatically converted |
| Timbre | Neutral timbre by default; optional regional timbre layer |
| Devices | Mobile and desktop have equal priority |
| Information depth | Simple by default; advanced theory expandable |
| Visual direction | Stylized world map / musical atlas |
| Cultural differentiation | Strong, but supported by careful labeling and source notes |
| Circle behavior | Interactive digital instrument |
| Tuning for MVP | Twelve-tone equal temperament approximations only |
| Accounts/sharing | Not included |
| Product success | User understands circle-to-pitch relationship |

---

## 3. Target users

### Primary

- Curious non-musicians and casual music learners.
- Students encountering scales and modes for the first time.
- Social-media users attracted by audiovisual comparisons.

### Secondary

- Musicians looking for a quick visual introduction to unfamiliar scales.
- Teachers using the experience as a classroom demonstration.

### Not the MVP target

- Professional composition, DAW, or musicological analysis workflows.
- Users expecting production-quality automatic arrangement of arbitrary songs.

---

## 4. MVP scope

### In scope

- Responsive single-page experience.
- Stylized world map with five destinations.
- Five scale datasets and circular visualizations.
- Five familiar local melody excerpts, approximately 15–25 seconds each.
- One globally familiar comparison melody, manually arranged into all five scales.
- Guided autoplay sequence initiated by an explicit user gesture.
- Neutral and regional timbre modes.
- Interactive on-screen piano keyboard.
- Up to 15 seconds of monophonic user melody recording.
- Automatic remapping of the recorded melody into all five scales.
- Basic rhythm cleanup for the user performance.
- Expandable theory and methodology panels.
- Chinese and English interface copy.
- Reduced-motion mode and keyboard accessibility.

### Out of scope

- User accounts, cloud storage, social sharing, or leaderboards.
- Audio/MIDI file upload.
- External MIDI keyboard support.
- Polyphonic/chord recording.
- AI-generated accompaniment.
- Full notation editor or piano roll.
- Microtonal playback.
- Arbitrary-song conversion.
- User-selectable complex quantization parameters.
- Reuse of the referenced Xiaohongshu video, its footage, or its game soundtrack.

---

## 5. Information architecture

The MVP is one routed experience with five major states rather than five conventional pages.

```text
Landing
  → 15-second “What is the circle?” tutorial
  → Guided World Tour
       → Local Song at each destination
       → Same Melody comparison at each destination
  → Your Melody keyboard experiment
  → Results carousel across five scales
  → Method / Sources
```

Persistent optional controls:

- Language: 中文 / EN
- Sound: mute / volume
- Motion: standard / reduced
- About / methodology

---

## 6. Core user journey

### 6.1 Landing

The landing view shows a dark, stylized world map and a collapsed octave circle.

Required content:

- Product title: `World Scales`
- Chinese title: `世界音阶地图`
- One-line description: `同一段旋律，换一种音阶，会发生什么？`
- Primary CTA: `开始聆听 / Start listening`
- Small note: `建议开启声音 / Sound recommended`

The website must not attempt audio autoplay before the CTA is pressed.

### 6.2 Octave tutorial

Target duration: no more than 15 seconds. Skippable.

Sequence:

1. Play two C notes one octave apart.
2. Animate both notes toward the same angular position on the circle.
3. Display: `频率翻倍，音名回到相同位置。`
4. Reveal the 12 equal-tempered pitch-class ticks.
5. Highlight a scale subset and connect its nodes into a polygon.
6. Display: `音阶，就是从一个八度中选择一组音。`

### 6.3 Guided World Tour

The tour visits five destinations in the following default order:

1. Egypt / Hijaz
2. North Atlantic / Dorian
3. China / Gong Diao
4. Japan / Miyako-bushi
5. Sunda / Degung approximation

At each destination:

1. Move or morph the map focus to the destination.
2. Transition the visual theme.
3. Reveal the scale polygon.
4. Play a familiar local melody excerpt in regional timbre mode.
5. Display the current note in sync with audio.
6. Switch to the common comparison melody in neutral timbre.
7. Advance automatically, with manual Previous / Next available.

Each destination must expose two labeled playback modes:

- `聆听本地旋律 / Hear it at home`
- `同曲比较 / Compare the same melody`

### 6.4 Your Melody

After the guided tour:

1. Show an on-screen piano keyboard.
2. Prompt: `现在，弹奏属于你的旋律。`
3. Allow mouse, touch, and mapped computer-keyboard input.
4. Record monophonic note-on time, note-off time, pitch, and velocity proxy.
5. Maximum recording length: 15 seconds.
6. Minimum valid recording: 3 note events.
7. If fewer than 3 notes are recorded, show a non-blocking retry prompt.
8. Lightly quantize note start times and durations.
9. Play the original captured melody.
10. Automatically present five converted versions.

The UI must describe the result as a scale-remapping experiment, not a culturally authentic arrangement.

### 6.5 Results

Results are shown in the same five-destination order.

Controls:

- Play / pause
- Previous / next scale
- Replay all
- Neutral / regional timbre toggle
- Original melody comparison
- Return to keyboard

No saving or sharing is required.

---

## 7. Repertoire plan

### 7.1 Local examples

All entries below require a final score, arrangement, and rights review before production release.

| Scale | Destination | Preferred melody | Notes |
|---|---|---|---|
| Maqam Hijaz | Egypt | `El Helwa Di` | Preferred over Misirlou because it is an Egyptian, locally familiar Hijaz example. Use a newly created instrumental arrangement. |
| Dorian | North Atlantic | `What Shall We Do with the Drunken Sailor?` | Familiar, rhythmically clear Dorian example. `Scarborough Fair` is the backup. Avoid labeling the whole region or “Celtic music” as one scale. |
| Gong Diao | China | `茉莉花` | Use one explicitly identified regional/versioned melody and verify the tonic and scale-degree analysis. |
| Gong Diao — optional festive excerpt | China | `金蛇狂舞` | Optional enhancement. Select only a clearly pentatonic excerpt and do not present the entire work as a strict Gong-mode example. Requires separate rights and score review. |
| Miyako-bushi | Japan | `さくらさくら / Sakura Sakura` | Strong match; the melody is commonly explained through the In/Miyako-bushi pentatonic scale. |
| Degung approximation | Sunda | `Sabilulungan` or a consultant-selected traditional Degung melody | Final choice is unresolved. Requires Sundanese music review and rights confirmation. |

### 7.2 Common comparison melody

Primary choice: `Ode to Joy / 欢乐颂`, presented as a short newly programmed instrumental excerpt.

Optional future comparison melodies:

- `Twinkle, Twinkle, Little Star / 小星星`
- `Frère Jacques / 两只老虎`

MVP ships with only one comparison melody to keep the experience focused.

### 7.3 Rights rule

- Use only compositions confirmed as public domain in all intended launch territories or explicitly licensed for the project.
- Produce new MIDI arrangements and new audio rendering.
- Do not copy a modern performer’s recording or distinctive protected arrangement.
- Composition rights and sound-recording rights must be tracked separately.
- The repository must contain an asset manifest with source, arranger, license, and approval status.

No uncertain audio asset may block UI engineering: development must use clearly labeled placeholder MIDI and synthesized audio until approval.

---

## 8. Scale model

### 8.1 MVP tuning model

MVP uses 12-tone equal temperament (12-TET). One semitone equals 100 cents; one octave equals 1200 cents.

The circle position is relative to the selected tonic:

```text
angleDegrees = (semitonesFromRoot / 12) * 360 - 90
```

`-90` places the tonic at 12 o’clock. Angles increase clockwise.

Absolute frequency is metadata, not the circular position:

```text
frequencyHz = 440 * 2 ^ ((midiNote - 69) / 12)
```

### 8.2 Provisional scale definitions

These are implementation defaults for the prototype. Musical review may change names, spellings, tonic, or degree sets without requiring component rewrites.

```ts
type ScaleDefinition = {
  id: string;
  name: { en: string; zh: string; local?: string };
  destination: { en: string; zh: string };
  tonicMidi: number;
  semitones: number[]; // sorted unique values in [0, 11]
  degreeLabels: { en: string[]; zh?: string[]; local?: string[] };
  color: string;
  status: "approved" | "provisional";
  disclaimer?: { en: string; zh: string };
};
```

Prototype sets, normalized to C unless otherwise noted:

```ts
const scales = {
  hijaz:       [0, 1, 4, 5, 7, 8, 10],
  dorian:      [0, 2, 3, 5, 7, 9, 10],
  gong:        [0, 2, 4, 7, 9],
  miyakobushi: [0, 1, 5, 7, 8],
  degung:      [0, 1, 3, 7, 8] // provisional 12-TET approximation; review required
};
```

Required disclaimer for the Degung dataset:

> 为便于钢琴键盘互动，本体验使用十二平均律近似版本；真实 Degung 调律会因乐团与乐器而变化。

### 8.3 Circle rendering requirements

- Use SVG unless profiling shows a clear need for Canvas.
- Render 12 reference ticks.
- Render selected scale nodes above reference ticks.
- Connect selected nodes in ascending pitch-class order and close the polygon.
- Display the tonic node with a distinct size and shape.
- Animate polygon morphs between scale definitions.
- Highlight active notes according to the audio clock.
- Active-note animation: approximately 120 ms attack and 400 ms release.
- Reduced-motion mode removes geometry interpolation and uses opacity changes only.
- Clicking or tapping a scale node plays that pitch.

---

## 9. Audio system

### 9.1 Recommended implementation

- Web Audio API for playback and clock.
- Tone.js is acceptable for scheduling, transport, and sampling.
- Audio events must be scheduled from the audio clock, never from `setTimeout` alone.
- Visual animation reads transport/audio time and must not be treated as the source of truth.

### 9.2 Timing targets

- Audio scheduling error target: under 20 ms in normal conditions.
- Perceived audio/visual alignment target: under 50 ms.
- Scale changes in guided mode happen at a musical boundary.
- Avoid clicks with short gain ramps or crossfades.
- When the tab returns from the background, pause and offer resume rather than trying to catch up silently.

### 9.3 Timbre modes

`Neutral` is the comparison default:

- one consistent soft synth, mallet, or piano-like timbre;
- identical tempo, dynamics, and accompaniment across scale versions.

`Regional` is an optional interpretive layer:

- unique instrument palette per destination;
- must not change the melody data;
- must be labeled as an arrangement choice, not an inherent property of the scale.

During early development, use generated oscillator/sampler placeholders. Do not block core interaction work on final sound design.

---

## 10. Melody data and conversion

### 10.1 Event model

```ts
type NoteEvent = {
  id: string;
  midi: number;
  startBeats: number;
  durationBeats: number;
  velocity: number; // 0..1
};

type Melody = {
  id: string;
  bpm: number;
  timeSignature: [number, number];
  events: NoteEvent[];
};
```

### 10.2 Curated example conversion

The official comparison melody must have five separately reviewed `Melody` objects. It must not be generated at runtime from a nearest-note algorithm.

The five versions should preserve:

- tempo;
- rhythm;
- phrase length;
- broad melodic contour;
- recognizable motif.

They may change exact intervals, repeated notes, cadences, and octave placement to remain musical.

### 10.3 User melody conversion

The user melody uses deterministic automatic remapping.

Recommended MVP algorithm:

1. Detect the first stable/long note as the provisional tonic reference; fall back to C if confidence is low.
2. Convert each MIDI note to an interval from the provisional tonic.
3. Preserve the original octave register and melodic direction.
4. Quantize the pitch class to the nearest target-scale pitch class.
5. On equal-distance ties, prefer the note that preserves the direction of travel from the previous event.
6. Avoid octave jumps greater than 7 semitones unless the source contained a comparable jump.
7. Preserve event timing, duration, and velocity.

The resulting UI copy must say `自动映射 / Automatic remapping`, not `authentic arrangement`.

### 10.4 Rhythm cleanup

- Default capture tempo: 100 BPM.
- Quantize note starts to the nearest 1/8 note.
- Quantize duration to the nearest 1/8 note with a minimum duration of 1/8.
- Do not expose quantization settings.
- Keep a pre-quantized copy for replay if needed during testing.

---

## 11. Visual design requirements

### 11.1 Direction

Visual concept:

> Musical atlas × digital instrument × animated cartography

The experience should not resemble a dashboard.

### 11.2 Layout

Desktop:

- Map/environment: full viewport background.
- Scale circle: primary central focus, approximately 50–60% of available height.
- Destination/navigation rail: left or top edge.
- Context/theory panel: right side, collapsible.
- Transport: bottom.

Mobile:

- Portrait-first vertical layout.
- Map becomes a simplified background/navigation strip.
- Scale circle occupies the upper-middle viewport.
- Transport and destination controls remain thumb-reachable.
- Theory content opens as a bottom sheet.
- Piano keyboard scrolls horizontally but keeps the currently played octave centered when possible.

### 11.3 Destination themes

Themes should use cartographic abstraction rather than literal tourism imagery.

| Destination | Palette | Abstract material |
|---|---|---|
| Egypt / Hijaz | sand gold, terracotta, black | contour lines, star-grid, granular light |
| North Atlantic / Dorian | emerald, slate, sea blue | coastlines, wind lines, fog |
| China / Gong | vermilion, dark jade, muted gold | mountain contours, flowing routes, paper grain |
| Japan / Miyako-bushi | magenta, indigo, near-black | island outlines, rain lines, night glow |
| Sunda / Degung | lime, wet teal, deep green | terraces, water systems, topographic fields |

Colors identify datasets; they must not be described as universal cultural truths.

### 11.4 Typography

- Latin: Inter, Geist, or equivalent sans serif.
- Chinese: Noto Sans SC / 思源黑体.
- Numeric frequency/cents: monospaced font.
- Avoid decorative faux-ethnic typefaces.

---

## 12. Functional requirements

### FR-01 Audio start

Audio initializes only after explicit user interaction.

### FR-02 Guided playback

The user can start, pause, resume, skip, go back, or replay the guided tour.

### FR-03 Destination modes

Each destination exposes clearly distinct Local Song and Same Melody modes.

### FR-04 Circle sync

Every audible melody note highlights the correct circular node.

### FR-05 Node audition

The user can click, tap, or keyboard-focus a node and play it.

### FR-06 Piano input

The user can play the on-screen keyboard with touch, pointer, or mapped computer keys.

### FR-07 Recording

The user can record, stop, clear, and replay a monophonic performance up to 15 seconds.

### FR-08 Conversion

A valid user melody can be remapped into all five scale definitions.

### FR-09 Result comparison

The user can compare the original capture against each converted result.

### FR-10 Language

All user-facing interface copy supports Chinese and English.

### FR-11 Advanced information

Scale intervals, pitch names, approximation disclaimers, sources, and methodology are available without blocking the simple experience.

### FR-12 Responsive behavior

All primary flows work at 360 px mobile width and common desktop viewport sizes.

---

## 13. Accessibility and usability

- All playback buttons have accessible names and visible focus states.
- Do not encode scale identity by color alone; always show name and/or unique node pattern.
- Minimum touch target: 44 × 44 CSS pixels.
- Provide captions/text labels for every musical segment.
- Provide reduced-motion behavior based on `prefers-reduced-motion` plus an in-product override.
- Screen-reader users must be able to read scale name, note count, degree labels, and currently active note.
- The experience remains understandable while muted, with a clear prompt that sound completes the experience.
- No essential control depends on hover.

---

## 14. Non-functional requirements

### Performance

- Initial app shell target: under 250 KB compressed JavaScript where practical, excluding audio assets.
- Load only landing-critical audio initially.
- Lazy-load destination audio before its guided-tour step.
- Show deterministic loading states; never advance into silent playback.
- Target smooth 60 fps animation on a modern midrange mobile device; gracefully degrade visual effects if frame rate drops.

### Browser support

- Current Chrome, Edge, Safari, and Firefox.
- Current iOS Safari and Android Chrome.
- Provide a clear unsupported-audio message if Web Audio initialization fails.

### Privacy

- User performance remains in browser memory.
- No microphone permission is requested.
- No recording or melody data is uploaded.
- No account or personal data is collected in MVP.

### Reliability

- Audio state survives ordinary component rerenders.
- Route/state transitions do not create duplicate audio nodes or overlapping transports.
- Repeated replay does not increase volume or scheduling density.

---

## 15. Analytics

If analytics are included, collect only anonymous product events:

- `start_experience`
- `complete_octave_tutorial`
- `skip_octave_tutorial`
- `play_local_song(scaleId)`
- `play_comparison(scaleId)`
- `complete_guided_tour`
- `start_keyboard_recording`
- `complete_keyboard_recording(noteCount, durationBucket)`
- `play_user_conversion(scaleId)`
- `open_theory(scaleId)`

Do not capture individual note sequences.

---

## 16. Acceptance criteria

### Product comprehension

- A first-time user can reach audio playback with one primary action.
- The tutorial demonstrates octave equivalence and scale-note selection in 15 seconds or less.
- Local Song and Same Melody are visibly and verbally distinct.
- The user can complete the guided tour without operating advanced controls.

### Audio/visual behavior

- Active visual nodes match the scheduled melody events.
- Scale transitions do not produce obvious clicks or overlapping transports.
- Pausing stops both audio and active-note progression.
- Resuming continues from a musically sensible point.
- Backgrounding and returning does not cause a burst of overdue notes.

### Keyboard experiment

- Mouse, touch, and mapped computer keys produce notes.
- Recording stops automatically at 15 seconds.
- A performance with at least 3 notes produces five deterministic conversions.
- Repeating the same input produces the same converted pitches.
- Conversion preserves note timing and does not introduce unrequested chords.

### Responsive/accessibility

- All primary flows work at 360 × 800 and 1440 × 900.
- Interactive elements meet the 44 px touch-target guideline.
- All controls are reachable by keyboard.
- Reduced-motion mode removes major geometry movement.
- Scale identity remains understandable in grayscale.

### Content and rights

- Every production music asset has a completed manifest entry.
- Unapproved repertoire is replaced with clearly labeled placeholders.
- The Degung approximation disclaimer is visible wherever the scale is described in detail.

---

## 17. Recommended technical architecture

These choices are recommended defaults, not hard product requirements:

- Framework: Next.js + React + TypeScript.
- Styling: CSS Modules, Tailwind CSS, or an equivalent token-based system.
- State: local React state plus a small explicit state machine/reducer for experience phases.
- Audio: Tone.js over Web Audio API.
- Visualization: SVG + requestAnimationFrame for active-note visuals.
- Animation: CSS/Web Animations or Motion; respect reduced-motion settings.
- Data: versioned local JSON/TypeScript modules for scales, melodies, destinations, and licenses.
- Tests: Vitest for algorithms/state; Playwright for interaction/responsive flows.

Suggested module boundaries:

```text
src/
  audio/
    AudioEngine
    TransportScheduler
    InstrumentRegistry
  music/
    scales
    melodies
    quantizeRhythm
    remapMelody
  experience/
    experienceMachine
    guidedTour
  components/
    WorldMap
    ScaleCircle
    Transport
    PianoKeyboard
    TheorySheet
  content/
    copy.zh
    copy.en
    sources
  assets/
    manifest
```

Implementation should keep the audio engine independent from React rendering.

---

## 18. Suggested delivery phases

### Phase 1 — Technical proof

- One scale circle.
- One neutral synth.
- One hard-coded melody.
- Audio-clock-synchronized note highlighting.
- Basic mobile and desktop layout.

Exit condition: playback and circle remain synchronized through pause/resume and repeated replay.

### Phase 2 — Comparison prototype

- Five scale datasets.
- Five curated placeholder comparison melodies.
- Polygon morphing.
- Destination navigation and theme transitions.

Exit condition: user can complete a full five-scale comparison without audio overlap or navigation failure.

### Phase 3 — Keyboard experiment

- On-screen keyboard.
- Recording and rhythm cleanup.
- Deterministic five-scale remapping.
- Original-versus-result playback.

Exit condition: a 3–15 note test melody converts consistently on mobile and desktop.

### Phase 4 — Content integration

- Approved local-song arrangements.
- Regional timbres.
- Bilingual theory content.
- Sources, rights manifest, and disclaimers.

Exit condition: every production asset is approved and traceable.

### Phase 5 — Polish and validation

- Tutorial timing.
- Accessibility pass.
- Reduced motion.
- Performance profiling.
- Comprehension testing with non-musicians.

---

## 19. Known uncertainties and non-blocking defaults

| Uncertainty | Engineering default |
|---|---|
| Final Degung melody and tuning analysis | Use placeholder melody and provisional `[0,1,3,7,8]` dataset behind a replaceable data module. |
| Exact regional version of `茉莉花` | Use placeholder pentatonic MIDI until a version is selected and reviewed. |
| `金蛇狂舞` rights and strict modal analysis | Treat as optional; do not block MVP. |
| Final regional instruments | Use neutral synthesized timbre and instrument-registry placeholders. |
| Final map art direction | Build themeable vector layers with temporary abstract contours. |
| Launch analytics provider | Keep analytics behind a no-op adapter. |

These uncertainties must not be silently presented as resolved cultural or musicological facts.

---

## 20. Definition of done

The MVP is done when a new user can:

1. start the experience without autoplay failure;
2. understand the octave circle through the short tutorial;
3. hear five local examples and five same-melody comparisons;
4. see every played pitch reflected on the correct scale node;
5. record a short monophonic melody;
6. hear deterministic versions of that melody in all five scales;
7. use the complete flow on mobile or desktop;
8. access clear theory, approximation, source, and rights information;
9. complete all of the above without an account or data upload.

The most important remembered moment should be the instant when the same familiar melody continues with the same rhythm but the polygon changes shape and the musical character changes with it.
