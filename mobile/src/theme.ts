/**
 * Sistema de color simple inspirado en la estética de Flighty: fondo oscuro,
 * acentos por estado, tipografía clara. Los colores de estado mapean a
 * retraso: verde puntual, ámbar leve, rojo grave.
 */

import type { ServiceKind } from "./types";

export const colors = {
  bg: "#0b1220",
  bgElevated: "#121a2b",
  card: "#1a2336",
  border: "#253049",
  text: "#e6ecf5",
  textMuted: "#8a94a8",
  accent: "#4c9eff",
  onTime: "#3ecf8e",
  slightDelay: "#f6c34c",
  majorDelay: "#ff6b6b",
  white: "#ffffff",
} as const;

/** Color del badge/marker según retraso. */
export function delayColor(minutes: number): string {
  if (minutes <= 2) return colors.onTime;
  if (minutes <= 10) return colors.slightDelay;
  return colors.majorDelay;
}

/** Color de marca corporativa por tipo de servicio. */
export function serviceColor(service: ServiceKind): string {
  switch (service) {
    case "AVE":
      return "#9c1f2e";
    case "AVLO":
      return "#5b2a86";
    case "ALVIA":
      return "#1b6cc1";
    case "EUROMED":
      return "#0f8a6e";
    case "INTERCITY":
      return "#5a6373";
    case "TALGO":
      return "#c2410c";
    case "MD":
      return "#b88406";
    case "REGIONAL":
      return "#4b5563";
    case "CERCANIAS":
      return "#d97706";
    case "OUIGO":
      return "#ec4899";
    case "IRYO":
      return "#dc2626";
    default:
      return colors.textMuted;
  }
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;
