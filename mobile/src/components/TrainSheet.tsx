import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTrainDetail } from "../hooks/useLiveTrains";
import { colors, radius, serviceColor, spacing } from "../theme";
import type { LiveTrain, StationStop } from "../types";
import { DelayBadge } from "./DelayBadge";

interface Props {
  train: LiveTrain | null;
  onClose: () => void;
}

/**
 * Bottom sheet con el detalle del tren seleccionado. Usa Gorhom para poder
 * arrastrarlo y tener snap points, como hace Flighty con los vuelos.
 */
export function TrainSheet({ train, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["35%", "75%"], []);

  const { data, isLoading } = useTrainDetail(train?.code ?? null);

  useEffect(() => {
    if (train) sheetRef.current?.snapToIndex(0);
    else sheetRef.current?.close();
  }, [train]);

  // Preferimos el detalle (que incluye paradas completas cuando esté) y si
  // todavía está cargando, caemos al train que venía del mapa.
  const display = data ?? train;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {!display ? null : (
          <>
            <View style={styles.header}>
              <View
                style={[
                  styles.servicePill,
                  { backgroundColor: serviceColor(display.service) },
                ]}
              >
                <Text style={styles.servicePillText}>{display.service}</Text>
              </View>
              <Text style={styles.code}>{display.code}</Text>
              <DelayBadge minutes={display.delayMinutes} />
            </View>

            <Text style={styles.route}>
              {display.origin || "—"}  →  {display.destination || "—"}
            </Text>

            <View style={styles.metaRow}>
              <Meta label="Velocidad" value={formatSpeed(display.speedKmh)} />
              <Meta label="Rumbo" value={formatHeading(display.heading)} />
              <Meta label="Material" value={display.rollingStock ?? "—"} />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Siguientes paradas</Text>
            {isLoading ? (
              <Text style={styles.muted}>Cargando…</Text>
            ) : (
              <View>
                {stopsOrFallback(display).map((stop, i) => (
                  <StopRow key={`${stop.code}-${i}`} stop={stop} />
                ))}
              </View>
            )}

            <Text style={styles.footnote}>
              Actualizado {formatTime(display.updatedAt)}
            </Text>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function StopRow({ stop }: { stop: StationStop }) {
  return (
    <View style={styles.stopRow}>
      <View
        style={[
          styles.stopDot,
          { backgroundColor: stop.departed ? colors.textMuted : colors.accent },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.stopName}>{stop.name || stop.code}</Text>
        {(stop.scheduled || stop.estimated) && (
          <Text style={styles.muted}>
            {stop.scheduled && `Prog. ${formatTime(stop.scheduled)}`}
            {stop.scheduled && stop.estimated && "   "}
            {stop.estimated && `Est. ${formatTime(stop.estimated)}`}
          </Text>
        )}
      </View>
    </View>
  );
}

function stopsOrFallback(t: LiveTrain | { stops: StationStop[] }): StationStop[] {
  if ("stops" in t && Array.isArray(t.stops) && t.stops.length > 0) return t.stops;
  const live = t as LiveTrain;
  return [live.previousStop, live.nextStop].filter(
    (s): s is StationStop => s !== null,
  );
}

function formatSpeed(v: number | null): string {
  return v == null ? "—" : `${Math.round(v)} km/h`;
}

function formatHeading(v: number | null): string {
  if (v == null) return "—";
  const bearings = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(v / 45) % 8;
  return `${Math.round(v)}° ${bearings[idx] ?? ""}`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.bgElevated },
  handle: { backgroundColor: colors.border },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  servicePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  servicePillText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  code: { color: colors.text, fontSize: 22, fontWeight: "700", flex: 1 },
  route: { color: colors.text, fontSize: 16 },
  metaRow: { flexDirection: "row", gap: spacing.lg },
  meta: { gap: 2 },
  metaLabel: { color: colors.textMuted, fontSize: 11, textTransform: "uppercase" },
  metaValue: { color: colors.text, fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  muted: { color: colors.textMuted, fontSize: 12 },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  stopDot: { width: 10, height: 10, borderRadius: 5 },
  stopName: { color: colors.text, fontSize: 14, fontWeight: "500" },
  footnote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
