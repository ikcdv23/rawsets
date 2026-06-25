# 🚀 Guía de Inicio Local

Sigue estos pasos para levantar el entorno de desarrollo de RAWSETS en tu máquina.

## 📋 Requisitos Previos
- **Node.js**: Versión 22 o superior.
- **pnpm**: Versión 10 o superior (instalado vía `npm install -g pnpm`).

## 🛠️ Paso a Paso
1.  **Asegurarte de estar en la rama de desarrollo:**
    ```bash
    git checkout dev
    ```
2.  **Instalar dependencias:**
    ```bash
    pnpm install
    ```
3.  **Levantar el servidor web (recomendado para desarrollo rápido):**
    ```bash
    pnpm --filter @rawsets/mobile web
    ```
    Esto abrirá la app en `http://localhost:8081`.

## ⌨️ Comandos del Día a Día
| Comando | Qué hace |
| :--- | :--- |
| `pnpm --filter @rawsets/mobile web` | Inicia la app en el navegador (dev server). |
| `pnpm --filter @rawsets/mobile start` | Servidor universal (para Expo Go vía QR en el móvil). |
| `pnpm typecheck` | Valida que no haya errores de TypeScript en todo el monorepo. |
| `pnpm lint` | Analiza el código con Biome. |
| `pnpm lint:fix` | Arregla automáticamente el formato y estilo (Biome). |
| `pnpm --filter @rawsets/mobile exec npx expo install --check` | Valida dependencias contra la SDK de Expo. |

## 💡 Pro-Tip
Si la caché de Metro te da problemas o ves cosas raras en la UI después de un cambio grande, limpia la caché con:
`pnpm --filter @rawsets/mobile web --clear`

Si hay problemas de resolución de módulos, reinstalar desde cero:
```bash
rm -rf node_modules apps/*/node_modules apps/mobile/.expo && pnpm install
```
