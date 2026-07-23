# World Scales · 世界音阶地图

An interactive, bilingual music-learning experience about how a scale changes
the character of a melody. The app includes a guided five-stop musical atlas,
an audio-clock-synchronized octave circle, and a local-only monophonic melody
experiment.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm test
npm run test:pages
```

`npm test` builds the deployable worker, verifies the server-rendered product
shell and asset approvals, then runs the deterministic music-domain tests.

## GitHub Pages

The public site at <https://coconaliu.github.io/world-scales/> is built as a
standalone browser application:

```bash
npm run build:pages
npm run preview:pages
```

This produces `dist-pages/` with standard static HTML, CSS, JavaScript, and
public assets. The GitHub Actions workflow deploys that directory to GitHub
Pages. The deployed site has no OpenAI, ChatGPT, server, or worker runtime
dependency.

## Content status

All current melodies are synthesized placeholders. Production repertoire,
arrangements, regional timbres, and rights require approval before release.
The source and approval state of each planned asset is tracked in
`public/assets/manifest.json`.
