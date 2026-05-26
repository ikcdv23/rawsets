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
├── home.html              ← versión Forge sin radar (referencia base)
├── home-radar.html        ← Home con radar hexagonal de balance (variante activa)
├── workout.html           ← active workout, logging sets (✓ aprobado)
├── body.html              ← Body: humanoid + balance + medidas + metas (reemplaza Stats)
├── routines.html          ← TO DO — calendario hero + lista de rutinas
├── routine-detail.html    ← TO DO — ver/editar rutina
├── exercise-picker.html   ← TO DO — bottom sheet para añadir ejercicio
├── rest-timer.html        ← TO DO — overlay durante workout
├── finish-workout.html    ← TO DO — summary al terminar
├── settings.html          ← TO DO — preferencias y unidades
├── onboarding.html        ← TO DO — primera apertura
└── empty-states.html      ← TO DO — sin rutinas / sin workouts / sin PRs
```

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
