import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/barometre-sync.yml", import.meta.url);

test("la synchronisation Barometre est planifiee et ouvrable manuellement", () => {
  const source = readFileSync(workflowUrl, "utf8");
  assert.match(source, /schedule:/);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /cron:/);
  assert.match(source, /cron: ['"]23 6 \* \* \*['"]/);
  assert.match(source, /contents: write/);
  assert.match(source, /pull-requests: write/);
});

test("le workflow utilise seulement la cle publishable et valide avant PR", () => {
  const source = readFileSync(workflowUrl, "utf8");
  for (const command of [
    "npm ci",
    "npm run barometre:sync",
    "npm test",
    "npm run test:content-truth",
    "npm run build",
    "npm run test:site-integrity",
    "gh pr create",
    "npm run barometre:verify-live",
  ]) assert.ok(source.includes(command), command);
  assert.match(source, /SCOREIMMO_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(source, /SUPABASE_PAT|SERVICE_ROLE|SECRET_KEY/);
  assert.match(
    source,
    /Verify live[^\n]*\n\s+if: steps\.changes\.outputs\.changed == 'false'[\s\S]*npm run barometre:verify-live/,
    "live parity must run only when no synchronization PR is pending",
  );
  assert.match(source, /git diff --name-only --diff-filter=D -- src\/content\/barometre/);
  assert.match(source, /REMOVED_COUNT/);
  assert.match(source, /removal.*explicit reviewer verification/i);
});

test("le workflow ne fusionne et ne deploie jamais automatiquement", () => {
  const source = readFileSync(workflowUrl, "utf8");
  assert.doesNotMatch(source, /gh pr merge|auto-merge|wrangler|pages deploy/i);
  assert.match(source, /automation\/barometre-sync/);
  assert.match(source, /gh pr list.*--state open/);
});
