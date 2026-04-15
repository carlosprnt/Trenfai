import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DelayBadge } from "../../src/components/DelayBadge";
import { useTrainDetail } from "../../src/hooks/useLiveTrains";
import { colors, radius, serviceColor, spacing } from "../../src/theme";
import type { StationStop } from "../../src/types";

/**
 * Ficha completa de un tren, accesible desde "Mis trenes" o desde búsqueda.
 * Comparte look con el bottom sheet pero a pantalla completa y con pull-to-refresh.
 */
export default function TrainDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { data, isLoading, isError, error, refetch, isRefetching } = useTrainDetail(
    code ?? null,
  );

  if (!code) {
    return <Center message="Código de tren no válido" />;
  }

  if (isLoading) {
    return (
      <Center>
        <ActivityIndicator color={colors.accent} />
      </Center>
    );
  }

  if (isError || !data) {
    return (
      <Center
        message={
          error instanceof Error ? error.message : "El tren no está activo en este momento"
        }
      />
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.accent}
        />
      }
    >
      <View style={styles.header}>
        <View
          style={[styles.servicePill, { backgroundColor: serviceColor(data.service) }]}
        >
          <Text style={styles.servicePillText}>{data.service}</Text>
        </View>
        <Text style={styles.code}>{data.code}</Text>
        <DelayBadge minutes={data.delayMinutes} />
      </View>

      <Text style={styles.route}>
        {data.origin || "—"}   →   {data.destination || "—"}
      </Text>

      <View style={styles.metaGrid}>
        <MetaCell label="Velocidad" value={formatSpeed(data.speedKmh)} />
        <MetaCell label="Rumbo" value={formatHeading(data.heading)} />
        <MetaCell label="Material" value={data.rollingStock ?? "—"} />
        <MetaCell label="Operador" value={data.operator} />
      </View>

      <Text style={styles.sectionTitle}>Paradas</Text>
      {data.stops.length === 0 ? (
        <Text style={styles.muted}>
          Sin información de paradas. (La ruta completa requiere integración con GTFS.)
        </Text>
      ) : (
        data.stops.map((stop, i) => <StopRow key={`${stop.code}-${i}`} stop={stop} />)
      )}

      <Text style={styles.footnote}>
        Actualizado {formatTime(data.updatedAt)} · Posición {data.lat.toFixed(4)},{" "}
        {data.lon.toFixed(4)}
      </Text>
    </ScrollView>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
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

function Center({ message, children }: { message?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.center}>
      {children}
      {message && <Text style={styles.muted}>{message}</Text>}
    </View>
  );
}

function formatSpeed(v: number | null): string {
  return v == null ? "—" : `${Math.round(v)} km/h`;
}

function formatHeading(v: number | null): string {
  if (v == null) return "—";
  return `${Math.round(v)}°`;
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
  root: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  servicePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  servicePillText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  code: { color: colors.text, fontSize: 24, fontWeight: "700", flex: 1 },
  route: { color: colors.text, fontSize: 17 },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaCell: {
    flexBasis: "45%",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaValue: { color: colors.text, fontSize: 15, fontWeight: "600", marginTop: 2 },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: spacing.md,
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
    textAlign: "center",
    marginTop: spacing.lg,
  },
});
