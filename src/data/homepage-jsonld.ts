export const homepageJsonLd = [
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://score-immo.fr/#organization",
        "name": "ScoreImmo",
        "url": "https://score-immo.fr",
        "logo": "https://score-immo.fr/favicon.svg",
        "description": "Premier outil français d'aide à la décision immobilière. Analyse n'importe quelle annonce immobilière en 30 secondes via 10 sources de données officielles.",
        "foundingDate": "2025",
        "sameAs": ["https://www.wikidata.org/wiki/Q140289914"],
        "areaServed": { "@type": "Country", "name": "France" },
        "knowsAbout": [
          "Immobilier résidentiel",
          "Analyse de marché immobilier",
          "DPE - Diagnostic de Performance Énergétique",
          "Risques naturels (Géorisques, ICPE, Seveso)",
          "Prix immobilier au m²",
          "Investissement locatif",
          "Données DVF",
          "Urbanisme et PLU",
          "Frais de notaire",
          "Fiscalité immobilière"
        ],
        "slogan": "5 heures d'analyse immobilière en 30 secondes",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": "contact@score-immo.fr",
          "telephone": "+33-7-69-81-21-90",
          "availableLanguage": "French"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://score-immo.fr/#website",
        "url": "https://score-immo.fr",
        "name": "ScoreImmo",
        "description": "Analyse n'importe quelle annonce immobilière en 30 secondes.",
        "publisher": { "@id": "https://score-immo.fr/#organization" },
        "inLanguage": "fr-FR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://app.score-immo.fr/app?url={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://score-immo.fr/#application",
        "name": "ScoreImmo",
        "alternateName": "Score Immo",
        "url": "https://app.score-immo.fr/app",
        "applicationCategory": "FinanceApplication",
        "applicationSubCategory": "Real Estate Analysis Tool",
        "operatingSystem": "Web (all)",
        "browserRequirements": "Requires JavaScript",
        "description": "Colle le lien d'une annonce immobilière (Leboncoin, SeLoger, Bien'ici, PAP, Logic-Immo), reçois un rapport complet d'aide à la décision en 30 secondes. 230+ données croisées depuis 10 sources officielles : DVF, ADEME, Géorisques, INSEE, IGN/GPU, BAN, OSM, Éducation Nationale, ATMO, DGFIP.",
        "featureList": [
          "Analyse du prix vs transactions réelles DVF",
          "Score global 0-100 avec recommandation d'achat",
          "DPE expliqué et impact énergétique chiffré",
          "Risques naturels (Géorisques: inondation, séisme, argile, radon)",
          "Risques industriels ICPE et Seveso",
          "Analyse du quartier (écoles, commerces, transports, criminalité)",
          "Estimation du coût total d'acquisition (frais de notaire, taxe foncière)",
          "Estimation locative et rendement net",
          "Urbanisme et PLU (projets, droits à bâtir)",
          "Qualité de l'air et niveau sonore",
          "Checklist de visite personnalisée",
          "Projection de valorisation sur 10 ans",
          "Actualités locales du quartier",
          "Portrait socio-économique (INSEE)"
        ],
        "screenshot": "https://score-immo.fr/assets/og-default.svg",
        "offers": [
          { "@type": "Offer", "name": "Analyse unique", "price": "2.99", "priceCurrency": "EUR", "description": "1 rapport personnalisé, paiement unique" },
          { "@type": "Offer", "name": "Découverte", "price": "9.99", "priceCurrency": "EUR", "description": "5 analyses, paiement unique" },
          { "@type": "Offer", "name": "Recherche", "price": "29", "priceCurrency": "EUR", "description": "60 analyses par mois" },
          { "@type": "Offer", "name": "Premium", "price": "79", "priceCurrency": "EUR", "description": "Analyses illimitées, PDF brandé et modes Achat/Vente" }
        ],
        "creator": { "@id": "https://score-immo.fr/#organization" },
        "inLanguage": "fr-FR"
      }
    ]
  }
];
