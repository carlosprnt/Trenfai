/**
 * Cliente HTTP para el backend Trenfai.
 *
 * Usa EXPO_PUBLIC_API_URL —inyectada en tiempo de build por Expo. Si falta,
 * usa localhost:4000, que es útil en el simulador de iOS. En dispositivo
 * físico hay que poner la IP LAN.
 */

import type { LiveTrainsResponse, TrainDetail } from "./types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    // El backend devuelve { error: { code, message } } en errores.
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      if (body?.error?.message) message = body.error.message;
    } catch {
      // Ignoramos el parse y dejamos el HTTP code.
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  liveTrains: (signal?: AbortSignal) =>
    request<LiveTrainsResponse>("/api/trains/live", signal),

  trainDetail: (code: string, signal?: AbortSignal) =>
    request<TrainDetail>(`/api/trains/${encodeURIComponent(code)}`, signal),
};
