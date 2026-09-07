import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
test('blog offer audit distinguishes old offers from market and competitor figures', () => {
  const output = execFileSync(process.execPath, ['scripts/check-content-truth.mjs', '--self-test-blog'], { cwd: root, encoding: 'utf8' });
  assert.match(output, /Blog audit regressions passed: 22/);
});
test('all article JSON files comply with current public offers', () => {
  const output = execFileSync(process.execPath, ['scripts/check-content-truth.mjs'], { cwd: root, encoding: 'utf8' });
  assert.match(output, /Blog sources inspected: \d+ JSON files/);
  assert.match(output, /Content truth checks passed/);
});
