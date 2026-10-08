import "server-only";

/**
 * In-memory sliding-window limiter. It's per server instance (not shared
 * across instances or restarts), which is enough to stop one user from
 * hammering an expensive action; it isn't a security boundary.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();

  return {
    /** Records a hit for `key`; false when it's over the limit (the hit isn't counted). */
    tryConsume(key: string): boolean {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}
