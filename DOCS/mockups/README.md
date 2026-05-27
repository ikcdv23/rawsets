# Mockups de RAWSETS

Maquetas HTML de alta fidelidad para iterar UI/UX **antes** de implementarla en React Native. Es decisión consciente: separar diseño de implementación reduce coste de cambio en órdenes de magnitud.

## Por qué este flujo

- **Iteración barata**: cambiar 5 líneas de CSS vs 5 archivos RN + state + navigation.
- **Coherencia**: ver todas las pantallas juntas evita drift entre primera y última.
- **Validación temprana**: las dudas se resuelven en HTML, no en código de producción.
- **Desacoplar UX de implementación**: no se mezclan decisiones de diseño con decisiones de stack.

## Estructura

```
DOCS/mockups/
├── README.md              ← este archivo
├── index.html             ← entry point → redirige a home-to-workout.html
│
│   ── PANTALLAS PRINCIPALES (navegables entre sí vía tab bar) ──
├── home-to-workout.html   ← ★ HOME CANÓNICO: radar hero + workout sheet (slide-up). Reemplaza home.html
├── routines.html          ← Rutinas: calendario hero + lista de rutinas
├── body.html              ← Body: humanoid + balance + medidas + metas (reemplaza Stats)
├── settings.html          ← Ajustes: perfil + preferencias + notifs + datos
│
│   ── SUB-PANTALLAS ──
├── auth.html              ← login + register + recuperar contraseña (Fase 2 — backend)
├── routine-detail.html    ← ver/editar rutina (desde Rutinas)
├── profile.html           ← perfil + insignias/logros + notificación de logro (desde avatar de Home)
├── onboarding.html        ← wizard paginado de primera apertura (7 pasos)
├── finish-workout.html    ← summary tras terminar entreno
│
│   ── OVERLAYS / SHEETS ──
├── exercise-picker.html   ← bottom sheet para añadir ejercicio
├── rest-timer.html        ← overlay de descanso (ring countdown)
├── modals.html            ← showcase: éxito, crear rutina, PR, descartar, borrar
│
│   ── REFERENCIA ──
├── components.html        ← galería UX: cargas, checks, toasts, badges, estados vacíos
├── home.html              ← (legacy) versión Forge sin radar
└── home-radar.html        ← (legacy) Home con radar aislado, sin transición a workout
```

## Mapa de navegación (prototipo navegable)

```
index.html
   └→ home-to-workout.html  ←──────────────┐
        ├ tap strip workout → workout sheet (slide-up, mismo archivo)
        ├ tap avatar (JA)   → profile.html ─┘ (back vuelve a Home)
        │                         └ tap medalla → diálogo de logro
        │                         └ icono ⚙ → settings.html
        ├ tab Rutinas → routines.html
        │                  ├ tap rutina → routine-detail.html → "Empezar" → Home
        │                  └ tap día dashed → sheet de asignar (mismo archivo)
        ├ tab Body    → body.html
        └ tab Ajustes → settings.html

auth.html (Fase 2)
   ├ Login → "Entrar" → home-to-workout.html
   └ Register → "Crear cuenta" → onboarding.html → "Crear primera rutina" → routines.html
```

> **Entry point**: en la app real (Fase 2 con backend) → `auth.html` → (si nuevo) `onboarding.html` → Home. En Fase 1 (local, sin cuentas) → primera apertura `onboarding.html`, siguientes → Home. En el prototipo, `index.html` va directo a Home para iterar rápido; auth y onboarding se revisan abriéndolos aparte.

## Reglas del juego

- **Una pantalla por archivo**. No mezclar pantallas en el mismo HTML salvo para variantes (ej. `home.html` vs `home-radar.html`).
- **Tokens y patrones consistentes**: copiar el bloque `:root` y los patrones visuales del último mockup aprobado (actualmente `home-radar.html`). NO inventar valores nuevos sin razón.
- **Self-contained**: cada HTML incluye su CSS y assets inline. No dependencias externas salvo Google Fonts.
- **Mobile-first**: frame de iPhone 16 Pro (390 × 844 px). Solo móvil — la responsividad web vendrá después.
- **Estados visibles**: cuando una pantalla tenga estados (idle, loading, empty, en curso, error), incluir todos en el mismo HTML con un toggle JS simple.
- **Antes de pasar a código RN**: la pantalla debe estar **aprobada explícitamente** por Javier. La aprobación queda como commit en este directorio.

## Patrón visual canónico

Ver memoria `feedback-rawsets-mockup-discipline.md` y el archivo `home-radar.html` como referencia. Patrones obligatorios:

- Fondo dark con radial gradient sutil.
- Halo lima exterior del phone (blur 40px, alpha bajo).
- UN número hero gigante por pantalla (76px+ con tabular-nums).
- Restraint cromático: lime solo en hero, datos high, FAB, indicadores activos.
- Inter con `tabular-nums` (NO JetBrains Mono).
- Letter-spacing negativo en números grandes, positivo en labels uppercase.
- Tab bar píldora flotante con glassmorphism + estado "workout activo".
- Microinteracciones: scale(0.97) en active, transforms en hover.

## Orden de implementación recomendado

1. **Active workout (logging sets)** — ✓ `workout.html`.
2. **Body** — humanoid + balance + medidas. Reemplaza la idea original de "Stats". Tab principal. ✓ `body.html`.
3. **Home** — refinar `home-radar.html` si hace falta.
4. **Routines** — calendario hero + lista. Ver notas abajo.
5. **Routine detail** — ver/editar rutina concreta.
6. Exercise picker (sheet).
7. Rest timer (overlay).
8. Finish workout summary.
9. Settings.
10. Onboarding.
11. Empty / loading states transversales.

## Notas de diseño por pantalla

### Routines — visión

- **Hero = calendario mensual.** Cada celda de día es un cuadrado **punteado/dashed** cuando el día está vacío (señal visual de "aquí va algo, falta asignar").
- **Tap en un día vacío** → modal con opciones: asignar rutina existente, crear nueva rutina, definir periodicidad, descanso.
- **Tap en un día con rutina asignada** → preview de la rutina + opción de cambiar/quitar.
- **Cada fila de semana** tiene un botón a la derecha (kebab o icono ⟳) con acciones: **repetir semana**, copiar a siguiente semana, vaciar semana.
- **Debajo del calendario** → lista de rutinas guardadas (Tirón A, Empuje B, etc.) con su frecuencia y último uso.
- Tipografía y patrones: tabular-nums Inter, restraint cromático, lime solo para "hoy" y rutinas activas.

### Body — decisiones tomadas

- Reemplaza la pantalla "Stats" del roadmap original. Es una tab principal, no sub-ruta.
- Hero = humanoid SVG con grupos musculares coloreados por balance (lime=alto, blanco=ok, amber=medio, rose=bajo).
- Toggle Frente / Espalda dentro de la card del humanoid.
- Punto débil destacado como banner debajo del humanoid.
- Stats grid de medidas (peso, % grasa, masa magra, IMC) con trend ↑↓→.
- Lista de los 11 grupos musculares con barra + score.
- Card de meta activa al final.

## Después de aprobar todas

Implementación en React Native sigue el ADR-0001 (Hexagonal + DDD + Vertical Slicing). Los mockups quedan como **referencia visual permanente** en el repo — no se borran.
