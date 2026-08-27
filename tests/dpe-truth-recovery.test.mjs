import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { extractFaq } from "../src/lib/extract-faq.js";

const root = new URL("../", import.meta.url);
const article = JSON.parse(
  readFileSync(
    new URL(
      "src/content/articles/guides/dpe-comprendre-classes-energetiques.json",
      root,
    ),
    "utf8",
  ),
);

test("the DPE recovery preserves the proven search signal", () => {
  assert.equal(
    article.title,
    "Grille DPE 2026 : classes A à G, seuils et calcul de la note",
  );
  assert.equal(
    article.meta_title,
    "Grille DPE 2026 : Classes A à G, Seuils kWh et Calcul de la Note",
  );
  assert.equal(article.handle, "dpe-comprendre-classes-energetiques");
});

test("the DPE guide states only bounded and sourced 2026 facts", () => {
  const body = article.body_html;
  const textBody = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const tldr = article.tldr.join(" ");

  assert.equal(article.last_reviewed, "2026-08-27");
  assert.match(body, /coefficient[^<]{0,100}1,9/);
  assert.match(body, /1er janvier 2026/);
  assert.match(body, /attestation officielle/);
  assert.match(body, /plus de 40 m²/);
  assert.match(body, /moins de 800 mètres/);
  assert.match(body, /petites surfaces/);
  assert.match(body, /classe G[^<]{0,120}2025/);
  assert.match(body, /classe F[^<]{0,120}2028/);
  assert.match(body, /classe E[^<]{0,120}2034/);
  assert.match(body, /maisons individuelles/);
  assert.match(body, /immeubles en monopropriété/);
  assert.match(body, /Depuis le 1er janvier 2025[^<]{0,180}classe E/);
  assert.match(textBody, /appartements de classe G.{0,160}12 % moins cher/);
  assert.match(textBody, /maisons de classe G.{0,160}25 % moins cher/);
  assert.match(tldr, /moins bon résultat/);
  assert.match(tldr, /2,3 à 1,9/);

  for (const unsupported of [
    /chaque classe perdue représente/i,
    /40% des logements/i,
    /Analyse ScoreImmo 2026/i,
    /données DVF 2025-2026/i,
    /coût de chauffage annuel/i,
    /prix moyen du gaz/i,
    /tarif EDF moyen/i,
    /dure généralement 1h30/i,
    /15 à 25% pour un bien/i,
    /3 000 euros de plus/i,
    /pénalise particulièrement le chauffage électrique/i,
    /audit énergétique détaillé est obligatoire depuis septembre 2022/i,
  ]) {
    assert.doesNotMatch(`${tldr} ${body}`, unsupported);
  }
});

test("the DPE sources resolve to specific primary references", () => {
  const urls = article.sources.map(({ url }) => url);

  for (const expected of [
    "https://www.ecologie.gouv.fr/politiques-publiques/diagnostic-performance-energetique-dpe",
    "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049446315",
    "https://www.ecologie.gouv.fr/presse/evolution-du-calcul-du-dpe-1er-janvier-2026-favoriser-lelectrification-du-chauffage",
    "https://www.ecologie.gouv.fr/actualites/evolutions-du-calcul-du-dpe-reponses-vos-questions",
    "https://www.service-public.fr/particuliers/vosdroits/F35978/0_1?idFicheParent=F2042",
    "https://www.service-public.fr/particuliers/vosdroits/F37110",
    "https://observatoire-dpe-audit.ademe.fr/accueil",
    "https://www.notaires.fr/fr/article/la-valeur-verte-des-logements-vendus-en-2024",
    "https://www.immobilier.notaires.fr/fr/articles/conseils-et-actualites/actualites/des-transactions-sous-linfluence-de-letiquette-energie",
  ]) {
    assert.ok(urls.includes(expected), expected);
  }

  for (const url of urls) {
    assert.doesNotMatch(url, /^https:\/\/(?:www\.)?ademe\.fr\/?$/);
    assert.doesNotMatch(url, /service-public\.fr\/particuliers\/actualites\/?$/);
    assert.doesNotMatch(url, /^https:\/\/www\.ecologie\.gouv\.fr\/?$/);
  }
});

test("the product CTA cannot be mistaken for a FAQ question", () => {
  const faqPairs = extractFaq(article.body_html);

  assert.equal(faqPairs.length, 5);
  assert.doesNotMatch(
    faqPairs.map(({ q }) => q).join(" "),
    /Vérifiez le DPE dans le contexte du bien/,
  );
});
