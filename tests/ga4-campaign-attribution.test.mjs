import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../public/ga4.js', import.meta.url), 'utf8');
function run(search, { analytics = 'accepted', advertising = 'rejected', referrer = '' } = {}) {
  const callbacks = {};
  const window = { ScoreImmoConsent: {
    getStatus: () => analytics, getAdvertisingStatus: () => advertising,
    onChange: fn => callbacks.analytics = fn, onAdvertisingChange: fn => callbacks.advertising = fn,
  }};
  vm.runInNewContext(source, { window, document: { title: 'Score-Immo', referrer, createElement: () => ({}), head: { appendChild() {} } },
    location: { origin: 'https://score-immo.fr', pathname: '/', search }, URL, Date });
  return { entries: window.dataLayer, callbacks };
}
const page = result => result.entries.find(e => e[0] === 'event' && e[1] === 'page_view')?.[2];
test('social campaign reaches GA4 without private query values or advertising IDs', () => {
  const result = run('?utm_source=youtube&utm_medium=organic_social&utm_campaign=videos_septembre&utm_content=video_01&email=private@example.test&fbclid=private_click');
  const event = page(result);
  assert.equal(event.campaign_source, 'youtube');
  assert.equal(event.campaign_medium, 'organic_social');
  assert.equal(event.campaign_name, 'videos_septembre');
  assert.equal(event.campaign_content, 'video_01');
  assert.equal(event.page_location, 'https://score-immo.fr/');
  assert.ok(!JSON.stringify(result.entries).includes('private'));
});
test('Google auto tagging is retained only with advertising acceptance', () => {
  const query = '?gclid=valid_click&gbraid=braid_1&wbraid=braid_2&url=private_listing';
  const url = new URL(page(run(query, {advertising:'accepted'})).page_location);
  assert.equal(url.searchParams.get('gclid'), 'valid_click');
  assert.equal(url.searchParams.get('gbraid'), 'braid_1');
  assert.equal(url.searchParams.get('wbraid'), 'braid_2');
  assert.equal(url.searchParams.get('url'), null);
  assert.equal(page(run(query)).page_location, 'https://score-immo.fr/');
});
test('campaign fields reject private and malformed values', () => {
  const event = page(run('?utm_source=tiktok&utm_campaign=person%40example.test&utm_content=https%3A%2F%2Fprivate.test&utm_term='+'a'.repeat(81)));
  assert.equal(event.campaign_source, 'tiktok');
  assert.equal(event.campaign_name, undefined);
  assert.equal(event.campaign_content, undefined);
  assert.equal(event.campaign_term, undefined);
});
test('OAuth and payment referrers cannot become acquisition sources', () => {
  for(const host of ['accounts.google.com','appleid.apple.com','checkout.stripe.com','afvtxiklivnmakqixkml.supabase.co']) {
    assert.equal(page(run('', {referrer:`https://${host}/callback?private=1`})).page_referrer, '');
  }
  assert.equal(page(run('', {referrer:'https://www.youtube.com/'})).page_referrer, 'https://www.youtube.com/');
});
test('late analytics acceptance applies campaign without duplicating page view', () => {
  const result = run('?utm_source=facebook&utm_medium=organic_social', {analytics:null,advertising:'accepted'});
  assert.equal(page(result), undefined);
  assert.ok(!JSON.stringify(result.entries).includes('campaign_source'));
  result.callbacks.analytics('accepted');
  assert.equal(page(result).campaign_source, 'facebook');
  result.callbacks.analytics('accepted');
  assert.equal(result.entries.filter(e=>e[0]==='event'&&e[1]==='page_view').length,1);
});
const lastConfig = result => result.entries.filter(e=>e[0]==='config').at(-1)?.[2];
test('consent changes refresh defaults and remove denied identifiers', () => {
  const result=run('?utm_source=youtube&utm_medium=organic_social&gclid=click_123',{advertising:'accepted'});
  assert.equal(new URL(lastConfig(result).page_location).searchParams.get('gclid'),'click_123');
  result.callbacks.advertising('rejected');
  assert.equal(lastConfig(result).page_location,'https://score-immo.fr/');
  result.callbacks.analytics('rejected');
  assert.equal(lastConfig(result).campaign_source,'');
  assert.equal(lastConfig(result).campaign_medium,'');
});
test('either consent order updates GA defaults without another page view', () => {
  const result=run('?utm_source=google&utm_medium=cpc&gclid=click_123');
  result.callbacks.advertising('accepted');
  assert.equal(new URL(lastConfig(result).page_location).searchParams.get('gclid'),'click_123');
  assert.equal(result.entries.filter(e=>e[0]==='event'&&e[1]==='page_view').length,1);
  const late=run('?utm_source=youtube',{analytics:null,advertising:'accepted'});
  late.callbacks.analytics('accepted');
  assert.equal(lastConfig(late).campaign_source,'youtube');
});
