import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { buildFicheSignal, axisBarHeight } from "../src/lib/barometre-signal.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const CURRENT_METHOD = "current-category-grid-2026-08";
const LEGACY_METHOD = "legacy-five-section-2026-06";

test("le signal d'une fiche décrit ses axes réellement notés", () => {
  const signal = buildFicheSignal({
    methodology_version: LEGACY_METHOD,
    score_sections: { prix: 8, dpe: 2, risques: 6, urbanisme: 9, environnement: 5 },
    alertes_cles: ["DPE F : rénovation énergétique à chiffrer"],
  });

  assert.equal(signal.axes.length, 5);
  assert.equal(signal.missing, 0);
  assert.deepEqual(signal.strongest, { key: "urbanisme", label: "Urbanisme", score: 9 });
  assert.deepEqual(signal.weakest, { key: "dpe", label: "Performance énergétique", score: 2 });
  assert.equal(signal.alert, "DPE F : rénovation énergétique à chiffrer");
});

test("une note absente n'est jamais rendue comme un zéro", () => {
  const signal = buildFicheSignal({
    methodology_version: CURRENT_METHOD,
    score_sections: { prix: 8, transports: 9, urbanisme: 9 },
  });

  assert.equal(signal.axes.length, 3);
  assert.equal(signal.axes.every(({ score }) => score > 0), true);
  assert.equal(signal.missing, 0, "les axes non publiés ne sont pas comptés comme notés");
  assert.equal(signal.alert, null);

  // Un axe présent mais non numérique est signalé absent, pas ramené à zéro.
  const dirty = buildFicheSignal({
    methodology_version: CURRENT_METHOD,
    score_sections: { prix: 8, dpe: null, transports: 9 },
  });
  assert.equal(dirty.missing, 1);
  assert.equal(dirty.axes.some(({ key }) => key === "dpe"), false);
});

test("une barre d'axe reste visible même à zéro", () => {
  assert.equal(axisBarHeight(10), 100);
  assert.equal(axisBarHeight(5), 50);
  assert.ok(axisBarHeight(0) >= 6);
});

test("chaque fiche de l'édition courante expose seulement ses axes réellement notés", () => {
  const dir = new URL("src/content/barometre/", root);
  const fiches = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(new URL(name, dir), "utf8")));

  const month = fiches.reduce((max, f) => (f.mois > max ? f.mois : max), "");
  const current = fiches.filter((f) => f.mois === month);
  assert.ok(current.length >= 2, "l'édition courante contient plusieurs fiches");

  for (const fiche of current) {
    const signal = buildFicheSignal(fiche);
    assert.ok(signal.axes.length > 0, `${fiche.slug} doit conserver au moins un axe noté`);
    assert.ok(signal.strongest, `${fiche.slug} doit exposer son axe le plus fort`);
    assert.ok(signal.weakest, `${fiche.slug} doit exposer son axe le plus faible`);
    assert.equal(signal.axes.every(({ score }) => Number.isFinite(score)), true);
  }
});

test("le hub rend le profil réel et n'affiche plus une accroche unique recopiée", () => {
  const hub = read("src/pages/barometre/index.astro");

  assert.match(hub, /buildFicheSignal/);
  assert.match(hub, /bar-signal-bar/);
  // L'ancienne accroche prenait points_forts[0], identique sur la majorité des fiches.
  assert.doesNotMatch(hub, /fiche\.alertes_cles\[0\] \|\| fiche\.points_forts\[0\] \|\| fiche\.verdict/);
});

test("l'échelle DPE ne peut plus déborder de sa carte", () => {
  const hub = read("src/pages/barometre/index.astro");

  // L'ancienne grille imposait un minimum de piste (74px) inférieur au min-content
  // du badge (~123px), ce qui faisait sortir le mot « annonces » de la pastille.
  assert.doesNotMatch(hub, /\.bar-dpe-list\s*\{[^}]*minmax\(74px/s);
  assert.match(hub, /\.bar-dpe-row/);
  assert.match(hub, /\.bar-dpe-track/);
  assert.match(hub, /item\.count === 1 \? 'annonce' : 'annonces'/);
  assert.doesNotMatch(hub, /\.bar-dpe-row\.is-empty\s*\{[^}]*opacity/s);
});

test("le logo d'en-tête ne se coupe pas sur mobile", () => {
  const styles = read("public/assets/scoreimmo.css");

  assert.match(styles, /\.si-logo\s*\{[^}]*flex-shrink:\s*0/s);
  assert.match(styles, /\.si-logo-text\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(styles, /@media \(max-width:\s*420px\)[\s\S]*?\.si-header-inner\s*\{[^}]*gap:\s*0\.5rem/s);
  assert.match(styles, /@media \(max-width:\s*420px\)[\s\S]*?\.si-logo-text\s*\{[^}]*font-size:\s*1\.05rem/s);
  assert.match(styles, /@media \(min-width:\s*1152px\)\s*\{\s*\.si-header-nav\s*\{[^}]*display:\s*flex/s);
  assert.match(styles, /@media \(min-width:\s*1152px\)\s*\{\s*\.si-mobile-menu-btn\s*\{[^}]*display:\s*none/s);
});

test("les cibles tactiles du menu et des exports atteignent 44px", () => {
  const styles = read("public/assets/scoreimmo.css");
  const hub = read("src/pages/barometre/index.astro");

  assert.match(styles, /\.si-mobile-menu-btn\s*\{[^}]*width:\s*2\.75rem[^}]*height:\s*2\.75rem/s);
  assert.match(hub, /\.bar-archive-actions a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(hub, /\.bar-region-list li\s*>\s*a[^{]*\{[^}]*min-height:\s*44px/s);
  assert.match(hub, /\.bar-downloads\s*>\s*a\s*\{[^}]*min-height:\s*44px/s);
});

test("les données structurantes ne dépendent d'aucun reveal JavaScript", () => {
  const hub = read("src/pages/barometre/index.astro");

  assert.match(hub, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(hub, /data-reveal|si-reveal-on|data-countup/);
});

test("les légendes secondaires conservent un contraste lisible", () => {
  const hub = read("src/pages/barometre/index.astro");

  assert.match(hub, /\.bar-signal-scope\s*\{[^}]*color:\s*#64748b/s);
});
