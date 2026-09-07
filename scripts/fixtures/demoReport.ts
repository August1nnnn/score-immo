import type { MatchData } from "@/components/MatchBlock";

export const demoReport = {
  id: "demo",
  isDemo: true,
  title: "Appartement T3 - 68 m²",
  address: "12 rue des Lilas, 69003 Lyon",
  city: "Lyon 3e (69003)",
  type: "Appartement",
  category: "residential" as const,
  url: "https://example.com/immobilier/demo-annonce",
  updatedAt: "14 février 2026",
  price: 285000,
  surface: 68,
  rooms: 3,
  bedrooms: 2,
  floor: "1er étage avec ascenseur",
  pricePerSqm: 4191,
  medianLocal: 4450,
  diffPercent: -5.8,
  p25: 3800,
  p75: 5200,
  nbComparables: 142,
  score: 72,
  confidence: "neighborhood" as const,
  status: "success" as const,
  scores: { prix: 78, liquidite: 65, risques: 72, energie: 80, quartier: 68 },
  sectionScores: [
    { id: "prix", label: "Prix vs Marché", score: 8, weight: 18, weighted: 14.4, sentiment: "positive" as const, detail: "4 191 EUR/m2 vs médiane 4 450 EUR/m2 (-5.8%)" },
    { id: "dpe", label: "Performance énergétique", score: 7, weight: 12, weighted: 8.4, sentiment: "positive" as const, detail: "DPE C" },
    { id: "risques", label: "Risques naturels", score: 7, weight: 12, weighted: 8.4, sentiment: "positive" as const, detail: "2 risque(s) identifié(s)" },
    { id: "transports", label: "Transports", score: 7, weight: 10, weighted: 7.0, sentiment: "positive" as const, detail: "5 arrêt(s) de transport à proximité (le plus proche à 120 m)" },
    { id: "commerces", label: "Commerces & services", score: 8, weight: 8, weighted: 6.4, sentiment: "positive" as const, detail: "38 commerce(s) et service(s) à proximité" },
    { id: "environnement", label: "Environnement", score: 6, weight: 8, weighted: 4.8, sentiment: "neutral" as const, detail: "Bruit et qualité de l’air non mesurés" },
    { id: "urbanisme", label: "Urbanisme", score: 9, weight: 7, weighted: 6.3, sentiment: "positive" as const, detail: "Zone U illustrative : règlement et projet à vérifier" },
    { id: "ecoles", label: "Écoles", score: 8, weight: 5, weighted: 4.0, sentiment: "positive" as const, detail: "9 établissement(s) scolaire(s) à proximité (1 lycée(s), moy. bac 92%)" },
    { id: "population", label: "Profil socio", score: 7, weight: 5, weighted: 3.5, sentiment: "positive" as const, detail: "Revenu médian élevé (26k), Chômage 7.1%" },
    { id: "taxe_fonciere", label: "Taxe foncière", score: 7, weight: 5, weighted: 3.5, sentiment: "positive" as const, detail: "Taxe foncière ~2 200 EUR/an (0.8% du prix)" },
    { id: "rendement", label: "Rendement locatif", score: 4, weight: 4, weighted: 1.6, sentiment: "neutral" as const, detail: "Rendement brut estimé : 3.7%" },
    { id: "cout", label: "Coût d'acquisition", score: 5, weight: 3, weighted: 1.5, sentiment: "neutral" as const, detail: "Surcoût total : 7.8% du prix" },
    { id: "actualites", label: "Actualités locales", score: 7, weight: 3, weighted: 2.1, sentiment: "positive" as const, detail: "5 article(s) d'actualité locale" },
  ],
  risks: [
    { label: "Inondation", level: "Aucun risque", color: "text-success" },
    { label: "Sismicité", level: "Faible (zone 2)", color: "text-success" },
    { label: "Radon", level: "Faible", color: "text-success" },
    { label: "Retrait-gonflement argiles", level: "Moyen", color: "text-warning" },
  ],
  dpe: "C",
  ges: "B",
  loyer: 890,
  rentalSource: "yield_scenario",
  rendement: 3.7,
  rentalArguments: [
    "Simulation : loyer hypothétique de 890 EUR/mois, faisabilité et encadrement non vérifiés",
    "Prix d'achat : 285 000 EUR pour 68 m2",
    "Prix median local : 4 450 EUR/m2 (142 transactions)",
    "Taxe foncière fictive de 2 200 EUR/an : rendement après cette seule hypothèse, environ 3.0%",
  ],
  roiYears: 26.7,
  rentalProjection: [
    { year: 2027, annual_rent: 10680, roi_pct: 4 },
    { year: 2029, annual_rent: 10680, roi_pct: 11 },
    { year: 2031, annual_rent: 10680, roi_pct: 19 },
    { year: 2036, annual_rent: 10680, roi_pct: 37 },
  ],
  yieldNet: 3.0,
  trend5y: "+18%",
  volumeTransactions: 142,
  // Urbanisme & PLU
  zonePlu: "U",
  constructible: true,
  zonePluLibelle: "Zone urbaine",
  zonePluLibelleLong: "Zone urbaine mixte a dominante residentielle",
  // Environnement (structure exacte du ReportPage)
  environment: {
    noise: {
      level: "Modéré",
      db_estimate: null,
      sources: ["Route departementale a 180m"],
      source: "simulation",
    },
    air_quality: null,
  },
  // Actualites locales (structure exacte: {articles: [...], city, google_news_url})
  localNews: {
    city: "Lyon",
    google_news_url: "https://news.google.com/search?q=immobilier+lyon+3e&hl=fr",
    articles: [
      { title: "Lyon 3e : le nouveau tramway T6 bientôt en service", source: "Exemple fictif", published_at: "2026-02-10", url: "#", category_label: "Transports" },
      { title: "Immobilier Lyon : les prix se stabilisent dans le 3e arrondissement", source: "Exemple fictif", published_at: "2026-01-28", url: "#", category_label: "Immobilier" },
      { title: "Part-Dieu 2 : le chantier de requalification avance", source: "Exemple fictif", published_at: "2026-01-15", url: "#", category_label: "Urbanisme" },
      { title: "Lyon 3e : ouverture d'un nouveau groupe scolaire", source: "Exemple fictif", published_at: "2025-12-20", url: "#", category_label: "Éducation" },
      { title: "Quartier Voltaire : un nouveau parc urbain en projet", source: "Exemple fictif", published_at: "2025-12-05", url: "#", category_label: "Vie locale" },
    ],
  },
  // Portrait socio (noms de champs exactement comme dans ReportPage)
  socio: {
    population: 160215,
    revenu_median: 26400,
    taux_chomage: 7.1,
    densite: 10850,
    pct_proprietaires: 42,
    pct_locataires: 56,
    annee_reference: "2021",
  },
  // Cout acquisition (noms de champs exactement comme dans ReportPage)
  acquisitionCost: {
    frais_agence_status: "included",
    frais_agence_note: "Prix FAI : honoraires déjà inclus, aucun ajout au budget.",
    prix: 285000,
    frais_notaire: 22230,
    frais_notaire_pct: 7.8,
    frais_agence: 0,
    frais_agence_pct: 0,
    travaux_estimes: 0,
    cout_total: 307230,
    cout_total_avec_travaux: 307230,
    taxe_fonciere_annuelle: 2200,
  },
  // Taxe fonciere
  taxeFonciere: {
    estimation_annuelle: 2200,
    taux_communal: 28.5,
    taux_departemental: 15.2,
    source: "simulation",
    annee_reference: 2024,
  },
  // Historique (noms de champs exactement comme dans ReportPage)
  history: {
    previous_sales: [
      { date: "2019-06-15", price: 235000, surface: 68, price_sqm: 3456, type: "Vente" },
      { date: "2014-03-22", price: 195000, surface: 68, price_sqm: 2868, type: "Vente" },
    ],
    plus_value_pct: 21.3,
    duree_detention_ans: 5,
    nb_mutations: 142,
  },
  // Passoire énergétique
  isPassoire: false,
};

// Same evidence policy as live reports: simulation and news do not increase the score.
const excludedDemoScores = new Set(["taxe_fonciere", "rendement", "actualites", "environnement"]);
demoReport.sectionScores = demoReport.sectionScores.filter(section => !excludedDemoScores.has(section.id));
const demoAvailableWeight = demoReport.sectionScores.reduce((sum, section) => sum + section.weight, 0);
demoReport.sectionScores = demoReport.sectionScores.map(section => ({ ...section,
  weight: section.weight * 100 / demoAvailableWeight,
  weighted: section.score * section.weight * 10 / demoAvailableWeight,
}));
demoReport.score = Math.round(demoReport.sectionScores.reduce((sum, section) => sum + section.weighted, 0));

export const demoMatch: MatchData = {
  matchScore: 82,
  criteria: [
    { label: "Budget", score: 100, status: "match", detail: "285 000 € dans ta fourchette 200-350k" },
    { label: "Type de bien", score: 100, status: "match", detail: "Appartement (recherché)" },
    { label: "Localisation", score: 100, status: "match", detail: "Lyon 3e (ville ciblée)" },
    { label: "Surface", score: 70, status: "partial", detail: "68 m² (tu cherches 70 m²+)" },
    { label: "Pièces", score: 100, status: "match", detail: "3 pièces (tu cherches 2+)" },
    { label: "DPE", score: 100, status: "match", detail: "DPE C (max accepté : D)" },
  ],
};

export interface NeighborhoodSection {
  id: string;
  icon: string;
  title: string;
  indicator?: { label: string; level: "green" | "orange" | "red" };
  items: { label: string; value: string; distance?: string }[];
  source: string;
}

export const demoNeighborhood: NeighborhoodSection[] = [
  {
    id: "education",
    icon: "🏫",
    title: "Écoles & Éducation",
    indicator: { label: "Bien doté en établissements scolaires", level: "green" },
    items: [
      { label: "Crèche Les Petits Lutins", value: "Micro-crèche · 12 places", distance: "280m" },
      { label: "Crèche municipale Voltaire", value: "Crèche collective · 40 places", distance: "550m" },
      { label: "École maternelle Jean Jaurès", value: "Maternelle publique", distance: "320m" },
      { label: "École maternelle Lacassagne", value: "Maternelle publique", distance: "650m" },
      { label: "École maternelle Montbrillant", value: "Maternelle publique", distance: "780m" },
      { label: "École élémentaire Voltaire", value: "Primaire publique", distance: "400m" },
      { label: "École élémentaire Condorcet", value: "Primaire publique", distance: "850m" },
      { label: "Collège Professeur Dargent", value: "Taux de réussite au brevet : 89%", distance: "1.2km" },
      { label: "Lycée Lacassagne", value: "Taux de réussite au bac : 92%", distance: "1.8km" },
    ],
    source: "Exemple fictif — établissements et distances illustratifs",
  },
  {
    id: "health",
    icon: "🏥",
    title: "Santé & Services Médicaux",
    indicator: { label: "Zone correctement dotée en médecins", level: "green" },
    items: [
      { label: "Médecins généralistes", value: "4 praticiens dans un rayon d'1 km" },
      { label: "Pharmacie de la Place", value: "Pharmacie", distance: "200m" },
      { label: "Pharmacie Gambetta", value: "Pharmacie", distance: "480m" },
      { label: "Cabinet dentaire Dr. Martin", value: "Dentiste", distance: "350m" },
      { label: "Dr. Lefebvre", value: "Pédiatre", distance: "600m" },
      { label: "Hôpital Édouard Herriot", value: "CHU · Urgences 24h/24 · 12 min en voiture", distance: "3.2km" },
    ],
    source: "Exemple fictif — services et distances illustratifs",
  },
  {
    id: "shops",
    icon: "🛒",
    title: "Commerces & Vie Pratique",
    indicator: { label: "Quartier bien doté en commerces", level: "green" },
    items: [
      { label: "Boulangerie du Cours", value: "Boulangerie-pâtisserie", distance: "90m" },
      { label: "Carrefour City", value: "Supermarché", distance: "280m" },
      { label: "Pharmacie de la Place", value: "Pharmacie", distance: "200m" },
      { label: "La Poste Lyon 3", value: "Bureau de poste + relais colis", distance: "320m" },
      { label: "Crédit Mutuel", value: "Banque + distributeur", distance: "250m" },
      { label: "Marché de la Place Voltaire", value: "Mercredi & samedi matin", distance: "400m" },
      { label: "Restaurants & cafés", value: "18 établissements dans un rayon de 500m" },
    ],
    source: "Exemple fictif — données et distances illustratives",
  },
  {
    id: "transport",
    icon: "🚇",
    title: "Transports & Mobilité",
    indicator: { label: "Très bien desservi", level: "green" },
    items: [
      { label: "Métro B - Place Guichard", value: "Ligne B (Charpennes / Saint-Genis-Laval Hôpital Lyon Sud)", distance: "350m" },
      { label: "Bus C13", value: "Arrêt Voltaire - vers Part-Dieu / Gerland", distance: "120m" },
      { label: "Gare Lyon Part-Dieu", value: "TGV · TER · accès direct métro B", distance: "2.1km" },
      { label: "Centre-ville Presqu'île", value: "12 min en transport · 8 min en voiture (heure de pointe)", },
      { label: "Piste cyclable Cours Gambetta", value: "Voie cyclable sécurisée", distance: "150m" },
      { label: "Autoroute A43", value: "Accès voie rapide", distance: "3.5km" },
    ],
    source: "TCL pour la ligne B ; autres données et distances fictives",
  },
  {
    id: "environment",
    icon: "🌳",
    title: "Cadre de Vie & Environnement",
    indicator: { label: "Urbain avec quelques nuisances", level: "orange" },
    items: [
      { label: "Parc Bazin", value: "Parc arboré · jeux enfants", distance: "400m" },
      { label: "Jardin Villemanzy", value: "Espace vert", distance: "1.2km" },
      { label: "Parc de la Tête d'Or", value: "Grand parc urbain · zoo · lac", distance: "3.8km" },
      { label: "Qualité de l'air", value: "Aucune mesure vérifiée dans cet exemple" },
      { label: "Nuisances sonores", value: "Axe routier illustratif à 180 m ; exposition sonore non mesurée." },
      { label: "Antennes relais", value: "2 antennes dans un rayon de 300m (information factuelle)" },
      { label: "Propreté des espaces publics", value: "À vérifier sur place" },
    ],
    source: "Exemple fictif — données et distances illustratives",
  },
  {
    id: "security",
    icon: "🔒",
    title: "Sécurité & Tranquillité",
    indicator: { label: "À vérifier sur place", level: "green" },
    items: [
      { label: "Taux de délinquance", value: "Non mesuré dans cet exemple" },
      { label: "Commissariat du 3e arr.", value: "Commissariat de police", distance: "800m" },
      { label: "Caserne de pompiers Corneille", value: "Centre de secours", distance: "1.1km" },
      { label: "Quartier prioritaire (QPV)", value: "Périmètre à vérifier. Le classement QPV ne mesure pas la sécurité ou la tranquillité." },
    ],
    source: "Exemple fictif — données et distances illustratives",
  },
  {
    id: "projects",
    icon: "🏗️",
    title: "Projets & Évolutions du Quartier",
    indicator: { label: "Quartier en développement", level: "green" },
    items: [
      { label: "Tendance des prix (5 ans)", value: "+18% sur le quartier Lyon 3e" },
      { label: "Volume de transactions", value: "Échantillon fictif de 142 ventes, rayon illustratif de 2 km" },
      { label: "Tendance démographique", value: "Croissance modérée (+0.8%/an sur la commune)" },
      { label: "Projet urbain Part-Dieu 2", value: "Requalification du quartier de la gare · horizon 2028" },
    ],
    source: "Exemple fictif — données et distances illustratives",
  },
  {
    id: "connectivity",
    icon: "📡",
    title: "Connectivité",
    indicator: { label: "Très bien connecté", level: "green" },
    items: [
      { label: "Fibre optique", value: "Disponible, zone FTTH (fibre jusqu'au logement)" },
      { label: "Débit moyen estimé", value: "≥ 1 Gbit/s descendant" },
      { label: "Couverture mobile", value: "4G/5G disponible (tous opérateurs)" },
    ],
    source: "Exemple fictif — données et distances illustratives",
  },
  {
    id: "leisure",
    icon: "🏊",
    title: "Loisirs & Activités",
    indicator: { label: "Offre variée à proximité", level: "green" },
    items: [
      { label: "Piscine Garibaldi", value: "Piscine municipale · bassin 25m", distance: "900m" },
      { label: "Basic Fit Part-Dieu", value: "Salle de sport", distance: "1.4km" },
      { label: "Terrain de sport Voltaire", value: "Terrain multisports en accès libre", distance: "500m" },
      { label: "UGC Ciné Cité Part-Dieu", value: "Cinéma multiplexe", distance: "2.0km" },
      { label: "Médiathèque du 3e", value: "Bibliothèque municipale", distance: "600m" },
      { label: "Musée des Beaux-Arts", value: "Musée", distance: "3.2km" },
    ],
    source: "Exemple fictif — données et distances illustratives",
  },
];

export const demoHighlights = [
  { icon: "✅", text: "6% sous la médiane illustrative, comparabilité à vérifier", positive: true },
  { icon: "✅", text: "Risques illustratifs : zonage réel à vérifier", positive: true },
  { icon: "✅", text: "Bien desservi (métro à 350m)", positive: true },
  { icon: "⚠️", text: "Axe routier à 180 m : bruit à vérifier", positive: false },
];
