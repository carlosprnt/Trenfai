import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { DelayBadge } from "../../src/components/DelayBadge";
import { useLiveTrains } from "../../src/hooks/useLiveTrains";
import { colors, radius, serviceColor, spacing } from "../../src/theme";
import type { LiveTrain } from "../../src/types";

/**
 * Búsqueda en memoria sobre la lista de trenes activos. Matchea por código,
 * origen o destino. Rápido y sin backend adicional: solo filtramos lo que ya
 * tenemos cacheado.
 */
export default function SearchScreen() {
  const router = useRouter();
  const { data, isLoading } = useLiveTrains();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data?.trains ?? [];
    return (data?.trains ?? []).filter(
      (t) =>
        t.code.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q),
    );
  }, [data?.trains, query]);

  return (
    <View style={styles.root}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Código, origen o destino"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(t) => t.code}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ResultRow
              train={item}
              onPress={() =>
                router.push({
                  pathname: "/train/[code]",
                  params: { code: item.code },
                })
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query ? "Sin resultados" : "No hay trenes activos"}
            </Text>
          }
        />
      )}
    </View>
  );
}

function ResultRow({ train, onPress }: { train: LiveTrain; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View
        style={[styles.servicePill, { backgroundColor: serviceColor(train.service) }]}
      >
        <Text style={styles.servicePillText}>{train.service}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.code}>{train.code}</Text>
        <Text style={styles.route} numberOfLines={1}>
          {train.origin} → {train.destination}
        </Text>
      </View>
      <DelayBadge minutes={train.delayMinutes} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  searchBox: {
    margin: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  separator: { height: 1, backgroundColor: colors.border },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  servicePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    minWidth: 56,
    alignItems: "center",
  },
  servicePillText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  code: { color: colors.text, fontSize: 15, fontWeight: "700" },
  route: { color: colors.textMuted, fontSize: 12 },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
