import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const unsupportedAuthorNames = /Camille Renard|Léa Moreau|Thomas Varin/;
const unsupportedAuthorNamesGlobal = /Camille Renard|Léa Moreau|Thomas Varin/g;

function listJsonFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listJsonFiles(path);
    return entry.name.endsWith(".json") ? [path] : [];
  });
}

function replaceUnsupportedAuthorNames(value) {
  if (typeof value === "string") {
    return value.replace(unsupportedAuthorNamesGlobal, "Score-Immo");
  }
  if (Array.isArray(value)) return value.map(replaceUnsupportedAuthorNames);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        replaceUnsupportedAuthorNames(nestedValue),
      ]),
    );
  }
  return value;
}

const articlesDirectory = resolve("src/content/articles");
for (const path of listJsonFiles(articlesDirectory)) {
  const relativePath = path.slice(articlesDirectory.length + 1);
  let content = JSON.parse(readFileSync(path, "utf8"));

  content.author = "Score-Immo";
  content.author_handle = "scoreimmo";
  content.body_html = content.body_html.replace(
    /<p[^>]*>[\s\S]*?<\/p>/gi,
    (paragraph) => {
      if (!unsupportedAuthorNames.test(paragraph)) return paragraph;

      if (
        relativePath ===
        "guides/offre-d-achat-immobilier-montant-delai-retractation-engageme.json"
      ) {
        return paragraph.replace(
          "Dans ce guide, Camille Renard, analyste immobilière spécialisée dans les transactions résidentielles, t'explique",
          "Ce guide explique",
        );
      }

      if (
        relativePath ===
        "pro/gerer-offre-d-achat-role-mandataire-negociation.json"
      ) {
        return paragraph.replace(
          "Dans cet article, Camille Renard te guide",
          "Cet article te guide",
        );
      }

      if (
        relativePath === "pro/pige-immobiliere-2026-trouver-mandats.json" &&
        (paragraph.startsWith("<p>Le SMS") || paragraph.startsWith("<p>Vous:"))
      ) {
        return paragraph.replace(unsupportedAuthorNamesGlobal, "Sophie Martin");
      }

      return "";
    },
  );

  content = replaceUnsupportedAuthorNames(content);
  const serialized = JSON.stringify(content, null, 2);
  if (unsupportedAuthorNames.test(serialized)) {
    throw new Error(`Unsupported author identity remains in ${relativePath}`);
  }
  writeFileSync(path, `${serialized}\n`);
}

const articlePath = resolve(
  "src/content/articles/guides/acheter-bien-classe-dpe-f-2026.json",
);
const article = JSON.parse(readFileSync(articlePath, "utf8"));

const replacements = [
  [
    "<p>Selon les données collectées par <strong>ScoreImmo</strong> sur plus de 50 000 annonces analysées, 68% des biens DPE F sont des maisons individuelles construites avant 1975, contre 32% d'appartements anciens sans isolation.</p>",
    "<p>La classe F peut concerner une maison comme un appartement. Elle ne suffit pas, à elle seule, à déduire l'âge du bâtiment, sa typologie ou les défauts d'isolation à traiter. Le DPE et, lorsqu'il est requis, l'audit énergétique du bien doivent être examinés avant de chiffrer les travaux.</p>",
  ],
  [
    "<p>D'après l'analyse des données DVF par ScoreImmo, la décote moyenne des biens DPE F a évolué comme suit :</p>",
    "<p>Les écarts ci-dessous sont des scénarios indicatifs et non les résultats d'un échantillon propriétaire Score-Immo. La base DVF ne contient pas le prix initial de l'annonce et ne permet donc pas, à elle seule, de mesurer une remise entre prix affiché et prix vendu.</p>",
  ],
  [
    "<p>ScoreImmo a analysé plus de 2 000 projets de rénovation énergétique pour établir ces fourchettes réalistes :</p>",
    "<p>Les fourchettes ci-dessous sont des ordres de grandeur éditoriaux. Elles ne proviennent pas d'un échantillon propriétaire Score-Immo et doivent être remplacées par des devis adaptés au bien.</p>",
  ],
  [
    "<p>ScoreImmo identifie ces secteurs porteurs en croisant les données de <a href=\"/blogs/guides\">prix immobilier</a>, la tension locative et les projets d'aménagement urbain.</p>",
    "<p>Pour étudier un secteur, croisez les prix immobiliers, la demande locative et les projets d'aménagement, puis vérifiez chaque donnée à sa source.</p>",
  ],
  [
    "<p>ScoreImmo intègre le calcul automatique des aides disponibles selon la localisation du bien et les revenus de l'acquéreur dans son <a href=\"https://app.score-immo.fr/app\">analyse d'annonce immobilière</a>.</p>",
    "<p>Les aides dépendent notamment de la localisation, du logement, des travaux et des revenus. Vérifiez votre situation sur les services publics compétents avant d'établir le plan de financement.</p>",
  ],
  [
    "ScoreImmo estime précisément ces coûts selon les caractéristiques du bien.",
    "Une estimation automatisée ne remplace pas les devis et l'avis de professionnels qualifiés.",
  ],
];

for (const [legacy, corrected] of replacements) {
  if (article.body_html.includes(legacy)) {
    article.body_html = article.body_html.replace(legacy, corrected);
  } else if (!article.body_html.includes(corrected)) {
    throw new Error(`Expected public claim not found: ${legacy.slice(0, 100)}`);
  }
}

article.updated_at = "2026-08-27";
writeFileSync(articlePath, `${JSON.stringify(article, null, 2)}\n`);

const cgvPath = resolve("src/data/pages/cgv.json");
const cgv = JSON.parse(readFileSync(cgvPath, "utf8"));
const cgvReplacements = [
  [
    "édité par Augustin Foucheres, dont le siège social est situé 75 avenue des Champs-Élysées, 75008 Paris, France (ci-après « l'Éditeur »)",
    "édité par Augustin Foucheres, entrepreneur individuel, SIREN 890 838 709, dont le siège est situé Bureau 326, 78 avenue des Champs-Élysées, 75008 Paris, France (ci-après « l'Éditeur »)",
  ],
  [
    "<strong>Adresse</strong> : ScoreImmo - 75 avenue des Champs-Élysées, 75008 Paris, France",
    "<strong>Adresse</strong> : Bureau 326, 78 avenue des Champs-Élysées, 75008 Paris, France",
  ],
];

for (const [legacy, corrected] of cgvReplacements) {
  if (cgv.body_html.includes(legacy)) {
    cgv.body_html = cgv.body_html.replace(legacy, corrected);
  } else if (!cgv.body_html.includes(corrected)) {
    throw new Error(`Expected CGV claim not found: ${legacy.slice(0, 100)}`);
  }
}

cgv.updated_at = "2026-08-27T21:20:00+02:00";
writeFileSync(cgvPath, `${JSON.stringify(cgv, null, 2)}\n`);
