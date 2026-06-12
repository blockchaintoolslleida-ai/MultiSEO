/**
 * Client IP extraction for rate limiting.
 *
 * Checks common proxy headers, respecting the forwarding chain.
 */

/**
 * Extract the client IP address from a Request.
 * Handles x-forwarded-for behind proxies.
 */
export function getClientIp(request: Request): string {
  // Check x-forwarded-for header (set by reverse proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // The leftmost IP is the original client
    const ips = forwarded.split(",");
    const first = ips[0]?.trim();
    if (first) return first;
  }

  // Check x-real-ip (set by some proxies)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback: return a placeholder
  // In production, always run behind a proxy that sets x-forwarded-for
  return "127.0.0.1";
}
