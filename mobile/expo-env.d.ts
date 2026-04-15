/// <reference types="expo/types" />

// Declaración necesaria para EXPO_PUBLIC_* en TypeScript estricto.
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_URL?: string;
  }
}
