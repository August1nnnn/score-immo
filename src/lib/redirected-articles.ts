export const REDIRECTED_ARTICLE_HANDLES = new Set([
  'score-scoreimmo-methode-evaluation',
]);

export function isRedirectedArticle(handle: string): boolean {
  return REDIRECTED_ARTICLE_HANDLES.has(handle);
}
