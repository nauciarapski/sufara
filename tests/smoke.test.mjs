// Platform-owned smoke test: it proves the generated project's environment runs and that the
// platform plumbing (package.json + index.html) really is in place. Replace it with your own tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("package.json defines the dev script", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.scripts && pkg.scripts.dev, "package.json has no dev script");
});

test("index.html mounts the app root", () => {
  const html = read("index.html");
  assert.ok(html.includes('id="root"') || html.includes('id="app"'), "index.html has no root element");
});
