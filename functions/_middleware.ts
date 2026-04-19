// CF Pages middleware : force canonical host (www -> apex) + security headers
export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // 301 www.score-immo.fr -> score-immo.fr
  if (url.hostname === 'www.score-immo.fr') {
    const target = new URL(context.request.url);
    target.hostname = 'score-immo.fr';
    return Response.redirect(target.toString(), 301);
  }

  const response = await context.next();

  // Add CSP header (minimal, allows inline scripts needed for analytics + cookie banner)
  const headers = new Headers(response.headers);
  if (!headers.has('content-security-policy')) {
    headers.set(
      'content-security-policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://afvtxiklivnmakqixkml.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' https: data:",
        "connect-src 'self' https://afvtxiklivnmakqixkml.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self' https://app.score-immo.fr",
      ].join('; ')
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
