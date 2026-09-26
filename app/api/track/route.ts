import { after, type NextRequest } from "next/server";
import { deviceFromUserAgent, isBot, isTrackEvent, type TrackPayload } from "@/lib/tracking/events";
import { sendToNotion } from "@/lib/tracking/notion";

// Reçoit un lot d'actions (jamais de montant saisi), répond immédiatement, puis les transmet
// à Notion après la réponse : le navigateur n'attend jamais l'API Notion.
const MAX_BATCH = 20;
const MAX_AGE_MS = 7 * 24 * 3600 * 1000; // actions mises en file hors connexion : 7 jours max
const RATE_LIMIT = 60; // actions par minute et par IP (par instance)
const hits = new Map<string, { count: number; reset: number }>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "inconnue";
}

function allowed(ip: string, n: number): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: n, reset: now + 60_000 });
    return n <= RATE_LIMIT;
  }
  entry.count += n;
  return entry.count <= RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  const noContent = new Response(null, { status: 204 });

  // Même origine uniquement
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return noContent;

  const userAgent = req.headers.get("user-agent") ?? "";
  if (isBot(userAgent)) return noContent;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return noContent;
  }
  const list = (Array.isArray(body) ? body : [body]).slice(0, MAX_BATCH) as Partial<TrackPayload>[];
  const now = Date.now();
  const events = list
    .filter((p) => p && isTrackEvent(p.e))
    .map((p) => {
      const t = Date.parse(String(p.at));
      const at = Number.isFinite(t) && t <= now + 60_000 && now - t <= MAX_AGE_MS ? new Date(t) : new Date(now);
      return { event: p.e!, at };
    });

  const ip = clientIp(req);
  if (events.length === 0 || !allowed(ip, events.length)) return noContent;

  const device = deviceFromUserAgent(userAgent);
  after(async () => {
    // Séquentiel : l'API Notion limite à ~3 requêtes / seconde
    for (const e of events) {
      try {
        await sendToNotion({ ...e, ip, userAgent, device });
      } catch (err) {
        console.error("[track]", err);
      }
    }
  });

  return noContent;
}
