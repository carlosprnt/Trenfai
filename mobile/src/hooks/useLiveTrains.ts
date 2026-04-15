/**
 * Hook que mantiene una lista de trenes activos refrescada en tiempo real.
 *
 * Refresh cada 15s (misma cadencia que el upstream de Renfe). El backend
 * cachea 10s, así que en la práctica el coste real de una petición extra es
 * despreciable.
 */

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import type { LiveTrainsResponse } from "../types";

const REFRESH_MS = 15_000;

export function useLiveTrains() {
  return useQuery<LiveTrainsResponse>({
    queryKey: ["live-trains"],
    queryFn: ({ signal }) => api.liveTrains(signal),
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: REFRESH_MS / 2,
  });
}

export function useTrainDetail(code: string | null) {
  return useQuery({
    queryKey: ["train", code],
    queryFn: ({ signal }) => {
      if (!code) throw new Error("train code required");
      return api.trainDetail(code, signal);
    },
    enabled: !!code,
    refetchInterval: REFRESH_MS,
  });
}
