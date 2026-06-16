# 🏗️ Arquitectura Interna de RAWSETS

RAWSETS está construida siguiendo principios de **Arquitectura Hexagonal**, **DDD (Domain-Driven Design)** y **Vertical Slicing**.

## 📂 Estructura del Monorepo
- **`apps/mobile`**: La aplicación principal en Expo (React Native + Web).
- **`packages/`**: (En preparación) Lógica compartida y definiciones de DB para futuros backends.
- **`DOCS/`**: Documentación técnica, ADRs y este "Brain".

## 🧩 Slices Verticales (Características)
El código en `apps/mobile/src/features/` está organizado por funcionalidades, no por tipo de archivo:
- **`user`**: Gestión de perfil y onboarding.
- **`exercises`**: Catálogo y base de datos de ejercicios.
- **`routines`**: Creación y edición de rutinas.
- **`workouts`**: Sesión activa de entreno y radar de balance.
- **`scheduling`**: Calendario y planificación.

## 🏗️ Capas de un Slice (Hexagonal)
Cada característica se divide en 4 capas para mantener el código limpio y testeable:
1.  **`domain/`**: Reglas de negocio puras (tipos, funciones sin efectos secundarios).
2.  **`use-cases/`**: Orquestación de la lógica. "Lo que la app puede hacer".
3.  **`ports/`**: Interfaces (contratos) que definen qué necesita el slice del mundo exterior.
4.  **`adapters/`**: Implementaciones reales (ej. SQLite, API de Supabase).

## 💡 Patrones Clave
- **Dependency Injection**: Usamos un `RepoProvider` para inyectar los adaptadores en la UI.
- **Result Pattern**: Las funciones devuelven `{ ok: true, value }` o `{ ok: false, error }` para un manejo de errores explícito y sin excepciones sorpresa.
- **Local-First**: Todo se guarda en una base de datos SQLite local (usando `expo-sqlite`).
