# Análisis del Estado Actual del Proyecto (PomPom Tama)

Este documento detalla los hallazgos tras la revisión del código fuente de `packages/core` y `apps/web`. El objetivo es identificar puntos fuertes, problemas críticos de rendimiento y persistencia, y ofrecer recomendaciones para la interfaz de usuario.

## 1. Puntos Fuertes (Strengths)

*   **Arquitectura Modular y Escalable:** La separación entre la lógica del juego (`packages/core`) y la interfaz de usuario (`apps/web`) es excelente. Esto permite portar el juego a otras plataformas (ej. React Native, Electron) sin reescribir la lógica central.
*   **Uso Robusto de TypeScript:** El tipado fuerte en `PetState`, `GameEvent` y `EvolutionRule` previene una gran cantidad de errores en tiempo de ejecución y facilita el mantenimiento.
*   **Diseño Determinisca:** El uso de un `reducer` puro para la gestión del estado y reglas de evolución deterministas hace que el juego sea predecible y fácil de testear.
*   **Sistema de Reglas Claro:** La configuración de reglas de evolución en `evolutionRules.ts` es legible y fácil de extender sin tocar la lógica de evaluación.

## 2. Problemas Críticos (Critical Issues)

### A. Rendimiento Degradante (Performance)
*   **Descripción:** Las funciones `evaluateEvolution`, `evaluateAchievementUnlocks` y `evaluateGiftUnlocks` escanean el array completo `state.history` en cada ciclo de juego (o frecuentemente).
*   **Impacto:** Dado que el historial crece indefinidamente con cada acción (alimentar, jugar, dormir), la complejidad temporal es linear ($O(N)$). Con el tiempo, el juego se volverá progresivamente más lento, causando bloqueos en la interfaz (jank).
*   **Solución Propuesta:** Implementar contadores agregados en `PetState` (ej. `counts.feed`, `counts.play`) que se actualicen en tiempo constante ($O(1)$) en el reducer, eliminando la necesidad de escanear el historial.

### B. Persistencia y Límite de Almacenamiento (Persistence)
*   **Descripción:** El array `state.history` almacena *cada evento* que ha ocurrido desde el inicio del juego. Este array se serializa completo a JSON y se guarda en `localStorage`.
*   **Impacto:** `localStorage` tiene un límite estricto (usualmente 5MB). Un jugador dedicado eventualmente excederá este límite, provocando que el juego deje de guardar el progreso o falle al cargar (crash).
*   **Solución Propuesta:** Truncar el historial manteniendo solo los últimos N eventos (ej. 50-100) para propósitos de UI/logs, y confiar en los contadores agregados para la lógica del juego.

### C. Integridad de Datos en Migraciones
*   **Descripción:** La función `migrateFromOlderVersion` actual simplemente reinicia el estado (`createInitialPetState`).
*   **Impacto:** Cualquier cambio en la estructura de datos que requiera una migración borrará el progreso del usuario.
*   **Solución Propuesta:** Implementar una estrategia de migración que transforme el estado antiguo al nuevo formato sin perder datos.

## 3. Recomendaciones de UI/UX (User Interface)

### A. Feedback Visual
*   **Indicadores de Estado:** Agregar barras de progreso o iconos que parpadeen cuando una estadística (hambre, energía) esté crítica (< 20%).
*   **Feedback de Acciones:** Mostrar "texto flotante" (+10 ❤️, -5 ⚡) sobre el personaje cuando se realiza una acción para dar feedback inmediato al jugador.

### B. Accesibilidad y Controles
*   **Navegación por Teclado:** Asegurar que todos los botones sean navegables con Tab/Enter/Espacio.
*   **Etiquetas ARIA:** Agregar `aria-label` a los botones de iconos para usuarios con lectores de pantalla.
*   **Menú de Configuración:** Implementar un menú overlay para ajustar volumen, velocidad y dificultad sin depender de reiniciar la página.

### C. Diseño Responsivo
*   **Escalado del Canvas:** Asegurar que el canvas mantenga su relación de aspecto (aspect ratio) correctamente en dispositivos móviles muy estrechos, evitando scroll horizontal innecesario.
*   **Modo Oscuro/Claro:** El diseño actual es oscuro (retro), lo cual es bueno, pero asegurar suficiente contraste en los textos.

---
**Plan de Acción Inmediato:**
Se procederá a refactorizar el `core` para solucionar los problemas de rendimiento y persistencia implementando contadores agregados y truncado de historial.
