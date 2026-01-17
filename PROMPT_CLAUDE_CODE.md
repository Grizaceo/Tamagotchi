# 🎮 PROMPT PARA CLAUDE CODE: Tamagotchi Pom Pom Purin - Alpha Testing

## CONTEXTO DEL PROYECTO

Estás trabajando en un Tamagotchi virtual basado en el personaje de Sanrio **Pom Pom Purin**, con estética retro de los años 2000. El proyecto es un monorepo pnpm con:

- `apps/web/` - Frontend web con Vite + TypeScript + Canvas
- `packages/core/` - Lógica de juego determinista (evolución, stats, persistencia)

**Objetivo inmediato:** Lograr un alpha test funcional donde los sprites ya incluidos se muestren correctamente y el gameplay básico sea jugable.

---

## PRIORIDADES (en orden)

### 🔴 PRIORIDAD 1: COMPILACIÓN FUNCIONAL

**Problema crítico en `apps/web/src/game/GameLoop.ts`:**

El código usa `await` dentro de una función síncrona, lo cual es inválido:

```typescript
// Líneas ~63-78 tienen:
export function startGameLoop(canvas: HTMLCanvasElement): () => void {
  // ...
  const { AssetManager, SpriteRenderer } = await import('./renderer/SpriteRenderer'); // ❌ ERROR
```

**Solución requerida:**
1. Convertir `startGameLoop` a función async que retorna una Promise del cleanup
2. O bien, usar una estructura IIFE async interna
3. Actualizar `main.ts` para manejar la Promise correctamente

**Ejemplo de solución:**
```typescript
// Opción A: Función async
export async function startGameLoop(canvas: HTMLCanvasElement): Promise<() => void> {
  const { AssetManager, SpriteRenderer } = await import('./renderer/SpriteRenderer');
  // ...resto del código
  return () => { /* cleanup */ };
}

// En main.ts:
startGameLoop(canvas).then(stop => {
  if (import.meta.hot) {
    import.meta.hot.dispose(() => stop());
  }
});
```

**Segundo problema en línea ~89:**
```typescript
if (!spriteRenderer || spriteRenderer.assetKey !== species) {
```
`assetKey` es privado. Solución: agregar un getter público en `SpriteRenderer.ts`.

---

### 🟡 PRIORIDAD 2: CONFIGURACIÓN CORRECTA DE SPRITES

**Archivo:** `apps/web/src/game/renderer/SpriteConfigs.ts`

Los spritesheets reales tienen más frames de lo configurado. Actualiza `COMMON_ANIMATIONS`:

```typescript
const COMMON_ANIMATIONS = {
    idle: { row: 0, frames: 4, loop: true, speed: 2 },   // Era 2, son 4
    walk: { row: 1, frames: 4, loop: true, speed: 4 },   // OK
    eat: { row: 2, frames: 4, loop: false, speed: 4 },   // OK
    happy: { row: 3, frames: 2, loop: true, speed: 4 },  // OK
    sad: { row: 4, frames: 4, loop: true, speed: 2 },    // Era 2, son 4
    sick: { row: 5, frames: 4, loop: true, speed: 1 },   // Era 2, son 4
    sleep: { row: 6, frames: 2, loop: true, speed: 1 },  // OK
    evolve: { row: 0, frames: 4, loop: true, speed: 10 },
};
```

**IMPORTANTE:** El `gridSize` actual es 48 pero los sprites reales parecen ser más grandes (~100-128px). Verifica midiendo el spritesheet:
- Si la imagen tiene 4 columnas y ~512px de ancho, cada sprite es ~128px
- Ajusta `gridSize` en consecuencia

---

### 🟡 PRIORIDAD 3: ICONOS DE UI

**Archivo:** `apps/web/src/game/renderer/UIRenderer.ts`

El spritesheet de iconos tiene 9 iconos pero NO son exactamente 24x24. Mide la imagen real:
- Dimensiones aproximadas de la imagen: ~1024x1024px (o similar)
- Los iconos están en una franja horizontal en el centro

Ajusta el código para leer correctamente las coordenadas de cada icono.

---

### 🟢 PRIORIDAD 4: VERIFICAR EVOLUCIÓN

Tras las correcciones anteriores, verifica que:
1. El juego inicia con `species: 'FLAN_BEBE'`
2. Tras 60 ticks (1 minuto), evoluciona a `FLAN_TEEN`
3. Tras 300 ticks (5 minutos), evoluciona a `FLAN_ADULT`
4. Las formas finales (POMPOMPURIN, MUFFIN, BAGEL, SCONE) son alcanzables según las reglas en `evolutionRules.ts`

---

## COMANDOS DE VERIFICACIÓN

Ejecuta desde la raíz del proyecto:

```bash
# Instalar dependencias
pnpm install

# Ejecutar tests del core
cd packages/core && pnpm test

# Iniciar desarrollo web
cd apps/web && pnpm dev
```

---

## ARCHIVOS CLAVE A MODIFICAR

1. **`apps/web/src/game/GameLoop.ts`** - Corregir async/await
2. **`apps/web/src/game/renderer/SpriteRenderer.ts`** - Agregar getter para assetKey
3. **`apps/web/src/game/renderer/SpriteConfigs.ts`** - Actualizar frames y gridSize
4. **`apps/web/src/game/renderer/UIRenderer.ts`** - Ajustar lectura de iconos
5. **`apps/web/src/main.ts`** - Manejar Promise de startGameLoop

---

## RESTRICCIONES IMPORTANTES

1. **NO cambies la arquitectura core** - El modelo de datos y lógica de evolución están correctos
2. **NO modifiques los tests existentes** - Deben seguir pasando
3. **Commits pequeños** - Un commit por problema resuelto
4. **Mantén determinismo** - El core debe producir el mismo resultado para el mismo input

---

## ASSETS DISPONIBLES

```
apps/web/public/assets/
├── tamagotchi_spritesheet_*.png  # Pom Pom Purin (principal)
├── muffin_spritesheet_*.png      # Evolución Muffin
├── bagel_spritesheet_*.png       # Evolución Bagel
├── scone_spritesheet_*.png       # Evolución Scone
└── retro_ui_icons_*.png          # 9 iconos de menú
```

Todos los spritesheets tienen fondo transparente y están listos para uso.

---

## CHECKLIST DE ÉXITO

```
[ ] pnpm install completa sin errores
[ ] pnpm test (en packages/core) pasa todos los tests
[ ] pnpm dev (en apps/web) compila y abre en navegador
[ ] El sprite de Pom Pom Purin es visible y animado
[ ] Los iconos del menú inferior son visibles
[ ] La navegación LEFT/RIGHT/ENTER funciona
[ ] Las acciones de cuidado modifican los stats
[ ] El estado persiste al recargar la página
[ ] Los minijuegos son jugables
[ ] La evolución progresa con el tiempo
```

---

## NOTAS ADICIONALES

- **Estética:** Prioriza funcionalidad sobre estética por ahora
- **Escalabilidad:** El sistema está diseñado para agregar más mascotas después
- **Hardware:** Eventualmente esto podría portarse a dispositivo físico (tipo ESP32)

¡Buena suerte! El objetivo es tener un prototipo jugable lo antes posible.
