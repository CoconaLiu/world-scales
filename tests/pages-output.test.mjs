import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const outputDirectory = path.resolve("dist-pages");
const expectedBasePath = "/world-scales/";

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

test("GitHub Pages output has a deployable entry document", async () => {
  const html = await readFile(path.join(outputDirectory, "index.html"), "utf8");

  await access(path.join(outputDirectory, ".nojekyll"));
  assert.match(html, /<title>World Scales｜世界音阶地图<\/title>/);
  assert.match(html, /lang="zh-CN"/);
  assert.doesNotMatch(html, /\/_next\//);

  const publicReferences = [
    ...html.matchAll(/(?:href|src)="\/world-scales\/([^"#?]+)"/g),
  ].map((match) => match[1]);

  assert.ok(publicReferences.length >= 3);

  for (const reference of publicReferences) {
    await access(path.join(outputDirectory, reference));
  }
});

test("GitHub Pages bundle has no OpenAI runtime dependency", async () => {
  const files = await collectFiles(outputDirectory);
  const textFiles = files.filter((file) => /\.(?:css|html|js|json)$/u.test(file));
  const contents = await Promise.all(
    textFiles.map((file) => readFile(file, "utf8")),
  );
  const bundle = contents.join("\n").toLowerCase();

  assert.doesNotMatch(bundle, /chatgpt\.site|api\.openai\.com|auth\.openai\.com/);
  assert.ok(bundle.includes(expectedBasePath));
});
