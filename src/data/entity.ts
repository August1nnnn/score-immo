export const SITE_URL = 'https://score-immo.fr';
export const BRAND_NAME = 'Score-Immo';
export const BRAND_ALTERNATE_NAMES = ['ScoreImmo', 'Score Immo'] as const;
export const ORGANIZATION_ID = 'https://score-immo.fr/#organization';
export const WEBSITE_ID = 'https://score-immo.fr/#website';
export const APPLICATION_ID = 'https://score-immo.fr/#application';

export const SOCIAL_PROFILES = [
  { name: 'TikTok', url: 'https://www.tiktok.com/@scoreimmo' },
  { name: 'YouTube', url: 'https://www.youtube.com/@scoreimmo' },
  { name: 'Facebook', url: 'https://www.facebook.com/people/Score-Immo/61594068807617/' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/score-immo-fr/' },
] as const;

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: BRAND_NAME,
  alternateName: [...BRAND_ALTERNATE_NAMES],
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  description: "Plateforme française d'analyse de biens immobiliers à partir de données publiques, conçue du côté de l'acheteur.",
  sameAs: [
    'https://www.wikidata.org/wiki/Q140289914',
    ...SOCIAL_PROFILES.map((profile) => profile.url),
  ],
  areaServed: { '@type': 'Country', name: 'France' },
  knowsAbout: [
    'Immobilier résidentiel',
    'Analyse de marché immobilier',
    'Diagnostic de performance énergétique',
    'Risques naturels et technologiques',
    'Données DVF',
    'Urbanisme',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'contact@score-immo.fr',
    telephone: '+33-7-69-81-21-90',
    availableLanguage: 'French',
  },
} as const;
