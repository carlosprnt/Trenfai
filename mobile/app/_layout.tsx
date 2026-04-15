import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "../src/theme";

/**
 * Layout raíz. Inicializa providers globales:
 *  - QueryClient para datos remotos.
 *  - GestureHandlerRootView requerido por @gorhom/bottom-sheet.
 *  - SafeAreaProvider para respetar notch/home-bar.
 *
 * Se monta UNA sola vez: no colocar `useMemo` en layouts hijos para el client.
 */
export default function RootLayout() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 5_000,
          },
        },
      }),
    [],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: "700" },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="train/[code]" options={{ title: "Tren" }} />
            <Stack.Screen
              name="ticket/new"
              options={{ presentation: "modal", title: "Nuevo billete" }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
