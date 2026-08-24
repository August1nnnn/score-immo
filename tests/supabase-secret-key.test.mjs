import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getSupabaseSecretKey,
  supabaseHeaders,
} from "../functions/_supabase.js";

test("Cloudflare functions accept only the opaque Supabase secret key", () => {
  assert.equal(
    getSupabaseSecretKey({ SUPABASE_SECRET_KEY: "sb_secret_test" }),
    "sb_secret_test",
  );
  assert.equal(
    getSupabaseSecretKey({ SUPABASE_SECRET_KEY: "sb_publishable_test" }),
    null,
  );
  assert.equal(
    getSupabaseSecretKey({ SUPABASE_SERVICE_KEY: "eyJ.legacy.key" }),
    null,
  );
  assert.equal(
    getSupabaseSecretKey({ SUPABASE_SERVICE_ROLE_KEY: "eyJ.legacy.key" }),
    null,
  );
});

test("opaque Supabase keys are sent only in the apikey header", () => {
  assert.deepEqual(supabaseHeaders("sb_secret_test", "return=minimal"), {
    apikey: "sb_secret_test",
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  });
});

test("every Cloudflare Supabase caller uses the strict shared resolver", () => {
  const files = [
    "../functions/_middleware.ts",
    "../functions/api/event.js",
    "../functions/api/ereferer.js",
  ];

  for (const relativePath of files) {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    assert.match(source, /getSupabaseSecretKey/);
    assert.doesNotMatch(
      source,
      /SUPABASE_(?:SERVICE_ROLE_KEY|SERVICE_KEY|ANON)(?![A-Z_])/,
    );
    assert.doesNotMatch(
      source,
      /Authorization:\s*`Bearer \$\{(?:key|env\.SUPABASE_[^}]+)\}`/,
    );
  }
});
