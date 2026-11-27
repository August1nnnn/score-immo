import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getArticleAnalyzerContext } from '../src/data/article-analyzer-context.mjs';

test('only the three measured guide handles receive contextual copy', () => {
  for (const handle of ['alternative-castorus-score-immo-comparatif', 'dpe-classe-d-analyse-achat', 'dpe-comprendre-classes-energetiques']) {
    const context = getArticleAnalyzerContext(handle);
    assert.ok(context?.heading && context?.description && context?.demoLabel);
    assert.doesNotMatch(JSON.stringify(context), /\d[,.]\d{2}\s*€|gratuit.*personnalisé|recalcul.*DPE/i);
  }
  for (const handle of ['', 'other-guide', 'constructor', '__proto__', 'toString']) {
    assert.equal(getArticleAnalyzerContext(handle), null);
  }
  assert.equal(getArticleAnalyzerContext('dpe-comprendre-classes-energetiques').demoFirst, true);
});

test('contextual copy preserves the existing analyzer handoff and event identity', () => {
  const source = readFileSync(new URL('../src/components/AnalyzerBox.astro', import.meta.url), 'utf8');
  assert.match(source, /!professionalTrial && blog === 'guides'/);
  assert.match(source, /data-form-id=\{formId\} data-analyzer-form/);
  assert.match(source, /action=\{professionalTrial \? 'https:\/\/app.score-immo.fr\/pro\/essai' : 'https:\/\/app.score-immo.fr\/app'\} method="get"/);
  assert.match(source, /name="url"/);
  assert.match(source, /name="utm_campaign" value=\{safeCampaign\}/);
  assert.match(source, /\/r\/demo\?utm_source=site/);
  assert.doesNotMatch(source, /go\/checkout|trackConversion|fetch\(/);
});
