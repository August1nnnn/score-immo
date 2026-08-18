export function findNestedAnchors(html) {
  const issues = [];
  let anchorDepth = 0;

  for (const match of String(html || "").matchAll(/<a\b[^>]*>|<\/a\s*>/gi)) {
    const token = match[0];
    if (/^<\/a/i.test(token)) {
      anchorDepth = Math.max(0, anchorDepth - 1);
      continue;
    }

    if (anchorDepth > 0) {
      issues.push({
        offset: match.index,
        href: token.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] || "",
      });
    }
    anchorDepth += 1;
  }

  return issues;
}
