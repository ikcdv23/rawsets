# 🚀 Guía de Inicio Local

Sigue estos pasos para levantar el entorno de desarrollo de RAWSETS en tu máquina.

## 📋 Requisitos Previos
- **Node.js**: Versión 24 o superior.
- **pnpm**: Versión 10 o superior (instalado vía `npm install -g pnpm`).

## 🛠️ Paso a Paso
1.  **Clonar y entrar al repo:**
    ```bash
    cd rawsets
    ```
2.  **Asegurarte de estar en la rama de desarrollo:**
    ```bash
    git checkout dev
    ```
3.  **Instalar dependencias:**
    ```bash
    pnpm install
    ```
4.  **Levantar el servidor web (Recomendado):**
    ```bash
    pnpm --filter @rawsets/mobile web
    ```
*Esto abrirá la app en `http://localhost:8081`.*

## ⌨️ Comandos del Día a Día
| Comando | Qué hace |
| :--- | :--- |
| `pnpm web` | Inicia la app en el navegador. |
| `pnpm start` | Servidor universal (para abrir en Expo Go vía QR). |
| `pnpm typecheck` | Valida que no haya errores de TypeScript. |
| `pnpm lint:fix` | Arregla automáticamente el formato y estilo del código (Biome). |
| `pnpm drizzle:generate` | Genera nuevas migraciones si cambias el schema de la DB. |

## 💡 Pro-Tip
Si la caché de Metro te da problemas o ves cosas raras en la UI después de un cambio grande, limpia la caché con:
`pnpm --filter @rawsets/mobile web --clear`
