/**
 * Reads the expiry of a JWT without verifying it: the API remains the only
 * judge of validity, this only avoids restoring a session that is obviously over.
 */
export function tokenExpiresAt(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) {
    return null;
  }

  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: unknown };

    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now: number = Date.now()): boolean {
  const expiresAt = tokenExpiresAt(token);

  return expiresAt === null || expiresAt <= now;
}
