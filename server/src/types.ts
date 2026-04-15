/**
 * Tipos normalizados que el backend expone al cliente.
 *
 * Son independientes del proveedor. Si mañana Renfe cambia el formato de
 * flotaLD.json, o añadimos un proveedor para Cercanías / Ouigo, solo cambia
 * el adaptador (carpeta `providers/`). El cliente sigue viendo lo mismo.
 */

/** Tipo de servicio comercial. */
export type ServiceKind =
  | "AVE"
  | "AVLO"
  | "ALVIA"
  | "EUROMED"
  | "INTERCITY"
  | "TALGO"
  | "MD" // Media Distancia
  | "REGIONAL"
  | "CERCANIAS"
  | "OUIGO"
  | "IRYO"
  | "UNKNOWN";

/** Operador comercial que vende el billete. */
export type Operator = "RENFE" | "OUIGO" | "IRYO" | "UNKNOWN";

/** Paso del tren por una estación con hora programada y estimada. */
export interface StationStop {
  /** Código oficial de estación (ADIF). */
  code: string;
  name: string;
  /** Hora programada en ISO-8601 con zona horaria Europe/Madrid. */
  scheduled: string | null;
  /** Hora estimada o real si el tren ya ha pasado. */
  estimated: string | null;
  /** Si el tren ya la ha dejado atrás. */
  departed: boolean;
}

/** Un tren activo en la red, tal como lo ve el cliente. */
export interface LiveTrain {
  /** Código comercial (ej. "03072"). Único para el día de servicio. */
  code: string;
  /** Servicio comercial (AVE, Alvia, etc.). */
  service: ServiceKind;
  operator: Operator;
  /** Origen y destino en lenguaje humano. */
  origin: string;
  destination: string;
  /** Coordenadas actuales. */
  lat: number;
  lon: number;
  /** Rumbo en grados [0, 360) si está disponible. */
  heading: number | null;
  /** Velocidad en km/h si está disponible. */
  speedKmh: number | null;
  /** Retraso acumulado en minutos. Negativo = va adelantado. */
  delayMinutes: number;
  /** Última parada pasada y próxima parada. */
  previousStop: StationStop | null;
  nextStop: StationStop | null;
  /** Material rodante (ej. "S-103"). */
  rollingStock: string | null;
  /** Timestamp ISO-8601 de la última actualización recibida del proveedor. */
  updatedAt: string;
}

/** Detalle de un tren (añade la ruta completa a `LiveTrain`). */
export interface TrainDetail extends LiveTrain {
  /** Todas las paradas del servicio en orden. */
  stops: StationStop[];
}

/** Error HTTP estructurado. */
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
