import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/barometre-sync.yml", import.meta.url);

test("la synchronisation Barometre est planifiee et declenchable a chaque consentement", () => {
  const source = readFileSync(workflowUrl, "utf8");
  assert.match(source, /schedule:/);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /cron:/);
  assert.match(source, /cron: ['"]23 6 \* \* \*['"]/);
  assert.match(source, /contents: write/);
  assert.doesNotMatch(source, /pull-requests: write/);
});

test("le workflow utilise seulement la cle publishable et valide avant publication", () => {
  const source = readFileSync(workflowUrl, "utf8");
  for (const command of [
    "npm ci",
    "npm run barometre:sync",
    "npm test",
    "npm run test:content-truth",
    "npm run build",
    "npm run test:site-integrity",
    "git push origin HEAD:main",
    "npm run barometre:verify-live",
  ]) assert.ok(source.includes(command), command);
  assert.match(source, /SCOREIMMO_SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(source, /SUPABASE_PAT|SERVICE_ROLE|SECRET_KEY/);
  assert.match(
    source,
    /Verify live[^\n]*\n\s+if: steps\.changes\.outputs\.changed == 'false'[\s\S]*npm run barometre:verify-live/,
    "live parity must run only when no synchronization is pending",
  );
  assert.match(source, /git diff --name-only --diff-filter=D -- src\/content\/barometre/);
  assert.match(source, /git diff --exit-code -- \. ':\(exclude\)src\/content\/barometre\/\*\*'/);
  assert.match(source, /git status --porcelain --untracked-files=all -- src\/content\/barometre/);
  assert.doesNotMatch(source, /git diff --quiet -- src\/content\/barometre/);
});

test("le workflow publie sans validation humaine et le deploiement attend son succes", () => {
  const source = readFileSync(workflowUrl, "utf8");
  const deploy = readFileSync(new URL("../.github/workflows/deploy.yml", import.meta.url), "utf8");
  assert.doesNotMatch(source, /gh pr create|gh pr merge|automation\/barometre-sync/);
  assert.match(source, /git push origin HEAD:main/);
  assert.match(deploy, /Barometre - automatically synchronize published snapshots/);
});
