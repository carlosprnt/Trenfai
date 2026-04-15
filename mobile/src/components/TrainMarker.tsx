import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";

import { colors, delayColor, serviceColor } from "../theme";
import type { LiveTrain } from "../types";

interface Props {
  train: LiveTrain;
  onPress: (train: LiveTrain) => void;
}

/**
 * Marker del mapa con forma de "cápsula" orientada según rumbo.
 *
 * Usamos `Marker` con contenido custom (no `Marker.Image`) para que el estilo
 * siga la tipografía y los colores de la app. El borde indica retraso.
 */
export function TrainMarker({ train, onPress }: Props) {
  const fill = serviceColor(train.service);
  const border = delayColor(train.delayMinutes);

  return (
    <Marker
      coordinate={{ latitude: train.lat, longitude: train.lon }}
      onPress={() => onPress(train)}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
      // `tracksViewChanges={false}` mejora mucho el rendimiento cuando hay
      // decenas de markers: el mapa solo re-renderiza al cambiar de lista.
    >
      <View
        style={[
          styles.capsule,
          { backgroundColor: fill, borderColor: border },
          train.heading != null && { transform: [{ rotate: `${train.heading}deg` }] },
        ]}
      >
        <Text style={styles.label}>{train.code}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  capsule: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 2,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
