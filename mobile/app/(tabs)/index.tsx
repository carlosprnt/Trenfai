import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { PROVIDER_DEFAULT } from "react-native-maps";

import { TrainMarker } from "../../src/components/TrainMarker";
import { TrainSheet } from "../../src/components/TrainSheet";
import { useLiveTrains } from "../../src/hooks/useLiveTrains";
import { useAppStore } from "../../src/store";
import { colors } from "../../src/theme";
import type { LiveTrain } from "../../src/types";

/**
 * Mapa en tiempo real de trenes activos. Centrado sobre España; el usuario
 * puede moverlo y hacer zoom libremente. Los markers se actualizan cada 15s.
 */
const INITIAL_REGION = {
  latitude: 40.0,
  longitude: -3.7,
  latitudeDelta: 9,
  longitudeDelta: 9,
};

export default function MapScreen() {
  const { data, isLoading, isError, error } = useLiveTrains();
  const filter = useAppStore((s) => s.serviceFilter);
  const [selected, setSelected] = useState<LiveTrain | null>(null);

  const trains = useMemo(() => {
    if (!data?.trains) return [];
    if (filter.length === 0) return data.trains;
    const set = new Set(filter);
    return data.trains.filter((t) => set.has(t.service));
  }, [data?.trains, filter]);

  const handleMarkerPress = useCallback((train: LiveTrain) => {
    setSelected(train);
  }, []);

  return (
    <View style={styles.root}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsCompass={false}
        showsUserLocation
        toolbarEnabled={false}
        onPress={() => setSelected(null)}
      >
        {trains.map((t) => (
          <TrainMarker key={t.code} train={t} onPress={handleMarkerPress} />
        ))}
      </MapView>

      <View style={styles.topBar}>
        <Text style={styles.count}>
          {isLoading
            ? "Cargando…"
            : isError
              ? "Sin conexión con el backend"
              : `${trains.length} trenes en ruta`}
        </Text>
        {isLoading && <ActivityIndicator color={colors.accent} />}
      </View>

      {isError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : "Error desconocido"}
          </Text>
        </View>
      )}

      <TrainSheet train={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: colors.bgElevated + "ee",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  count: { color: colors.text, fontSize: 13, fontWeight: "600", flex: 1 },
  errorBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    padding: 12,
    backgroundColor: colors.majorDelay + "33",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.majorDelay,
  },
  errorText: { color: colors.majorDelay, fontSize: 12, fontWeight: "600" },
});
