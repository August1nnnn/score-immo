import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("une valeur nulle laisse la piste vide au lieu de simuler un montant", () => {
  const component = read("src/components/ScaleBars.astro");

  // Un plancher de largeur appliqué à un zéro afficherait un moignon coloré,
  // ce que le montant écrit à côté dément.
  assert.match(component, /if \(value <= 0\) return 0;/);
});

test("une donnée absente n'est jamais convertie en zéro", () => {
  const component = read("src/components/ScaleBars.astro");

  assert.match(component, /typeof value !== 'number'[^\n]*return null/);
  assert.match(component, /is-missing/);
  // La valeur reste écrite en toutes lettres, la barre seule disparaît.
  assert.match(component, /'Non mesuré'/);
});

test("la valeur reste un texte lisible à côté de la barre", () => {
  const component = read("src/components/ScaleBars.astro");

  assert.match(component, /class="si-scale-value"/);
  // La barre est décorative pour les lecteurs d'écran : l'information est le texte.
  assert.match(component, /class="si-scale-track" aria-hidden="true"/);
});

test("l'animation ne peut pas masquer un contenu", () => {
  const component = read("src/components/ScaleBars.astro");

  // Seule la largeur est animée, jamais l'opacité d'un contenu.
  assert.match(component, /@keyframes si-scale-grow \{ from \{ width: 0; \} to \{ width: var\(--w, 0%\); \} \}/);
  assert.doesNotMatch(component, /@keyframes[^}]*opacity/s);
  assert.match(component, /animation-fill-mode|\bboth\b/);
  assert.match(component, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none/);
  // Aucun JavaScript : pas de reveal, pas d'observateur.
  assert.doesNotMatch(component, /data-reveal|si-reveal-on|IntersectionObserver/);
});

test("la fiche Baromètre utilise l'échelle partagée pour ses deux blocs chiffrés", () => {
  const detail = read("src/pages/barometre/[slug].astro");

  assert.match(detail, /import ScaleBars from '@\/components\/ScaleBars\.astro'/);
  assert.match(detail, /ariaLabel=\{`Détail du score/);
  assert.match(detail, /ariaLabel="Composition du coût d'acquisition"/);
  // Le coût se lit en proportion du budget total, pas de la plus grande ligne.
  assert.match(detail, /max=\{d\.acquisition\.total\}/);
  // Les anciennes pistes vides du tableau de coûts ont disparu.
  assert.doesNotMatch(detail, /<span class="bar-track"><\/span>/);
});
