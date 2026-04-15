/**
 * Cache in-memory con TTL y coalescing de peticiones.
 *
 * Si llegan 100 peticiones simultáneas y el cache está vacío, solo se hace
 * una llamada al upstream: las otras 99 esperan al mismo promise. Esto es
 * importante para no martillear la API no documentada de Renfe.
 */
export class TtlCache<V> {
  private value: V | undefined;
  private expiresAt = 0;
  private inflight: Promise<V> | null = null;

  constructor(
    private readonly ttlMs: number,
    private readonly loader: () => Promise<V>,
  ) {}

  async get(): Promise<V> {
    const now = Date.now();
    if (this.value !== undefined && now < this.expiresAt) {
      return this.value;
    }
    if (this.inflight) return this.inflight;

    this.inflight = this.loader()
      .then((v) => {
        this.value = v;
        this.expiresAt = Date.now() + this.ttlMs;
        return v;
      })
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }

  /** Invalida el valor cacheado; la próxima llamada hará fetch fresco. */
  invalidate(): void {
    this.expiresAt = 0;
  }
}
