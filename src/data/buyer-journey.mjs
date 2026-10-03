// One owner per buyer decision. This is navigation, never a market statistic.
export const BUYER_JOURNEY = [
  {
    id: 'annonce', title: "1. Vérifier ce que l'annonce permet de savoir",
    description: "Séparez les informations présentes des questions à poser avant la visite.",
    links: [
      ['analyser-annonce-immobiliere-comme-pro', 'Analyser une annonce avant de visiter'],
      ['annonce-immobiliere-sans-adresse', "Que vérifier sans adresse exacte ?"],
      ['surface-carrez-habitable-dvf', 'Carrez, habitable et DVF : vérifier la surface'],
    ],
  },
  {
    id: 'prix', title: '2. Contrôler le prix avec des références comparables',
    description: "Documentez dates, frais, lots et caractéristiques avant de conclure sur le prix.",
    links: [
      ['estimation-immobiliere-methodes-juste-prix', 'Vérifier si le prix demandé est cohérent'],
      ['donnees-dvf-utiliser-prix-vente-reels', 'Utiliser les ventes DVF'],
      ['prix-annonce-dvf-ecart', "Comprendre l'écart entre prix d'annonce et DVF"],
      ['vente-absente-dvf', 'Rechercher une vente absente de DVF'],
      ['dvf-mutation-plusieurs-lots', 'Éviter un faux prix au m² pour une vente groupée'],
    ],
  },
  {
    id: 'dpe', title: '3. Vérifier le DPE et les diagnostics',
    description: 'Retrouvez le bon document et comprenez sa portée avant de chiffrer des travaux.',
    links: [
      ['verifier-dpe-numero-ademe', 'Vérifier le DPE avec son numéro ADEME'],
      ['dpe-comprendre-classes-energetiques', 'Lire la grille DPE et ses exceptions'],
      ['dossier-diagnostic-technique-ddt-checklist-acheteur', 'Demander les diagnostics du bien'],
    ],
  },
  {
    id: 'risques', title: '4. Contrôler les risques et les documents du bien',
    description: 'Utilisez la localisation vérifiée et les pièces du vendeur pour préparer vos questions.',
    links: [
      ['diagnostic-etat-risques-pollutions-erp', "Lire l'état des risques"],
      ['consulter-comprendre-plu-achat-immobilier', 'Consulter le PLU avant un achat'],
      ['analyser-pv-ag-copropriete-avant-achat', "Lire les PV d'assemblée de copropriété"],
    ],
  },
  {
    id: 'budget', title: '5. Comparer les biens et leur coût total',
    description: 'Comparez les mêmes postes, avec les dépenses connues et les informations manquantes.',
    links: [
      ['benchmark-immobilier-comparer-biens', 'Remplir une grille pour comparer deux biens'],
      ['cout-total-achat-immobilier', "Construire le budget total d'achat"],
      ['acheter-appartement-travaux-budget-aides', 'Préparer les vérifications pour un bien avec travaux'],
    ],
  },
  {
    id: 'offre', title: '6. Préparer la visite puis une offre argumentée',
    description: 'Confrontez les données à la visite et demandez les confirmations nécessaires avant de signer.',
    links: [
      ['visite-immobiliere-checklist-points-verifier', 'Préparer les points à vérifier pendant la visite'],
      ['checklist-contre-visite-immobiliere', 'Organiser une contre-visite'],
      ['negocier-prix-bien-immobilier-guide-complet', 'Documenter les arguments de négociation'],
    ],
  },
];
