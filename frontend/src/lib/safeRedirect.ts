/**
 * Accepts only same-site absolute paths ("/sessions"), so a crafted
 * ?next=https://evil.example link cannot turn login into an open redirect.
 */
export function safeRedirectPath(candidate: string | null | undefined, fallback: string): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return fallback;
  }

  return candidate;
}
