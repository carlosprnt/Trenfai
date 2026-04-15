import { StyleSheet, Text, View } from "react-native";

import { colors, delayColor, radius, spacing } from "../theme";

/**
 * Badge compacto que muestra el retraso en minutos. Verde si puntual, ámbar
 * si leve, rojo si grave. Adelantos (minutos negativos) se muestran en verde.
 */
export function DelayBadge({ minutes }: { minutes: number }) {
  const color = delayColor(minutes);
  const label = minutes === 0 ? "Puntual" : minutes > 0 ? `+${minutes} min` : `${minutes} min`;
  return (
    <View style={[styles.pill, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: colors.text,
  },
});
