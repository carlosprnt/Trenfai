# Trenfai

Rastreador de trenes españoles en tiempo real, inspirado en Flighty.

Muestra en un mapa las posiciones GPS de los trenes de Renfe (AVE, Alvia, Avlo,
Intercity, Media Distancia) usando la API pública no documentada `flotaLD.json`
que alimenta el visor oficial de Renfe. Permite guardar tus billetes de forma
manual y consultar el estado del viaje.

> **Aviso.** La API utilizada no es oficial. Renfe la expone para su propio
> visor y puede cambiar o desaparecer sin previo aviso. Este proyecto es
> educativo y no está afiliado a Renfe ni a ADIF.

## Arquitectura

```
┌──────────────┐    HTTPS    ┌──────────────┐    HTTPS    ┌──────────────┐
│  Expo app    │ ──────────► │   Backend    │ ──────────► │  Renfe API   │
│ (iOS/Android)│             │  (Hono/Node) │             │ flotaLD.json │
└──────────────┘             └──────────────┘             └──────────────┘
                                    │
                                    └─ Cache in-memory + normalización
```

El **backend** (carpeta `server/`) actúa como proxy:

- Esconde al cliente el endpoint no documentado.
- Normaliza la respuesta a un tipo estable (`LiveTrain`).
- Añade cache para no martillear la API origen.
- Podrá añadir otros proveedores (Cercanías, Ouigo, Iryo) sin cambiar el cliente.

La **app móvil** (carpeta `mobile/`) es una app Expo con Expo Router:

- **Mapa** con todos los trenes activos (refresco cada 15s).
- **Detalle** del tren: trayecto, retraso, próxima parada, ETA.
- **Mis trenes**: el usuario introduce manualmente el código de tren y fecha,
  y la app lo sigue y avisa de retrasos.
- **Buscar** por código de tren o por origen-destino.

## Puesta en marcha

### 1) Backend

```bash
cd server
cp .env.example .env      # ajusta RENFE_FLOTA_URL si hace falta
npm install
npm run dev               # http://localhost:4000
```

Endpoints expuestos:

| Método | Ruta                 | Descripción                                      |
| ------ | -------------------- | ------------------------------------------------ |
| GET    | `/health`            | Healthcheck.                                     |
| GET    | `/api/trains/live`   | Lista de todos los trenes activos.               |
| GET    | `/api/trains/:code`  | Detalle de un tren por `numeroTren`.             |

### 2) App móvil

```bash
cd mobile
cp .env.example .env      # apunta EXPO_PUBLIC_API_URL al backend
npm install
npm run start             # abre Expo; escanea el QR con Expo Go
```

## Roadmap

- [x] Mapa en tiempo real con trenes de larga distancia.
- [x] Detalle de tren con retraso y próxima parada.
- [x] Guardar trenes manualmente ("Mis trenes").
- [ ] Alertas push de retraso (requiere backend con cron).
- [ ] Importar billetes desde el PDF/email de Renfe.
- [ ] Proveedor de Cercanías.
- [ ] Proveedor de Ouigo / Iryo (scraping).

## Fuentes

- Renfe Data — <https://data.renfe.com/>
- Visor tiempo real Renfe — <https://tiempo-real.largorecorrido.renfe.com/>
- _RENFE tiene una API pública no documentada…_ — Víctor Viloria, Medium, 2026.

## Licencia

MIT.
