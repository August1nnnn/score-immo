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
        "description": "Premier outil français d'aide à la décision immobilière. Analyse n'importe quelle annonce immobilière en 30 secondes via 9 sources de données officielles.",
        "foundingDate": "2025",
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
        "description": "Colle le lien d'une annonce immobilière (Leboncoin, SeLoger, Bien'ici, PAP, Logic-Immo), reçois un rapport complet d'aide à la décision en 30 secondes. 230+ données croisées depuis 9 sources officielles : DVF, ADEME, Géorisques, INSEE, IGN/GPU, OSM, Éducation Nationale, ATMO, DGFIP.",
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
          { "@type": "Offer", "name": "Gratuit", "price": "0", "priceCurrency": "EUR", "description": "1 analyse offerte" },
          { "@type": "Offer", "name": "Découverte", "price": "9.99", "priceCurrency": "EUR", "description": "5 analyses, paiement unique" },
          { "@type": "Offer", "name": "Recherche", "price": "29", "priceCurrency": "EUR", "description": "60 analyses/mois, 1€ le premier mois" },
          { "@type": "Offer", "name": "Premium", "price": "79", "priceCurrency": "EUR", "description": "Analyses illimitées, 1€ le premier mois" }
        ],
        "creator": { "@id": "https://score-immo.fr/#organization" },
        "inLanguage": "fr-FR"
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "D'où viennent les données de ScoreImmo ?",
        "acceptedAnswer": { "@type": "Answer", "text": "ScoreImmo croise automatiquement 9 sources de données publiques officielles françaises : DVF (transactions réelles, DGFIP), ADEME (DPE), Géorisques (ministère de la Transition écologique), INSEE, IGN et Géoportail de l'Urbanisme, OpenStreetMap, Éducation Nationale, ATMO France et DGFIP. Plus de 250 vérifications par annonce." }
      },
      {
        "@type": "Question",
        "name": "ScoreImmo est-il un conseil en investissement ?",
        "acceptedAnswer": { "@type": "Answer", "text": "Non. ScoreImmo est un outil d'aide à la décision basé sur des données publiques. Il fournit des informations factuelles et un score indicatif. Il ne constitue pas un conseil en investissement au sens réglementaire et ne remplace pas un professionnel (notaire, agent, expert)." }
      },
      {
        "@type": "Question",
        "name": "Quelles annonces puis-je analyser ?",
        "acceptedAnswer": { "@type": "Answer", "text": "ScoreImmo analyse les annonces de tous les grands portails immobiliers français : Leboncoin, SeLoger, Bien'ici, PAP, Logic-Immo, Century 21, Orpi, Laforêt, Ouest-France Immo, ParuVendu, MeilleursAgents. Il suffit de coller le lien de l'annonce." }
      },
      {
        "@type": "Question",
        "name": "Que débloque l'abonnement ?",
        "acceptedAnswer": { "@type": "Answer", "text": "L'abonnement (1€ le premier mois puis 29€ ou 79€/mois sans engagement) débloque les sections complètes du rapport : rendement locatif détaillé, coût total d'acquisition, historique DVF, urbanisme projet, et augmente le volume d'analyses mensuelles (60 ou illimité)." }
      },
      {
        "@type": "Question",
        "name": "Mes données sont-elles protégées ?",
        "acceptedAnswer": { "@type": "Answer", "text": "Oui. ScoreImmo ne conserve que les données nécessaires au fonctionnement du service. Aucune donnée personnelle n'est revendue à des tiers. Le service est hébergé en Europe (UE) et conforme au RGPD. Un délégué à la protection des données peut être contacté à contact@score-immo.fr." }
      },
      {
        "@type": "Question",
        "name": "Combien coûte une analyse ScoreImmo ?",
        "acceptedAnswer": { "@type": "Answer", "text": "La première analyse est offerte sans carte bleue. Ensuite, tu as le choix : Découverte à 9,99€ pour 5 analyses en paiement unique, Recherche à 1€ le premier mois puis 29€/mois (60 analyses/mois, sans engagement), ou Premium à 1€ le premier mois puis 79€/mois (illimité, sans engagement)." }
      }
    ]
  }
];
