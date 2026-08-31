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

test("l'édition courante n'affiche pas un profil recopié sur la moitié des cartes", () => {
  const dir = new URL("src/content/barometre/", root);
  const fiches = readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(new URL(name, dir), "utf8")));

  const month = fiches.reduce((max, f) => (f.mois > max ? f.mois : max), "");
  const current = fiches.filter((f) => f.mois === month);
  assert.ok(current.length >= 2, "l'édition courante contient plusieurs fiches");

  const counts = new Map();
  for (const fiche of fiches.filter((f) => f.mois === month)) {
    const key = buildFicheSignal(fiche).axes.map(({ key: k, score }) => `${k}:${score}`).join("|");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const worst = Math.max(...counts.values());

  // Le défaut réel était une accroche recopiée sur 9 des 16 cartes, soit 56 %.
  // On n'exige pas l'unicité parfaite : deux biens peuvent légitimement obtenir
  // les mêmes notes, et un tel test virerait au rouge tout seul dès qu'une
  // édition s'élargit. On refuse seulement qu'un même profil couvre la moitié
  // de l'édition, ce qui signale une valeur par défaut et non une mesure.
  assert.ok(
    worst <= current.length / 2,
    `un même profil couvre ${worst} des ${current.length} fiches de l'édition ${month}`,
  );
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
});

test("le logo d'en-tête ne se coupe pas sur mobile", () => {
  const styles = read("public/assets/scoreimmo.css");

  assert.match(styles, /\.si-logo\s*\{[^}]*flex-shrink:\s*0/s);
  assert.match(styles, /\.si-logo-text\s*\{[^}]*white-space:\s*nowrap/s);
});

test("les cibles tactiles du menu et des exports atteignent 44px", () => {
  const styles = read("public/assets/scoreimmo.css");
  const hub = read("src/pages/barometre/index.astro");

  assert.match(styles, /\.si-mobile-menu-btn\s*\{[^}]*width:\s*2\.75rem[^}]*height:\s*2\.75rem/s);
  assert.match(hub, /\.bar-archive-actions a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(hub, /\.bar-region-list li\s*>\s*a[^{]*\{[^}]*min-height:\s*44px/s);
  assert.match(hub, /\.bar-downloads\s*>\s*a\s*\{[^}]*min-height:\s*44px/s);
});

test("les animations sont désactivables et ne bloquent jamais le contenu", () => {
  const hub = read("src/pages/barometre/index.astro");

  assert.match(hub, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(hub, /IntersectionObserver/);

  // L'état par défaut est visible : sans JS, sans IntersectionObserver ou en
  // reduced-motion, aucun bloc ne peut rester masqué.
  assert.match(hub, /\[data-reveal\]\s*\{[^}]*opacity:\s*1/s);
  // Le masquage n'existe que sous le drapeau posé par le script.
  assert.match(hub, /\.si-reveal-on\s+\[data-reveal\]\s*\{[^}]*opacity:\s*0/s);
  assert.match(hub, /prefers-reduced-motion: reduce\)/);
  assert.match(hub, /classList\.add\('si-reveal-on'\)/);
});
