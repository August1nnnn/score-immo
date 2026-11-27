// Only these three existing guides have a measured conversion review.
// Keep their form, attribution and price source unchanged.
const contexts = {
  'alternative-castorus-score-immo-comparatif': {
    heading: 'Vous suivez déjà cette annonce ? Examinez aussi le bien.',
    description: "Collez son lien pour préparer vos vérifications sur le prix, les risques, le DPE et le quartier, selon les données disponibles.",
    demoLabel: 'Voir un exemple de rapport complet',
  },
  'dpe-classe-d-analyse-achat': {
    heading: 'Un logement classé D vous intéresse ?',
    description: "Vérifiez aussi son prix et son environnement. Collez l'annonce pour préparer vos questions avant la visite, selon les données disponibles. L'analyse ne remplace ni le DPE du vendeur ni un devis de travaux.",
    demoLabel: 'Voir un exemple de rapport',
  },
  'dpe-comprendre-classes-energetiques': {
    heading: 'Vous avez la lettre du DPE. Et le reste du bien ?',
    description: "Consultez un exemple de rapport, puis collez votre annonce si vous avez un bien précis à examiner avant une visite.",
    demoLabel: "Voir l'exemple de rapport",
    demoFirst: true,
  },
};

export function getArticleAnalyzerContext(handle) {
  return Object.hasOwn(contexts, handle) ? contexts[handle] : null;
}
