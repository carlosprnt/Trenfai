import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppStore } from "../../src/store";
import { colors, radius, spacing } from "../../src/theme";

/**
 * Formulario modal para añadir un billete manualmente.
 *
 * No validamos contra la API: el usuario puede guardar un tren futuro que
 * todavía no está activo. Cuando esté en marcha, la pantalla de "Mis trenes"
 * lo cruzará con `/api/trains/live` y mostrará el estado en vivo.
 */
export default function NewTicketScreen() {
  const router = useRouter();
  const addTicket = useAppStore((s) => s.addTicket);

  const [trainCode, setTrainCode] = useState("");
  const [date, setDate] = useState(todayIso());
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [scheduledDeparture, setScheduledDeparture] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSave =
    trainCode.trim().length > 0 &&
    origin.trim().length > 0 &&
    destination.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(date);

  function onSave() {
    if (!canSave) {
      setError("Rellena tren, fecha (YYYY-MM-DD), origen y destino.");
      return;
    }
    addTicket({
      trainCode: trainCode.trim(),
      date,
      origin: origin.trim(),
      destination: destination.trim(),
      scheduledDeparture: scheduledDeparture.trim() || null,
      note: note.trim() || null,
    });
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Field
          label="Código de tren"
          value={trainCode}
          onChangeText={setTrainCode}
          placeholder="03072"
          autoCapitalize="characters"
        />
        <Field
          label="Fecha (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholder="2026-05-10"
        />
        <Field
          label="Origen"
          value={origin}
          onChangeText={setOrigin}
          placeholder="Madrid-Puerta de Atocha"
        />
        <Field
          label="Destino"
          value={destination}
          onChangeText={setDestination}
          placeholder="Barcelona-Sants"
        />
        <Field
          label="Salida programada (HH:mm)"
          value={scheduledDeparture}
          onChangeText={setScheduledDeparture}
          placeholder="09:00"
        />
        <Field
          label="Nota"
          value={note}
          onChangeText={setNote}
          placeholder="Reserva #ABC123"
          multiline
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          disabled={!canSave}
          onPress={onSave}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  ...input
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  autoCapitalize?: "none" | "characters" | "words" | "sentences";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, input.multiline && styles.multiline]}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        {...input}
      />
    </View>
  );
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  field: { gap: 6 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  error: { color: colors.majorDelay, fontSize: 13, textAlign: "center" },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.white, fontSize: 15, fontWeight: "700" },
});
