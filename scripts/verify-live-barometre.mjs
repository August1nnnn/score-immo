import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import {
  fetchPublishedBarometreRows,
  getBarometrePublishableKey,
} from "./barometre-supabase.mjs";
import { normalizePublishedRows } from "./barometre-public-data.mjs";

const SITE_ORIGIN = "https://score-immo.fr";
const SITEMAP_URL = `${SITE_ORIGIN}/sitemap-0.xml`;
const MANIFEST_URL = `${SITE_ORIGIN}/barometre-manifest.json`;

function compactList(values) {
  if (values.length === 0) return "0";
  const visible = values.slice(0, 10).join(",");
  return values.length > 10 ? `${visible},+${values.length - 10}` : visible;
}

export function extractLiveBarometreSlugs(xml) {
  const slugs = [];
  for (const match of String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const url = new URL(match[1]);
      const segments = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
      if (url.origin === SITE_ORIGIN && segments.length === 2 && segments[0] === "barometre") {
        slugs.push(decodeURIComponent(segments[1]));
      }
    } catch {
      // Other malformed sitemap entries are outside this focused parity gate.
    }
  }
  return [...new Set(slugs)].sort((a, b) => a.localeCompare(b, "fr"));
}

export async function verifyLiveBarometreParity({
  expectedSlugs,
  fetchImpl = globalThis.fetch,
}) {
  const expected = [...new Set(expectedSlugs)].sort((a, b) => a.localeCompare(b, "fr"));
  if (expected.length === 0 || expected.some((slug) => typeof slug !== "string" || !slug)) {
    throw new Error("No valid Barometre slug to verify");
  }

  const sitemapResponse = await fetchImpl(SITEMAP_URL, {
    headers: { "user-agent": "score-immo-barometre-parity/1.0" },
  });
  if (!sitemapResponse.ok) {
    throw new Error(`Live sitemap unavailable (${sitemapResponse.status})`);
  }
  const live = extractLiveBarometreSlugs(await sitemapResponse.text());
  const liveSet = new Set(live);
  const expectedSet = new Set(expected);
  const missing = expected.filter((slug) => !liveSet.has(slug));
  const unexpected = live.filter((slug) => !expectedSet.has(slug));
  if (missing.length > 0 || unexpected.length > 0) {
    throw new Error(
      `Live Barometre slug parity failed: missing=${compactList(missing)}; unexpected=${compactList(unexpected)}`,
    );
  }

  const manifestResponse = await fetchImpl(MANIFEST_URL, {
    headers: { "user-agent": "score-immo-barometre-parity/1.0" },
  });
  if (!manifestResponse.ok) {
    throw new Error(`Live Barometre manifest unavailable (${manifestResponse.status})`);
  }
  let manifest;
  try {
    manifest = await manifestResponse.json();
  } catch {
    throw new Error("Live Barometre manifest is not valid JSON");
  }
  const manifestSlugs = manifest?.schema_version === 1 && Array.isArray(manifest.reports)
    ? manifest.reports.map((report) => report?.slug).filter((slug) => typeof slug === "string")
    : [];
  const normalizedManifestSlugs = [...new Set(manifestSlugs)].sort((a, b) => a.localeCompare(b, "fr"));
  const manifestSet = new Set(normalizedManifestSlugs);
  const manifestMissing = expected.filter((slug) => !manifestSet.has(slug));
  const manifestUnexpected = normalizedManifestSlugs.filter((slug) => !expectedSet.has(slug));
  if (
    manifest?.schema_version !== 1
    || manifestSlugs.length !== manifest?.reports?.length
    || normalizedManifestSlugs.length !== manifestSlugs.length
    || manifestMissing.length > 0
    || manifestUnexpected.length > 0
  ) {
    throw new Error(
      `Live Barometre manifest parity failed: missing=${compactList(manifestMissing)}; unexpected=${compactList(manifestUnexpected)}`,
    );
  }

  const unavailable = [];
  for (const slug of expected) {
    const response = await fetchImpl(`${SITE_ORIGIN}/barometre/${encodeURIComponent(slug)}`, {
      method: "HEAD",
      redirect: "follow",
      headers: { "user-agent": "score-immo-barometre-parity/1.0" },
    });
    if (response.status !== 200) unavailable.push(`${slug} (${response.status})`);
  }
  if (unavailable.length > 0) {
    throw new Error(`Live Barometre pages unavailable: ${compactList(unavailable)}`);
  }
  return { checked: expected.length };
}

async function main() {
  const publishableKey = getBarometrePublishableKey();
  if (!publishableKey) throw new Error("SCOREIMMO_SUPABASE_PUBLISHABLE_KEY is required");
  const rows = await fetchPublishedBarometreRows({ publishableKey });
  const fiches = normalizePublishedRows(rows);
  const result = await verifyLiveBarometreParity({
    expectedSlugs: fiches.map(({ slug }) => slug),
  });
  console.log(`Live Barometre parity verified: ${result.checked} pages`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
