import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

function page(path) {
  const contents = readFileSync(new URL(path, root), "utf8");
  return JSON.parse(contents).body_html;
}

const paths = {
  terms: "src/data/pages/cgv.json",
  privacy: "src/data/pages/politique-de-confidentialite.json",
  legal: "src/data/pages/mentions-legales.json",
};

test("sales terms distinguish web Stripe purchases from iOS Apple purchases", () => {
  const terms = page(paths.terms);

  assert.match(terms, /sur le site web[\s\S]*Stripe/iu);
  assert.match(terms, /dans l'application iOS[\s\S]*(?:Apple|StoreKit)/iu);
  assert.match(terms, /prix localisé[\s\S]*affiché par Apple/iu);
  assert.match(terms, /Sign in with Apple[\s\S]*Google/iu);

  for (const webOffer of [
    /Analyse unique[^<]*2,99\s*€/u,
    /Découverte[^<]*9,99\s*€/u,
    /Recherche[^<]*29\s*€/u,
    /Premium[^<]*79\s*€/u,
  ]) {
    assert.match(terms, webOffer);
  }
});

test("sales terms delegate iOS renewal, receipts and refunds to Apple", () => {
  const terms = page(paths.terms);

  assert.match(terms, /support\.apple\.com\/fr-fr\/billing/iu);
  assert.match(terms, /reportaproblem\.apple\.com/iu);
  assert.match(terms, /Apple[\s\S]*(?:reçu|justificatif|historique d'achat)/iu);
  assert.match(terms, /Apple[\s\S]*(?:gérer|résilier)[\s\S]*abonnement/iu);
  assert.match(terms, /Apple[\s\S]*(?:admissibilité|éligibilité|décision)[\s\S]*remboursement/iu);

  assert.doesNotMatch(
    terms,
    /Une facture est mise à disposition[^.]*après chaque paiement/iu,
  );
  assert.doesNotMatch(
    terms,
    /garantie[^<]*14 jours[\s\S]*contact@score-immo\.fr/iu,
  );
});

test("privacy policy covers federated authentication and Apple transactions", () => {
  const privacy = page(paths.privacy);

  assert.match(privacy, /Sign in with Apple/iu);
  assert.match(privacy, /connexion avec Google/iu);
  assert.match(privacy, /identifiant[^<]*(?:Apple|Google)/iu);
  assert.match(privacy, /Apple[\s\S]*(?:produit|transaction|abonnement)/iu);
  assert.match(privacy, /Stripe[\s\S]*site web/iu);
  assert.match(privacy, /Apple[\s\S]*(?:App Store|StoreKit)/iu);
  assert.match(privacy, /ne (?:reçoit|stocke) pas[^.]*données bancaires complètes/iu);
});

test("legal notices expose the canonical Cloudflare and Supabase entities", () => {
  const legal = page(paths.legal);

  for (const expected of [
    "Cloudflare, Inc.",
    "101 Townsend St.",
    "San Francisco, CA 94107",
    "SUPABASE PTE. LTD.",
    "65 Chulia Street #38-02/03",
    "OCBC Centre",
    "Singapore 049513",
  ]) {
    assert.match(
      legal,
      new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu"),
    );
  }

  assert.doesNotMatch(legal, /Supabase, Inc\.|3500 S\. DuPont Highway|Dover, Delaware/iu);
});

test("canonical legal pages describe mixed public sources without exclusivity claims", () => {
  const pages = Object.values(paths).map(page);
  const combined = pages.join("\n");

  assert.match(combined, /sources publiques officielles ou ouvertes/iu);
  assert.match(combined, /références d'annonces publiques/iu);
  assert.doesNotMatch(combined, /données publiques exclusivement/iu);
  assert.doesNotMatch(combined, /exclusivement (?:à partir de|sur la base de) données publiques/iu);
});

test("canonical legal JSON stays publishable and free of placeholders", () => {
  for (const path of Object.values(paths)) {
    const contents = readFileSync(new URL(path, root), "utf8");
    assert.doesNotThrow(() => JSON.parse(contents), path);
    assert.doesNotMatch(
      contents,
      /claude(?:\.ai)?|placeholder|TODO|À COMPLÉTER|avant publication définitive/iu,
      path,
    );
    assert.doesNotMatch(contents, /[—–]/u, path);
  }
});
