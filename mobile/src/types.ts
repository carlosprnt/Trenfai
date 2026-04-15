/**
 * Tipos compartidos con el backend. En un monorepo real esto viviría en un
 * paquete común, pero para una app pequeña duplicamos —mantenerlo en sync es
 * trivial y evita añadir infraestructura de workspaces antes de tiempo.
 */

export type ServiceKind =
  | "AVE"
  | "AVLO"
  | "ALVIA"
  | "EUROMED"
  | "INTERCITY"
  | "TALGO"
  | "MD"
  | "REGIONAL"
  | "CERCANIAS"
  | "OUIGO"
  | "IRYO"
  | "UNKNOWN";

export type Operator = "RENFE" | "OUIGO" | "IRYO" | "UNKNOWN";

export interface StationStop {
  code: string;
  name: string;
  scheduled: string | null;
  estimated: string | null;
  departed: boolean;
}

export interface LiveTrain {
  code: string;
  service: ServiceKind;
  operator: Operator;
  origin: string;
  destination: string;
  lat: number;
  lon: number;
  heading: number | null;
  speedKmh: number | null;
  delayMinutes: number;
  previousStop: StationStop | null;
  nextStop: StationStop | null;
  rollingStock: string | null;
  updatedAt: string;
}

export interface TrainDetail extends LiveTrain {
  stops: StationStop[];
}

export interface LiveTrainsResponse {
  count: number;
  trains: LiveTrain[];
}

/** Billete guardado por el usuario. No sale del dispositivo. */
export interface SavedTicket {
  /** UUID local. */
  id: string;
  /** Código comercial del tren, ej. "03072". */
  trainCode: string;
  /** Fecha del viaje en formato YYYY-MM-DD. */
  date: string;
  /** Texto libre que introduce el usuario. */
  origin: string;
  destination: string;
  /** Hora de salida programada, opcional, HH:mm. */
  scheduledDeparture: string | null;
  /** Nota privada. */
  note: string | null;
  createdAt: string;
}
