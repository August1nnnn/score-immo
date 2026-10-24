import assert from 'node:assert/strict';
import test from 'node:test';
import { bpeAssetPolicy } from '../functions/_bpe-policy.js';

test('BPE freshness protects both stable manifests and dated public snapshots', () => {
  const path='/data/bpe/2025-2026-10-24-47058c2c/728_556.json.gz';
  assert.equal(bpeAssetPolicy('/blogs/guides'),null);
  assert.deepEqual(bpeAssetPolicy('/data/bpe/current.json'),{expired:false,cacheSeconds:3600});
  assert.equal(bpeAssetPolicy(path,Date.parse('2026-10-25')).expired,false);
  assert.equal(bpeAssetPolicy(path,Date.parse('2026-11-28')).expired,true);
  assert.equal(bpeAssetPolicy(path,Date.parse('2026-10-23')).expired,true);
  assert.equal(bpeAssetPolicy('/data/bpe/../../private').expired,true);
  assert.equal(bpeAssetPolicy(path,Date.parse('2026-11-27T23:59:40Z')).cacheSeconds,20);
});
