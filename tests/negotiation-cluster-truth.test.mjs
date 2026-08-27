import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const benchmark = readJson(
  "src/content/articles/guides/marge-negociation-immobilier-2026.json",
);
const procedure = readJson(
  "src/content/articles/guides/negocier-prix-bien-immobilier-guide-complet.json",
);
const stripHtml = (html) =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const countFaqQuestions = (html) => {
  const faqStart = html.search(/<h2[^>]*>[^<]*(?:FAQ|Questions fréquentes)/i);
  assert.ok(faqStart >= 0, "FAQ heading must exist");
  return (html.slice(faqStart).match(/<h3\b/g) || []).length;
};

test("the benchmark owns the sourced T1 2026 rates", () => {
  const text = stripHtml(benchmark.body_html);

  assert.equal(benchmark.id, "760000000001");
  assert.equal(benchmark.handle, "marge-negociation-immobilier-2026");
  assert.equal(
    benchmark.title,
    "Marge de négociation immobilière 2026 : 5,1 % au T1",
  );
  assert.equal(benchmark.meta_title, benchmark.title);
  assert.equal(
    benchmark.meta_description,
    "Au T1 2026, Laforêt publie 5,1 % de marge moyenne dans son réseau : 3,4 % à Paris, 5,1 % en Île-de-France et 5,4 % en régions.",
  );
  assert.equal(benchmark.updated_at, "2026-08-28");
  assert.equal(benchmark.last_reviewed, "2026-08-28");
  assert.equal(benchmark.word_count, text.split(" ").length);
  assert.ok(benchmark.word_count >= 1200);

  for (const required of [
    /720 agences/,
    /5,1 % au niveau national/,
    /3,4 % à Paris/,
    /5,1 % en Île-de-France/,
    /5,4 % en régions/,
    /5,7 % pour les maisons/,
    /4,1 % pour les appartements/,
    /8 transactions sur 10/,
    /donnée du réseau Laforêt/,
  ]) {
    assert.match(text, required);
  }

  assert.match(
    benchmark.body_html,
    /href="\/blogs\/guides\/negocier-prix-bien-immobilier-guide-complet"/,
  );
});

test("the benchmark distinguishes negotiation, DVF and green value", () => {
  const publicCopy = `${benchmark.tldr.join(" ")} ${benchmark.summary_html} ${benchmark.body_html}`;
  const urls = benchmark.sources.map(({ url }) => url);

  assert.match(publicCopy, /DVF ne contient pas le prix initial affiché/);
  assert.match(publicCopy, /ne peut donc pas calculer une marge de négociation/);
  assert.match(publicCopy, /valeur verte[^.]+n'est pas une remise négociée/i);
  assert.ok(
    urls.includes("https://www.laforet.com/espace-presse/marche/chiffres-immobiliers-T1-2026"),
  );
  assert.ok(
    urls.includes("https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres"),
  );
  assert.ok(
    urls.includes("https://www.notaires.fr/en/node/38420"),
  );

  for (const unsupported of [
    /passoire thermique[^.]{0,100}10 à 20 %/i,
    /15 % sous le prix/i,
    /jusqu'à 20 % sur les marchés tendus/i,
    /marge sur un bien classé G est près du double/i,
    /offre que le vendeur ne pourra pas balayer/i,
  ]) {
    assert.doesNotMatch(publicCopy, unsupported);
  }
  assert.doesNotMatch(publicCopy, /[—–]/);
  assert.equal(countFaqQuestions(benchmark.body_html), 5);
});

test("the procedural guide keeps its recent search signal and loses fabricated rates", () => {
  const text = stripHtml(procedure.body_html);
  const publicCopy = `${procedure.tldr.join(" ")} ${procedure.summary_html} ${procedure.body_html}`;

  assert.equal(procedure.id, "749407600965");
  assert.equal(procedure.handle, "negocier-prix-bien-immobilier-guide-complet");
  assert.equal(procedure.title, "Négocier le prix d'un bien immobilier : méthode 2026");
  assert.equal(
    procedure.meta_title,
    "Négocier un prix immobilier en 2026 : méthode et arguments",
  );
  assert.equal(
    procedure.meta_description,
    "Préparez votre négociation immobilière : analyse du prix, arguments, offre d'achat et contre-proposition pour négocier un bien en 2026.",
  );
  assert.equal(procedure.updated_at, "2026-08-28");
  assert.equal(procedure.last_reviewed, "2026-08-28");
  assert.equal(procedure.word_count, text.split(" ").length);
  assert.ok(procedure.word_count >= 1500);

  for (const unsupported of [
    /10 % sur l'ancien/i,
    /68 % des biens/i,
    /85 %/,
    /Maître Dubois/i,
    /78 % des transactions/i,
    /15 000 transactions/i,
    /5,2 % du prix affiché[^.]+DVF/i,
    /baisse de 4 % des prix/i,
    /accord final se situe à 60/i,
    /10 à 20 %[^.]+divorce/i,
    /48-72h pour créer une urgence/i,
  ]) {
    assert.doesNotMatch(publicCopy, unsupported);
  }
  assert.doesNotMatch(publicCopy, /[—–]/);
});

test("the procedural guide uses evidence as inputs, not automatic discounts", () => {
  const text = stripHtml(procedure.body_html);
  const urls = procedure.sources.map(({ url }) => url);

  for (const required of [
    /budget maximal tout compris/i,
    /transactions comparables/i,
    /DVF ne donne ni le prix initial de l'annonce ni la remise négociée/i,
    /devis/i,
    /durée de validité/i,
    /condition suspensive d'obtention du prêt/i,
    /aucune somme ne doit être versée au stade de l'offre/i,
    /contre-proposition/i,
  ]) {
    assert.match(text, required);
  }
  assert.match(
    procedure.body_html,
    /href="\/blogs\/guides\/marge-negociation-immobilier-2026"/,
  );

  for (const expected of [
    "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres",
    "https://www.notaires.fr/fr/immobilier-fiscalite/achat-et-vente-les-etapes/la-promesse-de-vente-et-le-compromis-de-vente",
    "https://www.anil.org/votre-besoin/acheter/types-dachat/logement-existant/",
    "https://www.service-public.fr/particuliers/vosdroits/F188",
    "https://www.economie.gouv.fr/hcsf/mesures/mesure-relative-loctroi-de-credits-immobiliers",
  ]) {
    assert.ok(urls.includes(expected), expected);
  }
  assert.equal(countFaqQuestions(procedure.body_html), 5);
});
