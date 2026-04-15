import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DelayBadge } from "../../src/components/DelayBadge";
import { useLiveTrains } from "../../src/hooks/useLiveTrains";
import { useAppStore } from "../../src/store";
import { colors, radius, spacing } from "../../src/theme";
import type { LiveTrain, SavedTicket } from "../../src/types";

/**
 * "Mis trenes": billetes que el usuario ha guardado manualmente. Si el tren
 * está activo en este momento, mostramos su estado en vivo (retraso, próxima
 * parada). Tocar una fila abre la ficha del tren.
 */
export default function TripsScreen() {
  const router = useRouter();
  const tickets = useAppStore((s) => s.tickets);
  const removeTicket = useAppStore((s) => s.removeTicket);
  const { data } = useLiveTrains();

  const liveByCode = useMemo(() => {
    const map = new Map<string, LiveTrain>();
    for (const t of data?.trains ?? []) map.set(t.code, t);
    return map;
  }, [data]);

  return (
    <View style={styles.root}>
      {tickets.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              live={liveByCode.get(item.trainCode) ?? null}
              onPress={() =>
                router.push({
                  pathname: "/train/[code]",
                  params: { code: item.trainCode },
                })
              }
              onRemove={() => removeTicket(item.id)}
            />
          )}
        />
      )}

      <Link href="/ticket/new" asChild>
        <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      </Link>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Ionicons name="ticket-outline" size={48} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>Aún no has guardado ningún tren</Text>
      <Text style={styles.emptyBody}>
        Añade el código de tren de tu billete para seguirlo en tiempo real.
      </Text>
    </View>
  );
}

function TicketCard({
  ticket,
  live,
  onPress,
  onRemove,
}: {
  ticket: SavedTicket;
  live: LiveTrain | null;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.code}>{ticket.trainCode}</Text>
        {live ? (
          <DelayBadge minutes={live.delayMinutes} />
        ) : (
          <Text style={styles.inactive}>Sin datos en vivo</Text>
        )}
      </View>
      <Text style={styles.route}>
        {ticket.origin} → {ticket.destination}
      </Text>
      <Text style={styles.meta}>
        {ticket.date}
        {ticket.scheduledDeparture ? `   ·   ${ticket.scheduledDeparture}` : ""}
      </Text>
      {live?.nextStop && (
        <Text style={styles.nextStop}>
          Próxima: {live.nextStop.name || live.nextStop.code}
        </Text>
      )}
      <Pressable onPress={onRemove} hitSlop={12} style={styles.removeBtn}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyBody: { color: colors.textMuted, fontSize: 13, textAlign: "center" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 6,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  code: { color: colors.text, fontSize: 18, fontWeight: "700" },
  route: { color: colors.text, fontSize: 14 },
  meta: { color: colors.textMuted, fontSize: 12 },
  nextStop: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  inactive: { color: colors.textMuted, fontSize: 11, fontStyle: "italic" },
  removeBtn: { position: "absolute", top: 8, right: 8, padding: 4 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
