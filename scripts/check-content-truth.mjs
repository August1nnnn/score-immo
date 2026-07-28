import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

const checks = [
  {
    file: "src/components/sections/Features.astro",
    forbidden: ["pour tu donner"],
    message: "La home contient encore la faute « pour tu donner ».",
  },
  {
    file: "src/components/sections/Score.astro",
    forbidden: ["ne tu donne pas"],
    message: "La home contient encore la faute « ne tu donne pas ».",
  },
  {
    file: "src/pages/barometre/index.astro",
    forbidden: ["><strong>13</strong><span>sources officielles"],
    message: "Le Baromètre affiche encore 13 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "src/components/sections/BehindScenes.astro",
    forbidden: ['{v:"9",l:"sources officielles"}'],
    message: "L’animation de la home affiche encore 9 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "src/components/sections/Stats.astro",
    forbidden: ['data-target="9" data-suffix="">9</div>'],
    message: "Le bloc de chiffres de la home affiche encore 9 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "src/components/sections/Pricing.astro",
    forbidden: ['data-counter="13" data-suffix="">13</p>'],
    message: "La page tarifs affiche encore 13 sources au lieu de la valeur canonique 10.",
  },
  {
    file: "src/content/articles/guides/loi-pinel-2026-conditions-plafonds-alternatives.json",
    forbidden: [
      "seul le dispositif Pinel Plus (aussi appelé Super Pinel) maintient",
      "seul le Pinel Plus survit en 2025-2026",
      "Le Pinel Plus reste pertinent",
      "Pinel Plus en 2026 pour conserver",
    ],
    message: "L’article Pinel 2026 présente encore un dispositif éteint comme accessible.",
  },
  {
    file: "src/content/articles/guides/acheter-ancien-neuf-comparatif-complet.json",
    forbidden: [
      "Loi Pinel</strong> : réduction d'impôt",
      "Neuf (Pinel 12 ans)",
      "Investisseurs fiscaux</strong> : optimisation Pinel",
    ],
    message: "Le comparatif ancien/neuf présente encore Pinel comme un avantage actuel.",
  },
  {
    file: "src/content/articles/quartiers/meilleurs-quartiers-acheter-toulouse.json",
    forbidden: ["avantages fiscaux intéressants (Pinel, PTZ)"],
    message: "L’article Toulouse présente encore Pinel comme un avantage actuel.",
  },
  {
    file: "src/content/articles/guides/dispositif-denormandie-2026-renover-l-ancien-defiscaliser.json",
    forbidden: [
      "31 décembre 2026",
      "prorogé jusqu'au <strong>31 décembre 2026</strong>",
      "date d'expiration : le 31 décembre 2026",
      "2026 est la dernière année certifiée",
      "https://www.service-public.fr/particuliers/vosdroits/F31151",
    ],
    message: "L’article Denormandie contient une date de fin ou une source obsolète.",
  },
  {
    file: "src/content/articles/guides/loi-pinel-2026-conditions-plafonds-alternatives.json",
    forbidden: ["\"https://www.service-public.fr/particuliers/vosdroits/F1730\""],
    message: "La source Loc'Avantages pointe vers une fiche Service-Public sans rapport.",
  },
];

const failures = [];

for (const check of checks) {
  const source = read(check.file);
  for (const phrase of check.forbidden) {
    if (source.includes(phrase)) {
      failures.push(`${check.file}: ${check.message} Motif: ${phrase}`);
    }
  }
}

const sourcesComponent = read("src/components/sections/Sources.astro");
const canonicalSources = [
  "DVF (Transactions)",
  "ADEME (DPE)",
  "INSEE",
  "G&eacute;orisques",
  "IGN / G&eacute;oportail de l'urbanisme",
  "BAN (Adresses)",
  "OpenStreetMap",
  "ATMO France",
  "DGFIP",
  "&Eacute;ducation Nationale",
];
for (const source of canonicalSources) {
  if (!sourcesComponent.includes(source)) {
    failures.push(`src/components/sections/Sources.astro: source canonique absente: ${source}`);
  }
}
const sourcePillCount = (sourcesComponent.match(/class="si-source-pill /g) || []).length;
if (sourcePillCount !== 10) {
  failures.push(
    `src/components/sections/Sources.astro: ${sourcePillCount} sources affichées, 10 attendues.`,
  );
}
if (sourcesComponent.includes("Bing News")) {
  failures.push(
    "src/components/sections/Sources.astro: Bing News ne doit pas être présenté comme une source publique officielle française.",
  );
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Content truth checks passed.");
