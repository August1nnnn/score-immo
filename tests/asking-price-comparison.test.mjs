import assert from 'node:assert/strict';
import test from 'node:test';
import { compareAskingPrice } from '../src/lib/asking-price-comparison.mjs';

test('compares the asking unit price with the median of user-verified references', () => {
  assert.deepEqual(compareAskingPrice(220000, 50, [3800, 4000, 4200]), {
    pricePerSqm: 4400, median: 4000, differencePercent: 10, referenceCount: 3,
  });
  assert.equal(compareAskingPrice(200000, 50, [3800, 4000, 4200]).differencePercent, 0);
  assert.equal(compareAskingPrice(180000, 50, [3800, 4000, 4200]).differencePercent, -10);
});

test('uses the median and preserves the caller references without sorting them in place', () => {
  const references = [9000, 3900, 4100, 4000];
  const saved = [...references];
  assert.equal(compareAskingPrice(202500, 50, references).median, 4050);
  assert.deepEqual(references, saved);
});

test('refuses missing data instead of inventing a market reference or outputting infinity', () => {
  for (const [price, surface, references] of [
    [0, 50, [4000, 4000, 4000]], [220000, 0, [4000, 4000, 4000]],
    [Infinity, 50, [4000, 4000, 4000]], [220000, 50, []], [220000, 50, [4000, 4100]],
    [220000, 50, [4000, NaN, 4200]], [220000, 50, [4000, 0, 4200]],
  ]) assert.equal(compareAskingPrice(price, surface, references), null);
});
