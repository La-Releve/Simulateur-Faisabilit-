"use client";

import type { TrackEventName, TrackPayload } from "./events";

/*
 * Envoi des actions, sans jamais gêner l'utilisateur :
 * - fire-and-forget (fetch keepalive), hors du fil de l'interface (requestIdleCallback) ;
 * - hors connexion ou en cas d'échec, l'action est mise en file (localStorage, 50 max, 7 jours)
 *   et renvoyée au retour de la connexion ; si la file est perdue, tant pis ;
 * - aucune erreur n'est jamais remontée.
 */
const ENDPOINT = "/api/track";
const QUEUE_KEY = "track:queue";
const MAX_QUEUE = 50;
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

let flushing = false;
let listening = false;

function readQueue(): TrackPayload[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const list = raw ? (JSON.parse(raw) as TrackPayload[]) : [];
    const minDate = Date.now() - MAX_AGE_MS;
    return Array.isArray(list) ? list.filter((p) => Date.parse(p.at) > minDate) : [];
  } catch {
    return [];
  }
}

function writeQueue(list: TrackPayload[]) {
  try {
    if (list.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-MAX_QUEUE)));
    else localStorage.removeItem(QUEUE_KEY);
  } catch {
    // stockage indisponible : l'action est perdue, sans conséquence pour l'utilisateur
  }
}

async function post(batch: TrackPayload[]): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

function idle(fn: () => void) {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(fn, { timeout: 3000 });
  else setTimeout(fn, 200);
}

/** Renvoie les actions en attente (au chargement et au retour de la connexion). */
export function flushTrackingQueue() {
  if (flushing || !navigator.onLine) return;
  const queued = readQueue();
  if (!queued.length) return;
  flushing = true;
  writeQueue([]);
  post(queued.slice(0, 20)).then((ok) => {
    const rest = queued.slice(20);
    writeQueue(ok ? [...rest, ...readQueue()] : [...queued, ...readQueue()]);
    flushing = false;
    if (ok && rest.length) idle(flushTrackingQueue);
  });
}

function ensureListener() {
  if (listening) return;
  listening = true;
  window.addEventListener("online", () => idle(flushTrackingQueue));
}

/** Enregistre une action. Ne bloque jamais, ne lève jamais d'erreur. */
export function track(event: TrackEventName) {
  if (typeof window === "undefined") return;
  ensureListener();
  const payload: TrackPayload = { e: event, at: new Date().toISOString() };
  if (!navigator.onLine) {
    writeQueue([...readQueue(), payload]);
    return;
  }
  idle(() => {
    post([payload]).then((ok) => {
      if (!ok) writeQueue([...readQueue(), payload]);
    });
  });
}
