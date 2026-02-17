# Guía de Arreglo de Bugs y Mejoras de Tamagotchi

Este documento detalla los problemas reportados y el plan modular para solucionarlos.

## 1. Problema: Inicio Enfermo y No Bebé
**Síntomas:** La mascota aparece enferma y adulta incluso al "reiniciar".
**Causa:**
- El juego guarda el estado en `localStorage` automáticamente.
- Al recargar la página, se carga el estado guardado (mascota adulta/enferma) en lugar de iniciar uno nuevo.
- La recuperación automática ("Welcome Back") sube la salud a 30, que es el borde de estar enfermo (<30), por lo que puede fluctuar rápidamente a enfermo.

**Solución Modular:**
- **Agregar Botón de Reset:** Implementar una opción explícita "Reset Game" en el menú de Configuración (Settings) que borre el `localStorage` y recargue la página.
- **Ajustar Recuperación:** Aumentar la salud de recuperación a 50 para dar más margen.

## 2. Problema: Superposición de UI (Mascota vs Barras)
**Síntomas:** La imagen del pet se sobrepone con las barras de estado.
**Causa:**
- La posición del Sprite está hardcodeada al centro (`GameLoop.ts`).
- La lista de estadísticas se dibuja verticalmente y ocupa mucho espacio hacia abajo (`Render.ts`), invadiendo el área del sprite.

**Solución Modular:**
- **Rediseñar Barras de Estado:** Cambiar el layout de `drawStats` en `Render.ts`.
    - Usar un diseño de 2 columnas o horizontal compacta en la parte superior.
    - Reducir el tamaño de las barras.
    - Usar símbolos/iconos claros con etiquetas cortas.
- **Ajustar Posición del Sprite:** Mover el sprite dinámicamente o fijarlo más abajo en `GameLoop.ts` para respetar el área de stats.

## 3. Problema: Botón Home Inútil
**Síntomas:** El botón izquierda "Home" no tiene sentido ya que el botón "Back" en otros menús ya lleva a Home, y estando en Home no hace nada.
**Causa:**
- Está incluido en la lista `MENU_ICONS` en `UIRenderer.ts`.

**Solución Modular:**
- **Eliminar Botón:** Quitar la entrada "Home" de `MENU_ICONS` y `BOTTOM_MENU` en `Scenes.ts`.
- **Reordenar:** Ajustar los índices para que el menú quede centrado y balanceado.

## 4. Problema: Sprites de Botones Confusos
**Síntomas:** Los iconos no representan bien su función.
**Causa:**
- Mapping de `retro_ui_icons` puede no ser intuitivo o los iconos son genéricos.

**Solución Modular:**
- **Verificar Mapping:** Revisar los índices en `UIRenderer.ts` para buscar mejores coincidencias en el spritesheet si existen.
- **Mejorar Etiquetas:** Asegurar que las etiquetas de texto sean legibles y claras (ya existen, pero se pueden destacar más).

## 5. Problema: Curación (Heal) y Regalos
**Síntomas:** Heal no parece curar. Regalos son inútiles.
**Causa:**
- Heal suma 40 de salud. Si la salud es muy baja, puede no ser suficiente para notar un cambio inmediato si el tick de "enfermedad" baja rápido o si el umbral es alto.
- Regalos solo se desbloquean y listan, no tienen interacción.

**Solución Modular:**
- **Mejorar Heal:** Aumentar la curación a 50 o 100 (curación completa) y añadir feedback visual (animación "happy").
- **Interacción con Regalos:**
    - Permitir seleccionar un regalo con `ENTER`.
    - Al seleccionar, cambiar temporalmente el sprite del Pet a una pose especial o mostrar el regalo junto a él.

## 6. Problema: Falta de Feedback de Muerte
**Síntomas:** Cuando la mascota muere, solo se ve enferma. No hay claridad de "Game Over".
**Causa:**
- Se reutiliza el sprite de "Sick".

**Solución Modular:**
- **Sprite Game Over:** Implementar un estado de animación `dead` que muestre un letrero de "Game Over" o una tumba/fantasma.

---

## Plan de Ejecución
1. **Modificar `GameLoop.ts` y `Settings`** para el Reset.
2. **Refactorizar `Render.ts`** para las barras de estado compactas.
3. **Limpiar `UIRenderer.ts`** quitando el botón Home.
4. **Actualizar `reducer.ts` y `Render.ts`** para lógica de Heal y Regalos.
5. **Implementar lógica de Game Over** en Render/GameLoop.
