# Catálogo de Regalos y Logros - Pompom Tama

## Regalos (9 items)

### Desbloqueables por Hito

| Regalo | Emoji | Condición | Descripción |
|--------|-------|-----------|-------------|
| **Primer Bocadillo** | 🍪 | Alimenta 1+ veces | Tu primer cuidado: alimento reconfortante |
| **Alegría de Jugar** | 🎾 | Juega 3+ veces | Una pelota suave para horas de diversión |
| **Almohada de Sueños** | 🛏️ | Duerme 5+ veces | Duerme mejor y sueña con aventuras |
| **Poción de Salud** | 💚 | Cura 2+ veces | Brinda fuerzas en momentos difíciles |
| **Corazón de Papel** | 💝 | Acaricia 10+ veces | Un símbolo delicado de tu cariño |
| **Corona de Cuidador** | 👑 | Alcanza POMPOMPURIN | Alcanzaste el pico de perfección en el cuidado |
| **Espíritu Resiliente** | 🌟 | 1800+ ticks (30 min) | Superaste desafíos con gracia |
| **Gema de Centenario** | 💎 | 6000+ ticks (100 min) | Jugaste 100+ minutos juntos |
| **Caja Sorpresa** | 🎁 | Adulto + Health > 70 | Un regalo misterioso y único |

### Sistema de Desbloqueo

```typescript
import { evaluateGiftUnlocks, getUnlockedGifts } from '@pompom/core';

const state = evaluateGiftUnlocks(petState);  // Evalúa desbloqueos
const unlockedGifts = getUnlockedGifts(state);  // Obtiene detalles

// Cada regalo tiene:
// - id: identificador único
// - name: nombre
// - description: descripción
// - emoji: emoji representativo
```

- **Determinista**: Se desbloquean al cumplir condiciones
- **Acumulativo**: Los regalos nunca se pierden
- **No se repiten**: Cada regalo se desbloquea solo una vez

---

## Logros (7 items)

### Logros Alcanzables

| Logro | Icono | Condición | Descripción |
|-------|-------|-----------|-------------|
| **Cuidador Responsable** | 🏅 | 50+ acciones | Realiza 50 acciones de cuidado |
| **Mascota Perfecta** | 👑 | Alcanza POMPOMPURIN | Mascota perfecta en todos los aspectos |
| **Amante del Buen Comer** | 🍽️ | Alimenta 30+ veces | Demuestra amor por la gastronomía |
| **Compañero de Juegos** | 🎮 | Juega 25+ veces | Entretenimiento sin límites |
| **Sanador** | ⚕️ | Cura 10+ veces | Mantiene la salud como prioridad |
| **Maratonista** | 🏃 | 7200+ ticks (2 horas) | Resistencia extrema |
| **Coleccionista de Formas** | 🌈 | Desbloquea todas las 4 evoluciones | Domina cada camino de cuidado |

### Sistema de Logros

```typescript
import { evaluateAchievementUnlocks, getUnlockedAchievements } from '@pompom/core';

const state = evaluateAchievementUnlocks(petState);
const achievements = getUnlockedAchievements(state);
```

- **Determinista**: Condiciones basadas únicamente en el estado
- **Progreso persistente**: Se guardan en la serialización
- **Sin duplication**: Cada logro se desbloquea una sola vez

---

## Integración

Ambos sistemas (regalos + logros) se evalúan **después de cada acción/tick**:

```typescript
import { reduce } from '@pompom/core';
import { evaluateGiftUnlocks, evaluateAchievementUnlocks } from '@pompom/core';

let state = reduce(state, action);
state = evaluateGiftUnlocks(state);      // Chequea regalos
state = evaluateAchievementUnlocks(state);  // Chequea logros
```

Esto asegura que el jugador reciba retroalimentación **inmediata** al cumplir hitos.
