import "server-only";
import { TRACK_EVENTS, type Device, type TrackEventName } from "./events";

const NOTION_VERSION = "2022-06-28";

export interface TrackRecord {
  event: TrackEventName;
  at: Date;
  ip: string;
  userAgent: string;
  device: Device;
}

const text = (content: string) => [{ type: "text", text: { content: content.slice(0, 2000) } }];

/** Crée une ligne dans la base Notion de suivi. Silencieux si la configuration est absente. */
export async function sendToNotion(record: TrackRecord): Promise<void> {
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_TRACKING_DATABASE_ID;
  if (!token || !databaseId) return;

  const { type, phrase } = TRACK_EVENTS[record.event];
  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        Action: { title: text(phrase) },
        Type: { select: { name: type } },
        Date: { date: { start: record.at.toISOString() } },
        "Adresse IP": { rich_text: text(record.ip) },
        "User agent": { rich_text: text(record.userAgent) },
        Appareil: { select: { name: record.device } },
      },
    }),
  });
  if (!res.ok) {
    console.error("[track] Notion", res.status, (await res.text()).slice(0, 300));
  }
}
