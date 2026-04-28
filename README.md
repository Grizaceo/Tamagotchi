# PomPom Tamagotchi

Un simulador de Tamagotchi web avanzado con arquitectura monorepo, lógica determinista y minijuegos integrados.

## 🚀 Arquitectura
El proyecto utiliza una separación estricta de responsabilidades para garantizar la testabilidad y el rendimiento:

- **`packages/core`**: Lógica de negocio pura. Maneja el estado del pet, las reglas de evolución, la degradación de stats y la persistencia. Es determinista y agnóstico del entorno.
- **`apps/web`**: Interfaz de usuario construida con Vite y Canvas API. Maneja el renderizado de sprites, la gestión de escenas, el input del usuario y el motor de audio.

## ✨ Características Principales
- **Evolución Dinámica**: Ramificaciones basadas en la calidad del cuidado (felicidad, salud, hambre, afecto).
- **Minijuegos**: Cuatro juegos integrados (Pudding Catch, Memory, Chicha, Tetris) con sistema de recompensas y récords locales.
- **Persistencia Inteligente**: Guardado automático en `localStorage` con simulación de progreso offline (catch-up de ticks).
- **Estética Retro**: Renderizado estilo LCD con paletas de colores cuidadosamente seleccionadas y animaciones por sprites.
- **Sistema de Regalos**: Desbloqueables basados en hitos de interacción y logros de cuidado.

## 🛠️ Desarrollo

### Requisitos
- **Node.js**: Versión LTS (v18+ recomendada).
- **pnpm**: Gestor de paquetes necesario para el monorepo.

### Instalación
```bash
pnpm install
```
*Nota para Windows: Si experimentas errores de symlinks, intenta ejecutar la terminal como administrador o usa `$env:CI="true"; pnpm install --node-linker=hoisted`.*

### Comandos Útiles
- `pnpm dev`: Inicia el servidor de desarrollo para la aplicación web.
- `pnpm test`: Ejecuta los tests unitarios y de integración del core.
- `pnpm build`: Genera el bundle de producción en `apps/web/dist`.

## 🎮 Controles (UI Retro)
La interfaz simula los tres botones clásicos de un Tamagotchi:
- **Izquierda (`ArrowLeft`)**: Botón A (Navegar menú)
- **Derecha (`ArrowRight`)**: Botón B (Navegar menú / Confirmar en algunos contextos)
- **Confirmar (`Enter`)**: Botón C (Acción / Seleccionar)
- **Volver (`Escape`)**: Regresar al menú anterior.

## ⚖️ Balance de Juego
- **Tiempo de Vida**: El juego es de ritmo rápido. Un pet descuidado puede entrar en estado crítico en ~8 minutos y morir en ~10-11 minutos.
- **Recompensas**: Las interacciones positivas (alimentar, acariciar, jugar) mejoran los stats y aumentan el afecto, desbloqueando nuevas formas y regalos.

---
*Para más detalles técnicos, consulta la carpeta `docs/`.*
