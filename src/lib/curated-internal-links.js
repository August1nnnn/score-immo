const RULES = new Map([
  ['guides/dpe-comprendre-classes-energetiques', [{
    href: '/blogs/guides/acheter-bien-dpe-vierge-risques',
    needle: '<p>Non, depuis juillet 2021, tous les DPE doivent obligatoirement afficher une classe de A à G. Les DPE "vierges" ou "non renseignés" de l\'ancien système ne sont plus valides. Si un bien n\'a pas de classe, un nouveau diagnostic doit être réalisé.</p>',
    replacement: '<p>Non, depuis juillet 2021, tous les DPE doivent obligatoirement afficher une classe de A à G. Les DPE "vierges" ou "non renseignés" de l\'ancien système ne sont plus valides. Si un bien n\'a pas de classe, un nouveau diagnostic doit être réalisé. Pour approfondir, consultez notre guide pour <a href="/blogs/guides/acheter-bien-dpe-vierge-risques">acheter un bien avec un DPE vierge</a>.</p>',
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
]);

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
    result = result.replace(rule.needle, rule.replacement);
  }
  return result;
}
