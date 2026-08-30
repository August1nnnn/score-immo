#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

import { curateReports, validateMonth } from "./barometre-curation.mjs";

const PROJECT_REF = "afvtxiklivnmakqixkml";
const QUERY_ENDPOINT = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const INVALID_GEOGRAPHY_SLUGS = [
  "la-roche-guyon-appartement-45m2-99k",
  "maxeville-appartement-74m2-97k",
  "nancy-appartement-47m2-96k",
  "sons-et-roncheres-maison-92m2-25k",
];

const INSERT_COLUMNS = [
  "mois", "ville", "code_postal", "region", "type_bien", "surface",
  "prix_demande", "score_global", "score_sections", "dpe", "alertes_cles",
  "points_forts", "verdict", "is_edito", "slug", "publie",
  "source_report_id", "details_json",
];

function nextMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber, 1));
  return date.toISOString().slice(0, 7);
}

function argumentValue(argv, name) {
  const spacedIndex = argv.indexOf(name);
  if (spacedIndex >= 0) return argv[spacedIndex + 1] ?? null;
  const prefix = `${name}=`;
  const inline = argv.find((item) => item.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : null;
}

export function parseArguments(argv) {
  const month = validateMonth(argumentValue(argv, "--month"));
  const apply = argv.includes("--apply");
  const snapshot = argumentValue(argv, "--snapshot");
  const confirm = argumentValue(argv, "--confirm");
  const known = new Set(["--month", "--apply", "--snapshot", "--confirm"]);
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    const name = item.split("=", 1)[0];
    if (!known.has(name) && !argv[index - 1]?.startsWith("--")) {
      throw new Error(`Argument inconnu: ${item}`);
    }
  }
  if (apply && !snapshot) throw new Error("--snapshot est obligatoire avec --apply");
  if (apply && !isAbsolute(snapshot)) throw new Error("Le chemin du snapshot doit etre absolu");
  if (apply && !confirm) throw new Error("--confirm=YYYY-MM:N est obligatoire avec --apply");
  return { month, apply, confirm, snapshot };
}

export function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Nombre SQL non fini");
    return String(value);
  }
  if (Array.isArray(value)) {
    return `ARRAY[${value.map((item) => sqlLiteral(String(item))).join(",")}]::text[]`;
  }
  if (typeof value === "object") {
    const json = JSON.stringify(value).replaceAll("'", "''");
    return `'${json}'::jsonb`;
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function buildMutationSql(rows, { commit }) {
  if (!Array.isArray(rows) || rows.length === 0) throw new Error("Aucune ligne a publier");
  const sourceIds = rows.map((row) => row.source_report_id);
  const slugs = rows.map((row) => row.slug);
  const values = rows.map((row) => (
    `(${INSERT_COLUMNS.map((column) => sqlLiteral(row[column])).join(",")})`
  ));
  const month = rows[0].mois;
  if (rows.some((row) => row.mois !== month)) throw new Error("Plusieurs mois dans une transaction");
  if (new Set(sourceIds).size !== sourceIds.length) throw new Error("Sources dupliquees dans le lot");
  if (new Set(slugs).size !== slugs.length) throw new Error("Slugs dupliques dans le lot");

  return [
    "BEGIN;",
    "SET LOCAL lock_timeout = '5s';",
    "SET LOCAL statement_timeout = '30s';",
    `UPDATE public.barometre_reports SET publie = FALSE WHERE slug = ANY(${sqlLiteral(INVALID_GEOGRAPHY_SLUGS)});`,
    "UPDATE public.barometre_reports SET region = 'Guyane' WHERE slug = 'cayenne-appartement-29m2-105k' AND code_postal = '97300';",
    "DO $guard$",
    "BEGIN",
    `  IF EXISTS (SELECT 1 FROM public.barometre_reports WHERE source_report_id = ANY(${sqlLiteral(sourceIds)}::uuid[])) THEN`,
    "    RAISE EXCEPTION 'source collision: a report is already curated';",
    "  END IF;",
    `  IF EXISTS (SELECT 1 FROM public.barometre_reports WHERE slug = ANY(${sqlLiteral(slugs)})) THEN`,
    "    RAISE EXCEPTION 'slug collision: a public slug is already used';",
    "  END IF;",
    "  IF EXISTS (SELECT 1 FROM public.barometre_reports WHERE publie = TRUE AND (region IS NULL OR btrim(region) = '' OR region = 'France')) THEN",
    "    RAISE EXCEPTION 'invalid geography remains after repair';",
    "  END IF;",
    "END",
    "$guard$;",
    `INSERT INTO public.barometre_reports (${INSERT_COLUMNS.join(",")}) VALUES`,
    `${values.join(",\n")};`,
    "DO $verify$",
    "BEGIN",
    `  IF (SELECT count(*) FROM public.barometre_reports WHERE source_report_id = ANY(${sqlLiteral(sourceIds)}::uuid[]) AND mois = ${sqlLiteral(month)} AND publie = TRUE) <> ${rows.length} THEN`,
    "    RAISE EXCEPTION 'post-insert invariant failed';",
    "  END IF;",
    "END",
    "$verify$;",
    commit ? "COMMIT;" : "ROLLBACK;",
  ].join("\n");
}

export function buildManifest(result) {
  const rejectedCounts = {};
  for (const item of result.rejected) {
    rejectedCounts[item.reason] = (rejectedCounts[item.reason] ?? 0) + 1;
  }
  return {
    month: result.month,
    eligibleCount: result.rows.length,
    rejectedCounts,
    rows: result.rows.map((row) => ({
      slug: row.slug,
      ville: row.ville,
      code_postal: row.code_postal,
      type_bien: row.type_bien,
      score_global: row.score_global,
      source_kind: row.details_json.publication.source_kind,
    })),
  };
}

async function queryDatabase(query, pat, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(QUERY_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${pat}`,
      "content-type": "application/json",
      "user-agent": "score-immo-barometre-curation/1.0",
    },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    throw new Error(`Supabase Management API query failed (${response.status})`);
  }
  return response.json();
}

function candidateQuery(month) {
  const end = nextMonth(month);
  return `
SELECT
  r.id, r.user_id, r.report_mode, r.status, r.deleted_at, r.created_at,
  r.barometre_optin, r.city, r.postal_code, r.surface, r.price,
  r.score_total, r.score_breakdown_json, r.report_json, r.dpe_label,
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = r.user_id AND ur.role::text = 'admin'
  ) AS owner_is_admin
FROM public.reports r
WHERE r.created_at >= ${sqlLiteral(`${month}-01T00:00:00.000Z`)}::timestamptz
  AND r.created_at < ${sqlLiteral(`${end}-01T00:00:00.000Z`)}::timestamptz
ORDER BY r.id;`.trim();
}

function existingRowsQuery() {
  return "SELECT source_report_id, slug FROM public.barometre_reports ORDER BY slug;";
}

function snapshotQuery() {
  return "SELECT * FROM public.barometre_reports ORDER BY mois, slug;";
}

function verificationQuery(sourceIds) {
  return `SELECT mois, count(*)::int AS count, count(DISTINCT slug)::int AS distinct_slugs, count(DISTINCT source_report_id)::int AS distinct_sources FROM public.barometre_reports WHERE source_report_id = ANY(${sqlLiteral(sourceIds)}::uuid[]) AND publie = TRUE GROUP BY mois;`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const pat = process.env.SUPABASE_PAT?.trim();
  if (!pat) throw new Error("SUPABASE_PAT est requis au runtime");

  const [candidates, existingRows] = await Promise.all([
    queryDatabase(candidateQuery(options.month), pat),
    queryDatabase(existingRowsQuery(), pat),
  ]);
  const result = curateReports(candidates, { month: options.month, existingRows });
  const manifest = buildManifest(result);
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);

  if (!options.apply) {
    process.stdout.write("DRY_RUN: aucune mutation externe.\n");
    return;
  }

  const expectedConfirmation = `${options.month}:${result.rows.length}`;
  if (options.confirm !== expectedConfirmation) {
    throw new Error(`Confirmation refusee. Valeur attendue: ${expectedConfirmation}`);
  }

  const snapshot = await queryDatabase(snapshotQuery(), pat);
  writeFileSync(options.snapshot, `${JSON.stringify(snapshot, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  process.stdout.write(`SNAPSHOT_WRITTEN: ${options.snapshot}\n`);

  await queryDatabase(buildMutationSql(result.rows, { commit: false }), pat);
  process.stdout.write("TRANSACTION_CHECK: rollback confirme.\n");
  await queryDatabase(buildMutationSql(result.rows, { commit: true }), pat);
  const verification = await queryDatabase(
    verificationQuery(result.rows.map((row) => row.source_report_id)),
    pat,
  );
  const proof = verification[0];
  if (
    verification.length !== 1
    || proof.mois !== options.month
    || proof.count !== result.rows.length
    || proof.distinct_slugs !== result.rows.length
    || proof.distinct_sources !== result.rows.length
  ) {
    throw new Error("Verification apres commit non conforme");
  }
  process.stdout.write(`APPLY_VERIFIED: ${proof.count} lignes publiees pour ${proof.mois}.\n`);
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
