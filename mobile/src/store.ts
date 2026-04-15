/**
 * Estado local: billetes guardados por el usuario y filtros del mapa.
 *
 * Persistencia en AsyncStorage vía el middleware `persist` de zustand.
 * Los billetes son 100% locales —no subimos nada al backend.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SavedTicket, ServiceKind } from "./types";

interface State {
  tickets: SavedTicket[];
  /** Servicios visibles en el mapa; vacío = todos. */
  serviceFilter: ServiceKind[];
  addTicket: (ticket: Omit<SavedTicket, "id" | "createdAt">) => void;
  removeTicket: (id: string) => void;
  toggleService: (service: ServiceKind) => void;
  clearServiceFilter: () => void;
}

/** UUID v4 sin dependencia extra; colisiones prácticamente imposibles. */
function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      tickets: [],
      serviceFilter: [],

      addTicket: (draft) =>
        set((s) => ({
          tickets: [
            ...s.tickets,
            { ...draft, id: uuid(), createdAt: new Date().toISOString() },
          ],
        })),

      removeTicket: (id) =>
        set((s) => ({ tickets: s.tickets.filter((t) => t.id !== id) })),

      toggleService: (service) =>
        set((s) => ({
          serviceFilter: s.serviceFilter.includes(service)
            ? s.serviceFilter.filter((x) => x !== service)
            : [...s.serviceFilter, service],
        })),

      clearServiceFilter: () => set({ serviceFilter: [] }),
    }),
    {
      name: "trenfai-store",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
