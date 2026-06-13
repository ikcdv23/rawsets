# RAWSETS — Gemini Instructions

This file provides architectural context, development standards, and operational guidelines for the RAWSETS project.

## Project Overview
RAWSETS is a workout tracker focused on **muscle balance analysis**. It is a local-first, multiplataform application (iOS, Android, Web) built with the Expo ecosystem.

### Core Stack
- **Framework:** Expo SDK 56 (React Native 0.85 + Expo Web).
- **Language:** TypeScript 6.0 (Strict mode).
- **Navigation:** `expo-router` (File-based).
- **Styling:** `NativeWind v4` (Tailwind CSS).
- **Database:** `Drizzle ORM` + `SQLite` (`expo-sqlite` for native, `sqlite-wasm` for web).
- **State Management:** `Zustand`.
- **Forms & Validation:** `React Hook Form` + `Zod`.
- **Package Manager:** `pnpm` (Monorepo).
- **Linter/Formatter:** `Biome`.

## Architecture & Conventions

### Architectural Pattern: Hexagonal + DDD + Vertical Slicing
The project follows a "Clean Architecture" approach optimized for a single developer.

- **Vertical Slicing:** Code is organized by feature (e.g., `features/workouts`, `features/exercises`).
- **Hexagonal Layers:**
    - `domain/`: Pure logic, entities, and value objects. No external dependencies.
    - `use-cases/`: Application logic. Orchestrates domain and ports.
    - `ports/`: Interfaces (contracts) for external dependencies (e.g., repositories).
    - `adapters/`: Implementations of ports (e.g., Drizzle repositories, API clients).
    - `ui/`: React components, hooks, and styles.
- **Shared Logic:** `packages/domain` contains logic shared between the mobile app and future backend (Fase 2).

### Coding Standards
- **Functional Domain:** Prefer pure functions and objects over classes. Use **Branded Types** and **Smart Constructors** for domain entities.
- **Error Handling:** Use a `Result<Ok, Err>` pattern for fallible operations in Use Cases and Adapters. Avoid `throw` for expected business errors.
- **Symmetry:** Both reads and writes should pass through a Use Case to maintain architectural consistency.
- **DI:** Manual Dependency Injection using factory functions (e.g., `makeLogSet(repo)`). No DI libraries.
- **Design Tokens:** Use semantic tokens via NativeWind (e.g., `bg-background`, `text-primary`).

## Project Structure
```text
rawsets/
├── apps/
│   └── mobile/           # Main Expo application
│       ├── src/
│       │   ├── app/      # Expo Router entry points
│       │   ├── features/ # Vertical Slices (Domain, Use Cases, Ports, Adapters, UI)
│       │   ├── db/       # Connection and Provider logic
│       │   ├── lib/      # Shared utilities
│       │   └── components/ # Shared UI components
├── packages/
│   └── domain/           # Shared domain logic for future backend
├── DOCS/                 # Extensive documentation (ADRs, specs, mockups)
└── package.json          # Workspace root
```

## Building and Running

### Common Commands
- `pnpm install`: Install dependencies.
- `pnpm start`: Start Expo dev server.
- `pnpm web`: Run the web version.
- `pnpm android`: Run on Android emulator/device.
- `pnpm ios`: Run on iOS simulator/device.
- `pnpm lint`: Run Biome check.
- `pnpm lint:fix`: Fix lint/format issues.
- `pnpm typecheck`: Run TypeScript compiler check.
- `pnpm drizzle:generate`: Generate Drizzle migrations (inside `apps/mobile`).

### Testing
- `pnpm test`: Run Vitest for domain logic (if configured).

## Key Files to Reference
- `DOCS/ficha-tecnica.md`: Technical specification and discovery decisions.
- `DOCS/adr/0001-arquitectura.md`: Detailed architectural decision record.
- `apps/mobile/src/app/_layout.tsx`: Root layout and providers.
- `apps/mobile/drizzle.config.ts`: Database configuration.
