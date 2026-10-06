import { Request } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { clientIp, forwardedVisitorIp, isInternalRequest } from "../utils/clientIp";

// Redis has been removed — these limiters use express-rate-limit's built-in
// in-memory MemoryStore. Counters are per-process (each instance tracks its
// own), which is sufficient for coarse abuse protection.
//
// Every limiter keys on the *visitor*, not the hop in front of us: the public
// site calls from its own server, so it forwards the visitor's IP (see
// utils/clientIp). `ipKeyGenerator` folds an IPv6 address to its /56 so one
// household cannot dodge a limit by rotating addresses inside its prefix.
const visitorKey = (req: Request) => ipKeyGenerator(clientIp(req));

// Baseline abuse guard for every /api request. A single SSR page render fans
// out into many API reads, so the ceiling is generous — and much higher in dev
// where Next.js issues duplicate/fast-refresh requests.
const isProduction = process.env.NODE_ENV === "production";

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: isProduction ? 600 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: visitorKey,
  // The site's own page renders (secret, no visitor IP) are cached reads for
  // everyone at once — counting them against one bucket would throttle the
  // whole site. Its visitor-driven calls still carry an IP and are counted.
  skip: (req) => isInternalRequest(req) && !forwardedVisitorIp(req),
  message: { success: false, message: "Too many requests. Please try again shortly." },
});

// Tighter guard for auth endpoints (login, register, forgot/reset password),
// which are the most common brute-force / abuse targets.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: visitorKey,
  message: {
    success: false,
    message: "Too many attempts. Please try again in a few minutes.",
  },
});

// Stricter guard for contact forms, inquiries, and comments to prevent spam.
export const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // 5 lead submissions per hour per visitor IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: visitorKey,
  message: {
    success: false,
    message:
      "Too many enquiries from this address. Please wait about an hour before trying again.",
  },
});
