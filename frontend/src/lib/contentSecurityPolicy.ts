/**
 * Content Security Policy of the pages. Scripts run only if they carry the
 * nonce of the response (Next.js adds it to its own), so injected markup
 * cannot execute anything. Styles allow inline attributes (e.g. the width of a
 * progress bar), which cannot run code.
 */
export function contentSecurityPolicy(nonce: string, isDevelopment: boolean): string {
  const directives = {
    "default-src": ["'self'"],
    // Development only: React's debugging tools evaluate code, hot reload uses a websocket.
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDevelopment ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(isDevelopment ? ["ws:"] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}
