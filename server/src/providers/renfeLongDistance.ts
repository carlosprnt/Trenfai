/**
 * Adaptador para la API no documentada `flotaLD.json` que Renfe usa para su
 * visor en tiempo real de larga y media distancia.
 *
 * El endpoint no tiene token ni cookies; solo un parámetro `v` con el epoch
 * en milisegundos como cache-buster. Se actualiza cada ~15 segundos.
 *
 * Nombres de campos del upstream: Renfe usa una mezcla de español y claves
 * abreviadas (`ultRetraso`, `numeroTren`, `estOrigen`, etc.). Los mapeamos a
 * nuestros tipos estables en `../types.ts`. Si un campo falta, devolvemos
 * null en vez de reventar —la API no tiene contrato y cualquier cosa puede
 * estar ausente en cualquier momento.
 */

import type { LiveTrain, Operator, ServiceKind, StationStop } from "../types.js";

/** Respuesta bruta esperada del upstream. Todos los campos son opcionales. */
interface RawRenfeFleetResponse {
  /** Algunos dumps envuelven la flota en `trenes`, otros la devuelven directa. */
  trenes?: RawRenfeTrain[];
}

interface RawRenfeTrain {
  numeroTren?: string | number;
  tipoTren?: string; // "AVE", "ALVIA", "MD", ...
  cdgoOrigen?: string;
  estOrigen?: string;
  cdgoDestino?: string;
  estDestino?: string;
  latitud?: string | number;
  longitud?: string | number;
  rumbo?: string | number;
  velocidad?: string | number;
  /** Retraso acumulado en minutos. Puede venir como string. */
  ultRetraso?: string | number;
  /** Estación previa. */
  cdgoEstacionPrevia?: string;
  nombreEstacionPrevia?: string;
  horaProgramadaPrevia?: string;
  horaRealPrevia?: string;
  /** Próxima estación. */
  cdgoEstacionProxima?: string;
  nombreEstacionProxima?: string;
  horaProgramadaProxima?: string;
  horaEstimadaProxima?: string;
  /** Material rodante. */
  composicion?: string;
  material?: string;
  /** Timestamp servidor. */
  fechaHoraActualizacion?: string;
}

export interface RenfeProviderOptions {
  flotaUrl: string;
  userAgent: string;
  /** Inyectable para testear sin red. */
  fetchFn?: typeof fetch;
}

export class RenfeLongDistanceProvider {
  constructor(private readonly opts: RenfeProviderOptions) {}

  async fetchLiveTrains(): Promise<LiveTrain[]> {
    const url = `${this.opts.flotaUrl}?v=${Date.now()}`;
    const fetcher = this.opts.fetchFn ?? fetch;

    const res = await fetcher(url, {
      headers: {
        "User-Agent": this.opts.userAgent,
        Accept: "application/json,text/plain,*/*",
        // Renfe a veces devuelve gzip incluso sin pedirlo; Node fetch lo gestiona.
      },
    });

    if (!res.ok) {
      throw new Error(
        `Renfe flotaLD upstream error: ${res.status} ${res.statusText}`,
      );
    }

    const body = (await res.json()) as RawRenfeFleetResponse | RawRenfeTrain[];
    const rawTrains: RawRenfeTrain[] = Array.isArray(body)
      ? body
      : (body.trenes ?? []);

    const now = new Date().toISOString();
    return rawTrains
      .map((raw) => this.normalize(raw, now))
      .filter((t): t is LiveTrain => t !== null);
  }

  private normalize(raw: RawRenfeTrain, now: string): LiveTrain | null {
    const code = raw.numeroTren != null ? String(raw.numeroTren) : null;
    const lat = toNumber(raw.latitud);
    const lon = toNumber(raw.longitud);

    // Sin estas 3, el tren no es útil para mostrarlo.
    if (!code || lat === null || lon === null) return null;

    return {
      code,
      service: normalizeService(raw.tipoTren),
      operator: "RENFE" satisfies Operator,
      origin: raw.estOrigen ?? "",
      destination: raw.estDestino ?? "",
      lat,
      lon,
      heading: toNumber(raw.rumbo),
      speedKmh: toNumber(raw.velocidad),
      delayMinutes: toNumber(raw.ultRetraso) ?? 0,
      previousStop: buildStop(
        raw.cdgoEstacionPrevia,
        raw.nombreEstacionPrevia,
        raw.horaProgramadaPrevia,
        raw.horaRealPrevia,
        true,
      ),
      nextStop: buildStop(
        raw.cdgoEstacionProxima,
        raw.nombreEstacionProxima,
        raw.horaProgramadaProxima,
        raw.horaEstimadaProxima,
        false,
      ),
      rollingStock: raw.composicion ?? raw.material ?? null,
      updatedAt: raw.fechaHoraActualizacion ?? now,
    };
  }
}

function toNumber(v: string | number | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function buildStop(
  code: string | undefined,
  name: string | undefined,
  scheduled: string | undefined,
  estimated: string | undefined,
  departed: boolean,
): StationStop | null {
  if (!code && !name) return null;
  return {
    code: code ?? "",
    name: name ?? "",
    scheduled: scheduled ?? null,
    estimated: estimated ?? null,
    departed,
  };
}

function normalizeService(tipo: string | undefined): ServiceKind {
  if (!tipo) return "UNKNOWN";
  const t = tipo.toUpperCase().trim();
  if (t.includes("AVLO")) return "AVLO";
  if (t.includes("AVE")) return "AVE";
  if (t.includes("ALVIA")) return "ALVIA";
  if (t.includes("EUROMED")) return "EUROMED";
  if (t.includes("INTERCITY")) return "INTERCITY";
  if (t.includes("TALGO")) return "TALGO";
  if (t === "MD" || t.includes("MEDIA")) return "MD";
  if (t.includes("REGIONAL")) return "REGIONAL";
  return "UNKNOWN";
}
