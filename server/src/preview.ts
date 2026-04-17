/**
 * HTML autocontenido que renderiza el mapa de trenes en un navegador.
 * Usa Leaflet (CDN) y la API del propio backend. No es la app final
 * (esa es Expo/React Native), es un preview rápido para visualizar los datos.
 */

export function previewHtml(apiBase: string): string {
  return /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trenfai · Preview</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b1220; color: #e6ecf5; }
  #map { width: 100vw; height: 100vh; }

  .top-bar {
    position: fixed; top: 12px; left: 12px; right: 12px; z-index: 1000;
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; background: rgba(18,26,43,0.92);
    border-radius: 14px; border: 1px solid #253049;
    backdrop-filter: blur(12px);
  }
  .top-bar h1 { font-size: 16px; font-weight: 800; letter-spacing: -0.3px; }
  .top-bar .count { font-size: 13px; color: #8a94a8; margin-left: auto; }
  .top-bar .dot { width: 8px; height: 8px; border-radius: 50%; background: #3ecf8e; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  .leaflet-popup-content-wrapper {
    background: #1a2336 !important; color: #e6ecf5 !important;
    border-radius: 14px !important; border: 1px solid #253049 !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
  }
  .leaflet-popup-tip { background: #1a2336 !important; }
  .leaflet-popup-content { margin: 14px 16px !important; min-width: 220px; }

  .popup-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .popup-header .service { padding: 2px 10px; border-radius: 999px; color: #fff; font-size: 11px; font-weight: 700; }
  .popup-header .code { font-size: 20px; font-weight: 800; }
  .popup-delay { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; border: 1px solid; margin-bottom: 8px; }
  .popup-route { font-size: 14px; margin-bottom: 6px; }
  .popup-route .arrow { color: #4c9eff; margin: 0 6px; }
  .popup-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
  .popup-meta dt { font-size: 10px; text-transform: uppercase; color: #8a94a8; letter-spacing: 0.3px; }
  .popup-meta dd { font-size: 13px; font-weight: 600; margin: 0; }
  .popup-stops { border-top: 1px solid #253049; padding-top: 8px; }
  .popup-stops .stop { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
  .popup-stops .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .popup-stops .stop-name { font-size: 13px; font-weight: 500; }
  .popup-stops .stop-time { font-size: 11px; color: #8a94a8; }

  .legend {
    position: fixed; bottom: 16px; left: 12px; z-index: 1000;
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 10px 14px; background: rgba(18,26,43,0.92);
    border-radius: 12px; border: 1px solid #253049;
    backdrop-filter: blur(12px); max-width: calc(100vw - 24px);
  }
  .legend-item {
    display: flex; align-items: center; gap: 4px; font-size: 11px; color: #8a94a8;
    cursor: pointer; padding: 3px 8px; border-radius: 999px; transition: all 0.2s;
    border: 1px solid transparent;
  }
  .legend-item:hover { color: #e6ecf5; }
  .legend-item.active { border-color: #4c9eff; color: #e6ecf5; background: rgba(76,158,255,0.12); }
  .legend-item .swatch { width: 10px; height: 10px; border-radius: 3px; }

  .leaflet-control-zoom a { background: #1a2336 !important; color: #e6ecf5 !important; border-color: #253049 !important; }
  .leaflet-control-zoom a:hover { background: #253049 !important; }
</style>
</head>
<body>
<div class="top-bar">
  <div class="dot"></div>
  <h1>Trenfai</h1>
  <span class="count" id="count">Cargando…</span>
</div>

<div id="map"></div>

<div class="legend" id="legend"></div>

<script>
const API = '${apiBase}';
const REFRESH_MS = 15000;

const SERVICE_COLORS = {
  AVE: '#9c1f2e', AVLO: '#5b2a86', ALVIA: '#1b6cc1', EUROMED: '#0f8a6e',
  INTERCITY: '#5a6373', TALGO: '#c2410c', MD: '#b88406', REGIONAL: '#4b5563',
  CERCANIAS: '#d97706', OUIGO: '#ec4899', IRYO: '#dc2626', UNKNOWN: '#8a94a8'
};

function delayColor(m) {
  if (m <= 2) return '#3ecf8e';
  if (m <= 10) return '#f6c34c';
  return '#ff6b6b';
}

function delayLabel(m) {
  if (m === 0) return 'Puntual';
  return m > 0 ? '+' + m + ' min' : m + ' min';
}

const map = L.map('map', {
  center: [40.0, -3.7],
  zoom: 6,
  zoomControl: true,
  attributionControl: false,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
}).addTo(map);

L.control.attribution({ prefix: false, position: 'bottomright' })
  .addAttribution('© <a href="https://carto.com/">CARTO</a> · Datos: Renfe (no oficial)')
  .addTo(map);

let markers = {};
let activeFilters = new Set();

function makeIcon(train) {
  const fill = SERVICE_COLORS[train.service] || SERVICE_COLORS.UNKNOWN;
  const border = delayColor(train.delayMinutes);
  const rotation = train.heading != null ? train.heading : 0;
  return L.divIcon({
    className: '',
    iconSize: [0, 0],
    iconAnchor: [24, 14],
    popupAnchor: [0, -18],
    html: \`<div style="
      display: flex; align-items: center; justify-content: center;
      min-width: 48px; padding: 4px 10px;
      background: \${fill}; border: 2px solid \${border};
      border-radius: 14px; color: #fff; font-size: 11px; font-weight: 700;
      white-space: nowrap; letter-spacing: 0.3px;
      transform: rotate(\${rotation}deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    ">\${train.code}</div>\`
  });
}

function makePopup(t) {
  const dc = delayColor(t.delayMinutes);
  let stops = '';
  if (t.previousStop || t.nextStop) {
    stops = '<div class="popup-stops">';
    if (t.previousStop) stops += stopHtml(t.previousStop, true);
    if (t.nextStop) stops += stopHtml(t.nextStop, false);
    stops += '</div>';
  }
  return \`
    <div class="popup-header">
      <span class="service" style="background:\${SERVICE_COLORS[t.service] || '#8a94a8'}">\${t.service}</span>
      <span class="code">\${t.code}</span>
    </div>
    <div class="popup-delay" style="color:\${dc};border-color:\${dc};background:\${dc}22">\${delayLabel(t.delayMinutes)}</div>
    <div class="popup-route">\${t.origin || '—'}<span class="arrow">→</span>\${t.destination || '—'}</div>
    <dl class="popup-meta">
      <dt>Velocidad</dt><dd>\${t.speedKmh != null ? Math.round(t.speedKmh) + ' km/h' : '—'}</dd>
      <dt>Material</dt><dd>\${t.rollingStock || '—'}</dd>
    </dl>
    \${stops}
  \`;
}

function stopHtml(s, departed) {
  const color = departed ? '#8a94a8' : '#4c9eff';
  const times = [];
  if (s.scheduled) times.push('Prog. ' + s.scheduled);
  if (s.estimated) times.push('Est. ' + s.estimated);
  return \`<div class="stop">
    <div class="dot" style="background:\${color}"></div>
    <div><div class="stop-name">\${s.name || s.code}</div>
    \${times.length ? '<div class="stop-time">' + times.join(' · ') + '</div>' : ''}
    </div>
  </div>\`;
}

function buildLegend(trains) {
  const services = [...new Set(trains.map(t => t.service))].sort();
  const el = document.getElementById('legend');
  el.innerHTML = '';
  services.forEach(s => {
    const item = document.createElement('div');
    item.className = 'legend-item' + (activeFilters.size === 0 || activeFilters.has(s) ? ' active' : '');
    item.innerHTML = \`<div class="swatch" style="background:\${SERVICE_COLORS[s] || '#8a94a8'}"></div>\${s}\`;
    item.onclick = () => {
      if (activeFilters.has(s)) activeFilters.delete(s);
      else activeFilters.add(s);
      refresh();
    };
    el.appendChild(item);
  });
}

async function fetchTrains() {
  const res = await fetch(API + '/api/trains/live');
  const data = await res.json();
  return data.trains || [];
}

async function refresh() {
  try {
    const trains = await fetchTrains();
    const filtered = activeFilters.size === 0
      ? trains
      : trains.filter(t => activeFilters.has(t.service));

    document.getElementById('count').textContent = filtered.length + ' trenes en ruta';

    const seen = new Set();
    filtered.forEach(t => {
      seen.add(t.code);
      if (markers[t.code]) {
        markers[t.code].setLatLng([t.lat, t.lon]);
        markers[t.code].setIcon(makeIcon(t));
        markers[t.code].setPopupContent(makePopup(t));
      } else {
        markers[t.code] = L.marker([t.lat, t.lon], { icon: makeIcon(t) })
          .bindPopup(makePopup(t), { maxWidth: 300 })
          .addTo(map);
      }
    });

    Object.keys(markers).forEach(code => {
      if (!seen.has(code)) {
        map.removeLayer(markers[code]);
        delete markers[code];
      }
    });

    buildLegend(trains);
  } catch (err) {
    document.getElementById('count').textContent = 'Error: ' + err.message;
  }
}

refresh();
setInterval(refresh, REFRESH_MS);
<\/script>
</body>
</html>`;
}
