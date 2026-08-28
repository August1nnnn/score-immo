import {
  APPLICATION_ID,
  BRAND_ALTERNATE_NAMES,
  BRAND_NAME,
  ORGANIZATION_ID,
  SITE_URL,
  WEBSITE_ID,
} from './entity';

export const homepageJsonLd = [
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        "url": SITE_URL,
        "name": BRAND_NAME,
        "alternateName": [...BRAND_ALTERNATE_NAMES],
        "description": "Analyse n'importe quelle annonce immobilière en 30 secondes.",
        "publisher": { "@id": ORGANIZATION_ID },
        "inLanguage": "fr-FR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://app.score-immo.fr/app?url={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": APPLICATION_ID,
        "name": BRAND_NAME,
        "alternateName": [...BRAND_ALTERNATE_NAMES],
        "url": "https://app.score-immo.fr/app",
        "applicationCategory": "FinanceApplication",
        "applicationSubCategory": "Real Estate Analysis Tool",
        "operatingSystem": "Web (all)",
        "browserRequirements": "Requires JavaScript",
        "description": "L'application web Score-Immo analyse une annonce immobilière à partir des sources publiques et ouvertes disponibles pour le bien, puis produit un rapport d'aide à la décision.",
        "featureList": [
          "Comparaison du prix avec les références de marché disponibles",
          "Score global sur 100 avec couverture des données",
          "DPE et niveau de confiance de l'attribution",
          "Risques naturels et industriels disponibles",
          "Analyse des commerces, écoles et transports",
          "Estimation du coût total d'acquisition",
          "Rendement locatif lorsque les données le permettent",
          "Contexte d'urbanisme disponible",
          "Checklist de visite personnalisée",
          "Portrait socio-économique local"
        ],
        "screenshot": "https://score-immo.fr/assets/og-default.svg",
        "offers": [
          { "@type": "Offer", "name": "Analyse unique", "price": "2.99", "priceCurrency": "EUR", "description": "1 rapport personnalisé, paiement unique" },
          { "@type": "Offer", "name": "Découverte", "price": "9.99", "priceCurrency": "EUR", "description": "5 analyses, paiement unique" },
          { "@type": "Offer", "name": "Recherche", "price": "29", "priceCurrency": "EUR", "description": "60 analyses par mois" },
          { "@type": "Offer", "name": "Premium", "price": "79", "priceCurrency": "EUR", "description": "Analyses illimitées, PDF brandé et modes Achat/Vente" }
        ],
        "creator": { "@id": ORGANIZATION_ID },
        "inLanguage": "fr-FR"
      }
    ]
  }
];
