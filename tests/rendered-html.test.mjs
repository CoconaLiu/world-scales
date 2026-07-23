import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the World Scales experience shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>World Scales(?:｜|&#xFF5C;)世界音阶地图<\/title>/i);
  assert.match(html, /World Scales/);
  assert.match(html, /Start listening|开始聆听/);
  assert.match(html, /interactive musical atlas|一张可演奏的音乐地图/i);
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("ships the production metadata and removes the disposable starter", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /WorldScalesExperience/);
  assert.match(layout, /World Scales/);
  assert.match(layout, /世界音阶地图/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("keeps all music assets explicitly pending until review", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("../public/assets/manifest.json", import.meta.url), "utf8"),
  );

  assert.equal(manifest.assets.length, 10);
  for (const asset of manifest.assets) {
    assert.equal(asset.assetStatus, "placeholder");
    assert.equal(asset.approvalStatus, "pending");
  }
});
