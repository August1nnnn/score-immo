export const SUPPORTED_PORTAL_HOSTS = [
  "leboncoin.fr",
  "seloger.com",
  "bienici.com",
  "pap.fr",
  "logic-immo.com",
  "century21.fr",
  "orpi.com",
  "laforet.com",
  "ouestfrance-immo.com",
  "paruvendu.fr",
  "meilleursagents.com",
  "immobilier.lefigaro.fr",
  "bellesdemeures.com",
  "barnes-international.com",
  "superimmo.com",
  "green-acres.fr",
  "stephaneplazaimmobilier.com",
  "guy-hoquet.com",
  "immoneuf.com",
  "zefir.fr",
];

export function isSupportedPortalHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  return SUPPORTED_PORTAL_HOSTS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  );
}
