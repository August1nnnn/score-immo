import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { findNestedAnchors } from "./html-link-integrity.mjs";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, process.argv[2] || "dist");
const origin = "https://score-immo.fr";
const internalHosts = new Set(["score-immo.fr", "www.score-immo.fr"]);

if (!existsSync(dist)) {
  console.error(`Missing build directory: ${dist}`);
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function webPath(path) {
  return `/${relative(dist, path).split(sep).join("/")}`;
}

function normalizePath(pathname) {
  let path;
  try {
    path = decodeURI(pathname);
  } catch {
    return null;
  }
  if (path.endsWith("/index.html")) path = path.slice(0, -"index.html".length);
  else if (path.endsWith(".html")) path = path.slice(0, -".html".length);
  if (path.length > 1) path = path.replace(/\/$/, "");
  return path || "/";
}

function routeForHtml(path) {
  return normalizePath(webPath(path));
}

function parseRedirects(path) {
  const rules = new Map();
  const errors = [];
  if (!existsSync(path)) return { rules, errors: [`Missing redirects file: ${path}`] };

  for (const [index, raw] of readFileSync(path, "utf8").split("\n").entries()) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [source, destination, status = "302", ...extra] = line.split(/\s+/);
    if (!source || !destination || extra.length > 0) {
      errors.push(`Invalid redirect at line ${index + 1}: ${line}`);
      continue;
    }
    if (rules.has(source)) errors.push(`Duplicate redirect source: ${source}`);
    rules.set(source, { destination, status });
  }
  return { rules, errors };
}

const files = walk(dist);
const htmlFiles = files.filter((path) => path.endsWith(".html"));
const routes = new Set(htmlFiles.map(routeForHtml));
const assets = new Set(files.map(webPath));
const { rules: redirects, errors } = parseRedirects(join(dist, "_redirects"));
const brokenLinks = new Set();
const redirectedLinks = new Set();
const noindexRoutes = new Set();
let checkedLinks = 0;

const manifestPath = join(dist, "barometre-manifest.json");
if (!existsSync(manifestPath)) {
  errors.push("Missing dist/barometre-manifest.json");
} else {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const reports = manifest?.schema_version === 1 && Array.isArray(manifest.reports)
      ? manifest.reports
      : null;
    if (!reports) {
      errors.push("Barometre manifest must use schema_version 1 with a reports array");
    } else {
      const slugs = reports.map((report) => report?.slug);
      const safeSlugs = slugs.filter((slug) => (
        typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ));
      if (safeSlugs.length !== reports.length || new Set(safeSlugs).size !== reports.length) {
        errors.push("Barometre manifest contains invalid or duplicate slugs");
      }
      const manifestRoutes = new Set(safeSlugs.map((slug) => `/barometre/${slug}`));
      const detailRoutes = [...routes].filter((route) => (
        /^\/barometre\/[^/]+$/.test(route) && !route.startsWith("/barometre/region/")
      ));
      for (const route of manifestRoutes) {
        if (!routes.has(route)) errors.push(`Barometre manifest page does not exist: ${route}`);
      }
      for (const route of detailRoutes) {
        if (!manifestRoutes.has(route)) errors.push(`Barometre detail missing from manifest: ${route}`);
      }
    }
  } catch (error) {
    errors.push(`Invalid dist/barometre-manifest.json: ${error.message}`);
  }
}

for (const htmlFile of htmlFiles) {
  const from = routeForHtml(htmlFile);
  const html = readFileSync(htmlFile, "utf8");
  for (const issue of findNestedAnchors(html)) {
    errors.push(`${from} contains a nested anchor at offset ${issue.offset}: ${issue.href || "missing href"}`);
  }
  const robots = [...html.matchAll(/<meta\b[^>]*\bname\s*=\s*(["'])robots\1[^>]*>/gi)]
    .map((match) => match[0].match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2] || "");
  if (robots.length !== 1) {
    errors.push(`${from} must contain exactly one robots meta directive, found ${robots.length}`);
  } else {
    const directives = robots[0].toLowerCase().split(",").map((item) => item.trim());
    if (directives.includes("index") && directives.includes("noindex")) {
      errors.push(`${from} contains conflicting index and noindex directives`);
    }
    if (directives.includes("noindex")) noindexRoutes.add(from);
  }
  for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    const href = match[2].replaceAll("&amp;", "&").trim();
    if (!href || href.startsWith("#") || /^(?:mailto|tel|javascript|data):/i.test(href)) continue;

    let url;
    try {
      url = new URL(href, `${origin}${from === "/" ? "/" : from}`);
    } catch {
      brokenLinks.add(`${from} -> malformed URL: ${href}`);
      continue;
    }
    if (!internalHosts.has(url.hostname)) continue;

    checkedLinks += 1;
    const target = normalizePath(url.pathname);
    if (!target) {
      brokenLinks.add(`${from} -> malformed path: ${href}`);
      continue;
    }
    if (redirects.has(target)) {
      redirectedLinks.add(`${from} -> ${target}`);
      continue;
    }
    if (routes.has(target) || assets.has(url.pathname)) continue;
    brokenLinks.add(`${from} -> ${target}`);
  }
}

for (const [source, rule] of redirects) {
  if (!new Set(["301", "302", "303", "307", "308", "200"]).has(rule.status)) {
    errors.push(`Unsupported redirect status ${rule.status}: ${source}`);
  }
  let destination;
  try {
    destination = new URL(rule.destination, origin);
  } catch {
    errors.push(`Malformed redirect destination: ${source} -> ${rule.destination}`);
    continue;
  }
  if (!internalHosts.has(destination.hostname)) continue;
  const target = normalizePath(destination.pathname);
  if (!target || (!routes.has(target) && !assets.has(destination.pathname))) {
    errors.push(`Redirect destination does not exist: ${source} -> ${rule.destination}`);
  }
}

const notFoundPath = join(dist, "404.html");
if (!existsSync(notFoundPath)) {
  errors.push("Missing dist/404.html: Cloudflare would serve the homepage for unknown routes");
} else {
  const notFoundHtml = readFileSync(notFoundPath, "utf8");
  if (!/<meta\s+name="robots"\s+content="noindex, follow"/i.test(notFoundHtml)) {
    errors.push("dist/404.html must contain a noindex robots directive");
  }
}

for (const sitemap of files.filter((path) => /sitemap.*\.xml$/.test(path))) {
  const xml = readFileSync(sitemap, "utf8");
  if (/https:\/\/score-immo\.fr\/barometre-manifest\.json(?:<|\/|$)/.test(xml)) {
    errors.push(`${webPath(sitemap)} contains the noindex Barometre manifest`);
  }
  if (/https:\/\/score-immo\.fr\/404(?:<|\/|$)/.test(xml)) {
    errors.push(`${webPath(sitemap)} contains the noindex 404 URL`);
  }
  if (!/<urlset\b/i.test(xml)) continue;
  for (const match of xml.matchAll(/<loc>(.*?)<\/loc>/gi)) {
    let url;
    try {
      url = new URL(match[1]);
    } catch {
      errors.push(`${webPath(sitemap)} contains malformed URL: ${match[1]}`);
      continue;
    }
    if (!internalHosts.has(url.hostname)) continue;
    const route = normalizePath(url.pathname);
    if (route && noindexRoutes.has(route)) {
      errors.push(`${webPath(sitemap)} contains noindex URL: ${route}`);
    }
  }
}

for (const issue of brokenLinks) errors.push(`Broken internal link: ${issue}`);
for (const issue of redirectedLinks) errors.push(`Internal link points to a redirect: ${issue}`);

console.log(
  `Built site integrity: ${htmlFiles.length} HTML files, ${checkedLinks} internal links, ${redirects.size} redirects.`,
);

if (errors.length > 0) {
  for (const error of errors.slice(0, 100)) console.error(`ERROR ${error}`);
  if (errors.length > 100) console.error(`ERROR ... ${errors.length - 100} more issue(s)`);
  process.exit(1);
}

console.log("Built site integrity checks passed.");
