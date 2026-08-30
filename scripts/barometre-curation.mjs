const SCORE_KEYS = [
  "actualites",
  "commerces",
  "cout",
  "dpe",
  "ecoles",
  "environnement",
  "population",
  "prix",
  "rendement",
  "risques",
  "taxe_fonciere",
  "transports",
  "urbanisme",
];

const DEPARTMENT_REGIONS = new Map(Object.entries({
  "01": "Auvergne-Rhône-Alpes", "03": "Auvergne-Rhône-Alpes", "07": "Auvergne-Rhône-Alpes",
  "15": "Auvergne-Rhône-Alpes", "26": "Auvergne-Rhône-Alpes", "38": "Auvergne-Rhône-Alpes",
  "42": "Auvergne-Rhône-Alpes", "43": "Auvergne-Rhône-Alpes", "63": "Auvergne-Rhône-Alpes",
  "69": "Auvergne-Rhône-Alpes", "73": "Auvergne-Rhône-Alpes", "74": "Auvergne-Rhône-Alpes",
  "21": "Bourgogne-Franche-Comté", "25": "Bourgogne-Franche-Comté", "39": "Bourgogne-Franche-Comté",
  "58": "Bourgogne-Franche-Comté", "70": "Bourgogne-Franche-Comté", "71": "Bourgogne-Franche-Comté",
  "89": "Bourgogne-Franche-Comté", "90": "Bourgogne-Franche-Comté",
  "22": "Bretagne", "29": "Bretagne", "35": "Bretagne", "56": "Bretagne",
  "18": "Centre-Val de Loire", "28": "Centre-Val de Loire", "36": "Centre-Val de Loire",
  "37": "Centre-Val de Loire", "41": "Centre-Val de Loire", "45": "Centre-Val de Loire",
  "20": "Corse", "2A": "Corse", "2B": "Corse",
  "08": "Grand Est", "10": "Grand Est", "51": "Grand Est", "52": "Grand Est", "54": "Grand Est",
  "55": "Grand Est", "57": "Grand Est", "67": "Grand Est", "68": "Grand Est", "88": "Grand Est",
  "02": "Hauts-de-France", "59": "Hauts-de-France", "60": "Hauts-de-France", "62": "Hauts-de-France",
  "80": "Hauts-de-France",
  "75": "Île-de-France", "77": "Île-de-France", "78": "Île-de-France", "91": "Île-de-France",
  "92": "Île-de-France", "93": "Île-de-France", "94": "Île-de-France", "95": "Île-de-France",
  "14": "Normandie", "27": "Normandie", "50": "Normandie", "61": "Normandie", "76": "Normandie",
  "16": "Nouvelle-Aquitaine", "17": "Nouvelle-Aquitaine", "19": "Nouvelle-Aquitaine",
  "23": "Nouvelle-Aquitaine", "24": "Nouvelle-Aquitaine", "33": "Nouvelle-Aquitaine",
  "40": "Nouvelle-Aquitaine", "47": "Nouvelle-Aquitaine", "64": "Nouvelle-Aquitaine",
  "79": "Nouvelle-Aquitaine", "86": "Nouvelle-Aquitaine", "87": "Nouvelle-Aquitaine",
  "09": "Occitanie", "11": "Occitanie", "12": "Occitanie", "30": "Occitanie", "31": "Occitanie",
  "32": "Occitanie", "34": "Occitanie", "46": "Occitanie", "48": "Occitanie", "65": "Occitanie",
  "66": "Occitanie", "81": "Occitanie", "82": "Occitanie",
  "44": "Pays de la Loire", "49": "Pays de la Loire", "53": "Pays de la Loire",
  "72": "Pays de la Loire", "85": "Pays de la Loire",
  "04": "Provence-Alpes-Côte d'Azur", "05": "Provence-Alpes-Côte d'Azur",
  "06": "Provence-Alpes-Côte d'Azur", "13": "Provence-Alpes-Côte d'Azur",
  "83": "Provence-Alpes-Côte d'Azur", "84": "Provence-Alpes-Côte d'Azur",
  "971": "Guadeloupe", "972": "Martinique", "973": "Guyane", "974": "La Réunion", "976": "Mayotte",
}));

function isFiniteNumber(value) {
  if (value === null || value === undefined || typeof value === "boolean") return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return Number.isFinite(Number(value));
}

function finiteOrNull(value) {
  return isFiniteNumber(value) ? Number(value) : null;
}

function firstFinite(...values) {
  for (const value of values) {
    const result = finiteOrNull(value);
    if (result !== null) return result;
  }
  return null;
}

function cleanLabel(value, allowed) {
  const normalized = String(value ?? "").trim();
  return allowed.includes(normalized) ? normalized : null;
}

function scoreValue(value) {
  const raw = value && typeof value === "object" ? value.score : value;
  const numeric = finiteOrNull(raw);
  if (numeric === null || numeric < 0 || numeric > 100) return null;
  return Math.round(numeric) / 10;
}

function regionForPostalCode(postalCode) {
  const code = String(postalCode).trim().toUpperCase();
  const key = code.startsWith("97") ? code.slice(0, 3) : code.slice(0, 2);
  const region = DEPARTMENT_REGIONS.get(key);
  if (!region) throw new Error(`Region inconnue pour le code postal ${code}`);
  return region;
}

function propertyType(candidate) {
  const raw = String(
    candidate.property_type
      ?? candidate.report_json?.listing?.property_type
      ?? candidate.report_json?.listing?.type
      ?? candidate.report_json?.property_type
      ?? "",
  ).toLowerCase();
  if (raw.includes("chateau") || raw.includes("château")) return "château";
  if (raw.includes("terrain")) return "terrain";
  if (raw.includes("appart") || raw.includes("studio")) return "appartement";
  if (raw.includes("maison") || raw.includes("villa")) return "maison";
  return "autre";
}

function dpeFor(candidate) {
  const value = String(
    candidate.dpe_label
      ?? candidate.report_json?.energy?.dpe_label
      ?? candidate.report_json?.energy?.dpe
      ?? "",
  ).trim().toUpperCase();
  return /^[A-G]$/.test(value) ? value : null;
}

function buildScoreSections(candidate) {
  return Object.fromEntries(
    SCORE_KEYS.map((key) => [key, scoreValue(candidate.score_breakdown_json?.[key])]),
  );
}

function buildStrengthsAndAlerts({ dpe, scoreSections, grossYield }) {
  const strengths = [];
  const alerts = [];
  if (["A", "B"].includes(dpe)) strengths.push(`DPE ${dpe}`);
  if (["F", "G"].includes(dpe)) alerts.push(`DPE ${dpe} : rénovation énergétique à chiffrer`);
  if (scoreSections.prix >= 7) strengths.push("Positionnement de prix favorable dans la grille analysée");
  if (scoreSections.prix < 4) alerts.push("Positionnement de prix à vérifier face aux références locales");
  if (scoreSections.transports >= 7) strengths.push("Bonne note de desserte dans la grille analysée");
  if (scoreSections.risques < 4) alerts.push("Risques à examiner avant toute décision");
  if (grossYield !== null && grossYield >= 5) strengths.push("Rendement brut estimé supérieur ou égal à 5 %");
  return {
    points_forts: strengths.slice(0, 3),
    alertes_cles: alerts.slice(0, 3),
  };
}

function buildDetails(candidate, dpe) {
  const data = candidate.report_json ?? {};
  const market = data.market ?? {};
  const energy = data.energy ?? {};
  const rental = data.rental ?? {};
  const acquisition = data.acquisition_cost ?? data.acquisition ?? {};
  const tax = data.taxe_fonciere ?? data.tax ?? {};
  const history = data.history ?? {};
  const socio = data.socio ?? data.demographics ?? {};
  const neighborhood = data.neighborhood ?? {};
  const amenities = neighborhood.amenities ?? {};
  const risks = Array.isArray(data.risks) ? data.risks : null;
  const riskSummary = data.risk_summary ?? {};
  const count = (key) => firstFinite(amenities[key]?.count, amenities[key]);
  const foodCount = count("food");
  const shopCount = count("shops");

  return {
    publication: {
      analyzed_at: new Date(candidate.created_at).toISOString().slice(0, 10),
      methodology_version: "current-category-grid-2026-08",
      source_kind: candidate.report_mode === "test" ? "admin-test" : "user-optin",
      sample_policy: "all-eligible-monthly-reports",
    },
    marche: {
      median_m2: firstFinite(market.medianLocal, market.median_sqm),
      p25: finiteOrNull(market.p25),
      p75: finiteOrNull(market.p75),
      comparables: firstFinite(market.nbComparables, market.comparables_count),
      prix_m2: firstFinite(market.pricePerSqm, market.price_sqm),
      diff_pct: firstFinite(market.diffPercent, market.diff_pct),
    },
    energie: {
      dpe,
      ges: cleanLabel(energy.ges_label ?? energy.ges, ["A", "B", "C", "D", "E", "F", "G"]),
      conso: firstFinite(energy.consommation_energie, energy.consumption),
      emission_ges: firstFinite(energy.emission_ges, energy.emissions),
      cout_min: firstFinite(energy.estimated_energy_cost_min, energy.cost_min),
      cout_max: firstFinite(energy.estimated_energy_cost_max, energy.cost_max),
    },
    rendement: {
      brut: firstFinite(rental.yield_gross, rental.grossYield),
      net: firstFinite(rental.yield_net, rental.netYield),
      loyer_estime: firstFinite(rental.estimated_rent, rental.rentEstimate),
      roi_ans: firstFinite(rental.roi_years, rental.roiYears),
    },
    acquisition: {
      prix: firstFinite(acquisition.prix, acquisition.price, candidate.price),
      notaire: firstFinite(acquisition.frais_notaire, acquisition.notaryFees),
      notaire_pct: firstFinite(acquisition.frais_notaire_pct, acquisition.notaryFeesPercent),
      agence: firstFinite(acquisition.frais_agence, acquisition.agencyFees),
      travaux: firstFinite(acquisition.travaux_estimes, acquisition.renovationBudget),
      total: firstFinite(acquisition.cout_total_avec_travaux, acquisition.totalCost),
    },
    taxe: {
      annuelle: firstFinite(tax.estimation_annuelle, tax.propertyTax),
      taux_communal: firstFinite(tax.taux_communal, tax.localRate),
      annee: firstFinite(tax.annee_reference, tax.referenceYear),
    },
    historique: {
      nb_mutations: firstFinite(history.nb_mutations, history.salesCount),
      plus_value_pct: firstFinite(history.plus_value_pct, history.capitalGainPercent),
      duree_detention_ans: firstFinite(history.duree_detention_ans, history.holdingYears),
    },
    demographie: {
      population: finiteOrNull(socio.population),
      densite: finiteOrNull(socio.densite ?? socio.density),
      revenu_median: finiteOrNull(socio.revenu_median ?? socio.medianIncome),
      pct_locataires: finiteOrNull(socio.pct_locataires ?? socio.renterPercent),
      pct_proprietaires: finiteOrNull(socio.pct_proprietaires ?? socio.ownerPercent),
      annee: finiteOrNull(socio.annee_reference ?? socio.referenceYear),
    },
    quartier: {
      commerces: foodCount === null && shopCount === null
        ? null
        : (foodCount ?? 0) + (shopCount ?? 0),
      transports: count("transport"),
      sante: count("health"),
      loisirs: count("leisure"),
      services: count("services"),
      ecoles: firstFinite(neighborhood.schools?.count, neighborhood.schools_count),
    },
    risques: {
      count: firstFinite(riskSummary.risk_count, risks?.length),
      level: cleanLabel(String(riskSummary.level ?? "").toLowerCase(), ["faible", "modere", "moyen", "fort"]),
    },
  };
}

export function validateMonth(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(value ?? ""))) {
    throw new Error("Le mois doit respecter YYYY-MM");
  }
  return String(value);
}

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/m²/gi, "m2")
    .replace(/(\d+)\s+m2/gi, "$1m2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function isEligibleReport(candidate) {
  if (candidate?.status !== "success") return { eligible: false, reason: "status-not-success" };
  if (candidate?.deleted_at) return { eligible: false, reason: "deleted" };
  if (candidate?.report_mode === "test" && candidate?.owner_is_admin !== true) {
    return { eligible: false, reason: "test-owner-not-admin" };
  }
  if (candidate?.report_mode !== "test" && candidate?.barometre_optin !== true) {
    return { eligible: false, reason: "missing-optin" };
  }
  if (typeof candidate?.city !== "string" || !candidate.city.trim()) return { eligible: false, reason: "missing-city" };
  if (!/^([0-8]\d|9[0-8])\d{3}$/.test(String(candidate?.postal_code ?? ""))) return { eligible: false, reason: "missing-postal-code" };
  if (!isFiniteNumber(candidate?.surface) || Number(candidate.surface) <= 0) return { eligible: false, reason: "invalid-surface" };
  if (!isFiniteNumber(candidate?.price) || Number(candidate.price) <= 0) return { eligible: false, reason: "invalid-price" };
  if (!isFiniteNumber(candidate?.score_total) || Number(candidate.score_total) < 0 || Number(candidate.score_total) > 100) {
    return { eligible: false, reason: "invalid-score" };
  }
  const scores = buildScoreSections(candidate);
  if (Object.values(scores).some((value) => value === null)) return { eligible: false, reason: "incomplete-score-grid" };
  if (!candidate?.report_json || typeof candidate.report_json !== "object" || Object.keys(candidate.report_json).length === 0) {
    return { eligible: false, reason: "missing-structured-report" };
  }
  if (!dpeFor(candidate)) return { eligible: false, reason: "invalid-dpe" };
  if (!candidate?.created_at || Number.isNaN(new Date(candidate.created_at).valueOf())) {
    return { eligible: false, reason: "invalid-analysis-date" };
  }
  return { eligible: true, reason: null };
}

export function buildBarometreRow(candidate, { month }) {
  const normalizedMonth = validateMonth(month);
  const eligibility = isEligibleReport(candidate);
  if (!eligibility.eligible) throw new Error(`Rapport ineligible: ${eligibility.reason}`);
  const analysisMonth = new Date(candidate.created_at).toISOString().slice(0, 7);
  if (analysisMonth !== normalizedMonth) throw new Error(`Rapport hors du mois ${normalizedMonth}`);

  const type = propertyType(candidate);
  const surface = Number(candidate.surface);
  const price = Number(candidate.price);
  const dpe = dpeFor(candidate);
  const scoreSections = buildScoreSections(candidate);
  const details = buildDetails(candidate, dpe);
  const summary = buildStrengthsAndAlerts({
    dpe,
    scoreSections,
    grossYield: details.rendement.brut,
  });
  const slug = slugify(
    `${candidate.city} ${type} ${Math.round(surface)}m2 ${Math.round(price / 1000)}k ${normalizedMonth}`,
  );

  return {
    mois: normalizedMonth,
    ville: candidate.city.trim(),
    code_postal: String(candidate.postal_code),
    region: regionForPostalCode(candidate.postal_code),
    type_bien: type,
    surface,
    prix_demande: price,
    score_global: Number(candidate.score_total),
    score_sections: scoreSections,
    dpe,
    alertes_cles: summary.alertes_cles,
    points_forts: summary.points_forts,
    verdict: "Instantané indicatif d'une annonce analysée. Vérifier le bien, les pièces et le financement avant toute décision.",
    is_edito: false,
    slug,
    publie: true,
    source_report_id: candidate.id,
    details_json: details,
  };
}

export function curateReports(candidates, { month, existingRows = [] }) {
  const normalizedMonth = validateMonth(month);
  const existingSources = new Set(existingRows.map((row) => row.source_report_id).filter(Boolean));
  const existingSlugs = new Set(existingRows.map((row) => row.slug).filter(Boolean));
  const rows = [];
  const rejected = [];

  for (const candidate of candidates) {
    const eligibility = isEligibleReport(candidate);
    if (!eligibility.eligible) {
      rejected.push({ id: candidate.id, reason: eligibility.reason });
      continue;
    }
    if (new Date(candidate.created_at).toISOString().slice(0, 7) !== normalizedMonth) {
      rejected.push({ id: candidate.id, reason: "outside-month" });
      continue;
    }
    if (existingSources.has(candidate.id)) throw new Error(`Source deja publiee: ${candidate.id}`);
    const row = buildBarometreRow(candidate, { month: normalizedMonth });
    if (existingSlugs.has(row.slug) || rows.some((item) => item.slug === row.slug)) {
      throw new Error(`Collision de slug: ${row.slug}`);
    }
    rows.push(row);
  }

  rows.sort((a, b) => a.slug.localeCompare(b.slug, "fr"));
  rejected.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return { month: normalizedMonth, rows, rejected };
}
