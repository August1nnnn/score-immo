import { LOT_2_LINKS } from './curated-internal-links-lot2.js';

const RULES = new Map([
  ['guides/dpe-comprendre-classes-energetiques', [{
    href: '/blogs/guides/acheter-bien-dpe-vierge-risques',
    needle: '<p>Non, depuis juillet 2021, tous les DPE doivent obligatoirement afficher une classe de A à G. Les DPE "vierges" ou "non renseignés" de l\'ancien système ne sont plus valides. Si un bien n\'a pas de classe, un nouveau diagnostic doit être réalisé.</p>',
    replacement: '<p>Non, depuis juillet 2021, tous les DPE doivent obligatoirement afficher une classe de A à G. Les DPE "vierges" ou "non renseignés" de l\'ancien système ne sont plus valides. Si un bien n\'a pas de classe, un nouveau diagnostic doit être réalisé. Pour approfondir, consultez notre guide pour <a href="/blogs/guides/acheter-bien-dpe-vierge-risques">acheter un bien avec un DPE vierge</a>.</p>',
  }, {
    href: '/blogs/guides/dpe-2026-impact-reel-prix-vente-d-bien',
    needle: 'pour estimer précisément l\'impact du DPE sur le prix.',
    replacement: 'pour estimer précisément l\'<a href="/blogs/guides/dpe-2026-impact-reel-prix-vente-d-bien">impact réel du DPE sur le prix de vente</a>.',
  }]],
  ['guides/negocier-prix-bien-immobilier-guide-complet', [{
    href: '/blogs/guides/frais-agence-immobiliere-negocier',
    needle: '<p>Les frais d\'agence sont généralement à la charge du vendeur et difficiles à négocier directement. Cependant, vous pouvez demander au vendeur d\'intégrer ces frais dans sa marge de négociation sur le prix de vente, particulièrement si vous présentez un dossier solide et rapide.</p>',
    replacement: '<p>Les frais d\'agence sont généralement à la charge du vendeur et difficiles à négocier directement. Cependant, vous pouvez demander au vendeur d\'intégrer ces frais dans sa marge de négociation sur le prix de vente, particulièrement si vous présentez un dossier solide et rapide. Consultez aussi notre méthode pour <a href="/blogs/guides/frais-agence-immobiliere-negocier">négocier les frais d\'agence</a>.</p>',
  }]],
  ['guides/frais-agence-immobiliere-negocier', [{
    href: '/blogs/guides/negocier-prix-bien-immobilier-guide-complet',
    needle: '<p>Les frais d\'agence font partie de votre budget réel d\'acquisition, au même titre que les frais de notaire. Additionnez-les dans votre <a href="/blogs/guides/cout-total-achat-immobilier">coût total d\'achat</a>, et vérifiez que le prix du bien (hors honoraires) est cohérent avec le marché grâce à l\'<a href="https://app.score-immo.fr">analyse ScoreImmo</a>.</p>',
    replacement: '<p>Les frais d\'agence font partie de votre budget réel d\'acquisition, au même titre que les frais de notaire. Additionnez-les dans votre <a href="/blogs/guides/cout-total-achat-immobilier">coût total d\'achat</a>, et vérifiez que le prix du bien (hors honoraires) est cohérent avec le marché grâce à l\'<a href="https://app.score-immo.fr">analyse ScoreImmo</a>. Vous pouvez ensuite <a href="/blogs/guides/negocier-prix-bien-immobilier-guide-complet">préparer votre stratégie de négociation du prix</a>.</p>',
  }]],
  ['guides/syndic-benevole-avantages-limites-conditions-legales', [{
    href: '/blogs/guides/analyser-pv-ag-copropriete-avant-achat',
    needle: '<p>La désignation du syndic bénévole est votée à la <strong>majorité de l\'article 25</strong> de la loi du 10 juillet 1965. Le procès-verbal doit mentionner clairement le nom du syndic désigné, la durée de son mandat (maximum trois ans) et les conditions de sa rémunération éventuelle (généralement nulle).</p>',
    replacement: '<p>La désignation du syndic bénévole est votée à la <strong>majorité de l\'article 25</strong> de la loi du 10 juillet 1965. Le procès-verbal doit mentionner clairement le nom du syndic désigné, la durée de son mandat (maximum trois ans) et les conditions de sa rémunération éventuelle (généralement nulle). Avant un achat, pensez à <a href="/blogs/guides/analyser-pv-ag-copropriete-avant-achat">vérifier le procès-verbal d\'assemblée générale</a>.</p>',
  }]],
  ['guides/analyser-pv-ag-copropriete-avant-achat', [{
    href: '/blogs/guides/syndic-benevole-avantages-limites-conditions-legales',
    needle: '<p>Le vendeur, via le syndic, doit transmettre les documents de copropriété exigés par la loi (PV d\'AG récents, carnet d\'entretien, montant des charges, fonds de travaux), annexés à la promesse de vente. N\'hésitez pas à les réclamer en amont de l\'offre.</p>',
    replacement: '<p>Le vendeur, via le syndic, doit transmettre les documents de copropriété exigés par la loi (PV d\'AG récents, carnet d\'entretien, montant des charges, fonds de travaux), annexés à la promesse de vente. N\'hésitez pas à les réclamer en amont de l\'offre. Dans une copropriété autogérée, vérifiez aussi les <a href="/blogs/guides/syndic-benevole-avantages-limites-conditions-legales">obligations d\'un syndic bénévole</a>.</p>',
  }]],
  ['villes/prix-immobilier-bordeaux-quartiers-tendances', [{
    href: '/blogs/quartiers/bordeaux-rive-droite-immobilier',
    needle: '<p>La Bastide reste le dernier secteur abordable intra-muros. Le projet de liaison tramway Pont de Pierre - Gare Saint-Jean (livraison 2027) pourrait relancer ce marché. Les <em>maisons de ville</em> y sont 35% moins chères qu\'en rive gauche.</p>',
    replacement: '<p>La Bastide reste le dernier secteur abordable intra-muros. Le projet de liaison tramway Pont de Pierre - Gare Saint-Jean (livraison 2027) pourrait relancer ce marché. Les <em>maisons de ville</em> y sont 35% moins chères qu\'en rive gauche. Approfondissez avec notre <a href="/blogs/quartiers/bordeaux-rive-droite-immobilier">guide de la Rive Droite : Bastide, Floirac et Cenon</a>.</p>',
  }]],
  ['villes/prix-immobilier-strasbourg-marche-frontalier', [{
    href: '/blogs/quartiers/micro-quartiers-strasbourg-achat-authentique',
    needle: '<strong>Neudorf-Schluthfeld</strong> : 3 350€/m² (+2,8% en 1 an)</li>\n</ol>',
    replacement: '<strong>Neudorf-Schluthfeld</strong> : 3 350€/m² (+2,8% en 1 an)</li>\n</ol>\n\n<p>Découvrez aussi notre analyse des <a href="/blogs/quartiers/micro-quartiers-strasbourg-achat-authentique">micro-quartiers de Strasbourg</a>.</p>',
  }]],
  ['quartiers/micro-quartiers-strasbourg-achat-authentique', [{
    href: '/blogs/villes/prix-immobilier-strasbourg-marche-frontalier',
    needle: '<p>Environ 3 707 euros le m² pour un appartement et 3 561 euros pour une maison. Les micro-quartiers de charme abordables se situent sous cette moyenne, tandis que les secteurs chics la dépassent largement.</p>',
    replacement: '<p>Environ 3 707 euros le m² pour un appartement et 3 561 euros pour une maison. Les micro-quartiers de charme abordables se situent sous cette moyenne, tandis que les secteurs chics la dépassent largement. Consultez le contexte complet du <a href="/blogs/villes/prix-immobilier-strasbourg-marche-frontalier">prix immobilier à Strasbourg en 2026</a>.</p>',
  }]],
  ['guides/loi-pinel-2026-conditions-plafonds-alternatives', [{
    href: '/blogs/guides/dispositif-denormandie-2026-renover-l-ancien-defiscaliser',
    needle: '<p>Le Denormandie vise certains logements anciens faisant l\'objet de travaux dans des communes éligibles. Le projet doit respecter des conditions précises portant notamment sur la localisation, les travaux, la location et les plafonds. Avant de signer, vérifie la commune sur une source officielle, fais chiffrer les travaux et contrôle que le calendrier est réaliste.</p>',
    replacement: '<p>Le Denormandie vise certains logements anciens faisant l\'objet de travaux dans des communes éligibles. Le projet doit respecter des conditions précises portant notamment sur la localisation, les travaux, la location et les plafonds. Avant de signer, vérifie la commune sur une source officielle, fais chiffrer les travaux et contrôle que le calendrier est réaliste. Consulte notre <a href="/blogs/guides/dispositif-denormandie-2026-renover-l-ancien-defiscaliser">guide complet du dispositif Denormandie 2026</a>.</p>',
  }]],
  ['guides/dispositif-denormandie-2026-renover-l-ancien-defiscaliser', [{
    href: '/blogs/guides/loi-pinel-2026-conditions-plafonds-alternatives',
    needle: '<p>Le dispositif Denormandie a été créé par la loi de finances pour 2019, portée par l\'alors ministre du Logement Julien Denormandie. Son objectif affiché était simple : inciter les investisseurs privés à rénover des logements vétustes dans des villes moyennes confrontées à une vacance locative élevée et à une dégradation du bâti ancien. En 2026, ce dispositif est ouvert jusqu\'au <strong>31 décembre 2027</strong>, ce qui en fait l\'une des dernières fenêtres ouvertes pour bénéficier d\'un avantage fiscal significatif sur l\'immobilier locatif.</p>',
    replacement: '<p>Le dispositif Denormandie a été créé par la loi de finances pour 2019, portée par l\'alors ministre du Logement Julien Denormandie. Son objectif affiché était simple : inciter les investisseurs privés à rénover des logements vétustes dans des villes moyennes confrontées à une vacance locative élevée et à une dégradation du bâti ancien. En 2026, ce dispositif est ouvert jusqu\'au <strong>31 décembre 2027</strong>, ce qui en fait l\'une des dernières fenêtres ouvertes pour bénéficier d\'un avantage fiscal significatif sur l\'immobilier locatif. Replacez ce dispositif parmi les <a href="/blogs/guides/loi-pinel-2026-conditions-plafonds-alternatives">alternatives au Pinel en 2026</a>.</p>',
  }]],
  ['guides/achat-immobilier-montagne-specificites', [{
    href: '/blogs/villes/prix-immobilier-annecy-2026-lac-frontiere-suisse-tension',
    needle: '<p>Acheter un appartement à la montagne, c\'est conjuguer plaisir et investissement, mais aussi composer avec des règles et des coûts spécifiques. Loi Montagne, charges élevées, risques naturels, fiscalité de la location saisonnière : voici tout ce qu\'il faut savoir avant d\'acheter en station.</p>',
    replacement: '<p>Acheter un appartement à la montagne, c\'est conjuguer plaisir et investissement, mais aussi composer avec des règles et des coûts spécifiques. Loi Montagne, charges élevées, risques naturels, fiscalité de la location saisonnière : voici tout ce qu\'il faut savoir avant d\'acheter en station.</p>\n\n<p>Pour compléter cette lecture avec un marché alpin concret, consultez notre analyse du <a href="/blogs/villes/prix-immobilier-annecy-2026-lac-frontiere-suisse-tension">marché immobilier d\'Annecy</a>.</p>',
  }]],
  ['quartiers/meilleurs-quartiers-acheter-lyon', [{
    href: '/blogs/quartiers/ou-habiter-pres-de-lyon',
    needle: 'Le 9e reste le moins cher (3 760 €), tandis que Villeurbanne atteint 5 à 6% de rendement brut.',
    replacement: 'Le 9e reste le moins cher (3 760 €), tandis que Villeurbanne atteint 5 à 6% de rendement brut. Pour comparer Lyon aux communes voisines, consultez notre guide pour savoir <a href="/blogs/quartiers/ou-habiter-pres-de-lyon">où habiter près de Lyon</a>.',
  }]],
  ['quartiers/meilleurs-quartiers-acheter-reims-2026', [{
    href: '/blogs/villes/prix-immobilier-reims-2026-champagne-tgv-paris',
    needle: 'Aucun discours commercial, uniquement des faits vérifiables.</p>',
    replacement: 'Aucun discours commercial, uniquement des faits vérifiables. Pour replacer ces écarts dans leur contexte, consulte aussi notre analyse du <a href="/blogs/villes/prix-immobilier-reims-2026-champagne-tgv-paris">marché immobilier de Reims</a>.</p>',
  }]],
  ['guides/investissement-locatif-rentabilite-fiscalite-villes', [{
    href: '/blogs/villes/prix-immobilier-reims-2026-champagne-tgv-paris',
    needle: '<strong>Reims</strong> : proximité Paris et prix attractifs</li>',
    replacement: '<strong><a href="/blogs/villes/prix-immobilier-reims-2026-champagne-tgv-paris">Reims</a></strong> : proximité Paris et prix attractifs</li>',
  }]],
  ['guides/visite-immobiliere-checklist-points-verifier', [{
    href: '/blogs/guides/acheter-appartement-dernier-etage',
    needle: '<strong>État de la charpente</strong> : vérifiez les combles si accessibles</li>',
    replacement: '<strong>État de la charpente</strong> : vérifiez les combles si accessibles et, pour les biens concernés, les points propres à un <a href="/blogs/guides/acheter-appartement-dernier-etage">achat au dernier étage</a></li>',
  }]],
  ['guides/terrain-constructible-plu-permis-pieges-cadastre', [{
    href: '/blogs/guides/etude-de-sol-g1-obligatoire-achat-terrain',
    needle: '<strong>étude géotechnique préalable de type G1</strong>',
    replacement: '<a href="/blogs/guides/etude-de-sol-g1-obligatoire-achat-terrain"><strong>étude géotechnique préalable de type G1</strong></a>',
  }]],
  ['guides/dossier-diagnostic-technique-ddt-checklist-acheteur', [{
    href: '/blogs/guides/diagnostic-assainissement-non-collectif-achat',
    needle: '<strong>Assainissement non collectif</strong> : biens non raccordés au tout-à-l\'égout. Valable 3 ans.</li>',
    replacement: '<a href="/blogs/guides/diagnostic-assainissement-non-collectif-achat"><strong>Assainissement non collectif</strong></a> : biens non raccordés au tout-à-l\'égout. Valable 3 ans.</li>',
  }]],
  ['guides/copropriete-charges-pieges-detecter-achat', [{
    href: '/blogs/guides/syndic-benevole-avantages-limites-conditions-legales',
    needle: '<p>Le <strong>syndic de copropriété</strong> joue un rôle déterminant dans la valorisation de votre bien et l\'évolution de vos charges. Une gestion rigoureuse maintient les coûts sous contrôle et préserve le patrimoine commun, tandis qu\'un syndic défaillant peut faire exploser vos charges et dégrader votre investissement.</p>',
    replacement: '<p>Le <strong>syndic de copropriété</strong> joue un rôle déterminant dans la valorisation de votre bien et l\'évolution de vos charges. Une gestion rigoureuse maintient les coûts sous contrôle et préserve le patrimoine commun, tandis qu\'un syndic défaillant peut faire exploser vos charges et dégrader votre investissement. Si la copropriété est autogérée, vérifiez aussi les <a href="/blogs/guides/syndic-benevole-avantages-limites-conditions-legales">conditions et limites d\'un syndic bénévole</a>.</p>',
  }]],
  ['quartiers/meilleurs-quartiers-acheter-rennes', [{
    href: '/blogs/villes/prix-immobilier-rennes-boom-breton',
    needle: 'Tu découvriras ici une analyse quartier par quartier croisant DVF, ADEME et 7 autres sources officielles pour cibler ton profil précis.</p>',
    replacement: 'Tu découvriras ici une analyse quartier par quartier croisant DVF, ADEME et 7 autres sources officielles pour cibler ton profil précis. Pour le contexte général, consulte aussi notre analyse du <a href="/blogs/villes/prix-immobilier-rennes-boom-breton">prix immobilier à Rennes</a>.</p>',
  }]],
  ['villes/prix-immobilier-paris-marche-plancher', [{
    href: '/blogs/quartiers/meilleurs-quartiers-acheter-paris',
    needle: 'Tu découvriras ici les zones où le plancher est réellement atteint et celles qui résistent encore.</p>',
    replacement: 'Tu découvriras ici les zones où le plancher est réellement atteint et celles qui résistent encore. Pour passer de la tendance générale au choix d\'une adresse, consulte les <a href="/blogs/quartiers/meilleurs-quartiers-acheter-paris">meilleurs quartiers où acheter à Paris</a>.</p>',
  }]],
  ['quartiers/meilleurs-quartiers-acheter-lille', [{
    href: '/blogs/villes/prix-immobilier-lille-metropole-sous-cotee',
    needle: '<p>Entre les quartiers historiques du Vieux-Lille aux pavés authentiques et les secteurs émergents comme Euralille, chaque zone possède sa personnalité et ses opportunités d\'investissement. Les dernières données <abbr title="Demande de Valeurs Foncières">DVF</abbr> révèlent des écarts de prix pouvant atteindre 2 000 €/m² entre les arrondissements, rendant crucial le choix de votre future adresse.</p>',
    replacement: '<p>Entre les quartiers historiques du Vieux-Lille aux pavés authentiques et les secteurs émergents comme Euralille, chaque zone possède sa personnalité et ses opportunités d\'investissement. Les dernières données <abbr title="Demande de Valeurs Foncières">DVF</abbr> révèlent des écarts de prix pouvant atteindre 2 000 €/m² entre les arrondissements, rendant crucial le choix de votre future adresse. Pour replacer ces écarts dans la tendance générale, consultez notre analyse du <a href="/blogs/villes/prix-immobilier-lille-metropole-sous-cotee">prix immobilier à Lille</a>.</p>',
  }]],
]);

for (const { from, ...rule } of LOT_2_LINKS) {
  RULES.set(from, [...(RULES.get(from) || []), rule]);
}

export function applyCuratedInternalLinks(articleKey, html) {
  let result = html || '';
  for (const rule of RULES.get(articleKey) || []) {
    const existingLinks = result.split(`href="${rule.href}"`).length - 1;
    if (existingLinks === 1) continue;
    if (existingLinks > 1) {
      throw new Error(`Duplicate curated link ${articleKey} -> ${rule.href}`);
    }
    const insertionPoints = result.split(rule.needle).length - 1;
    if (insertionPoints !== 1) {
      throw new Error(`Curated link insertion point changed for ${articleKey} -> ${rule.href}`);
    }
    const replacement = rule.replacement ?? `${rule.needle}${rule.insertion || ''}`;
    result = result.replace(rule.needle, replacement);
  }
  return result;
}
