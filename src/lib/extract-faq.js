export function extractFaq(html) {
  const faqAnchor = html.match(
    /<h2[^>]*>\s*(?:FAQ|Questions fréquentes)[^<]*<\/h2>/i,
  );
  if (!faqAnchor || faqAnchor.index === undefined) return [];

  const after = html.slice(faqAnchor.index + faqAnchor[0].length);
  const boundary = after.search(
    /<h2\b|<div\b[^>]*class=["'][^"']*\bsi-article-cta\b[^"']*["']/i,
  );
  const faqRegion = boundary === -1 ? after : after.slice(0, boundary);
  const pairs = [];
  const questionAndAnswer =
    /<h3[^>]*>([\s\S]*?)<\/h3>\s*((?:<p[^>]*>[\s\S]*?<\/p>\s*)+)/gi;
  let match;

  while ((match = questionAndAnswer.exec(faqRegion)) !== null) {
    const q = match[1].replace(/<[^>]+>/g, "").trim();
    const a = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (q && a) pairs.push({ q, a });
  }

  return pairs;
}
