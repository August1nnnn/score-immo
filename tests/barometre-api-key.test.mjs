import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL("../scripts/gen-barometre.mjs", import.meta.url),
  "utf8",
);

test("barometre generation requires a publishable Supabase key", () => {
  assert.match(source, /process\.env\.SCOREIMMO_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(source, /startsWith\(['"]sb_publishable_['"]\)/);
  assert.doesNotMatch(source, /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
});

test("barometre generation sends the publishable key only as apikey", () => {
  assert.match(source, /headers:\s*\{\s*apikey:\s*PUBLISHABLE_KEY\s*\}/);
  assert.doesNotMatch(source, /Authorization\s*:/);
});
