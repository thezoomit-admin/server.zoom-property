import { timingSafeEqual } from "crypto";
import { Request } from "express";
import { isIP } from "net";
import config from "../config";

/**
 * Who is really on the other end of a request.
 *
 * The public site calls this API from its own server (Next.js server actions),
 * so `req.ip` is the site's host for every visitor. The site forwards the
 * visitor's address in `X-Visitor-IP` and proves it is the site with
 * `X-Internal-Secret` (= INTERNAL_API_SECRET on both sides). Without a valid
 * secret the header is ignored — a browser cannot choose its own IP.
 */

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Request comes from our own site server (valid shared secret). */
export function isInternalRequest(req: Request): boolean {
  const expected = config.internal_api_secret;
  const given = req.headers["x-internal-secret"];
  return Boolean(expected) && typeof given === "string" && sameSecret(given, expected!);
}

/** Visitor IP vouched for by the site server, or null. */
export function forwardedVisitorIp(req: Request): string | null {
  if (!isInternalRequest(req)) return null;
  const raw = req.headers["x-visitor-ip"];
  const ip = typeof raw === "string" ? raw.trim() : "";
  return isIP(ip) ? ip : null;
}

/** The address rate limits and logs should use. */
export function clientIp(req: Request): string {
  return forwardedVisitorIp(req) ?? req.ip ?? req.socket.remoteAddress ?? "unknown";
}
