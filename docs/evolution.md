# Sistema de Evolución - Pompom Tama

## Resumen

El Tamagotchi evoluciona a una de cuatro formas finales basándose en el **cuidado recibido**. El sistema es **determinista**: misma secuencia de acciones = mismo resultado.

## Reglas de Evolución

### 1. **POMPOMPURIN** - Cuidados Perfectos ⭐ (Prioridad máxima)
- **Descripción**: La forma ideal de cuidado balanceado
- **Requisitos**:
  - Mínimo 3600 ticks (1 hora aprox)
  - Felicidad ≥ 85
  - Salud ≥ 85
  - Hambre ≤ 30
  - Energía ≥ 50
- **Cómo lograrlo**: Mantén equilibrio. Alimenta cuando hambriento, juega regularmente, cura cuando sea necesario

### 2. **MUFFIN** - Adicto a Bocadillos 🧁
- **Descripción**: Muchos refrigerios, pocas actividades
- **Requisitos**:
  - Mínimo 2400 ticks (40 minutos)
  - Máximo 200 alimentaciones
  - Mínimo 5 jugadas
  - Salud ≥ 50
- **Cómo lograrlo**: Alimenta frecuentemente pero no excesivamente; no juegues mucho

### 3. **BAGEL** - Sueño Irregular 😴
- **Descripción**: Patrones de descanso erráticos
- **Requisitos**:
  - Mínimo 1800 ticks (30 minutos)
  - Máximo 100 descansos (REST)
  - Salud ≥ 40
  - Felicidad ≥ 30
- **Cómo lograrlo**: Deja dormir al pet irregularmente; no lo dejes descansar mucho

### 4. **SCONE** - Cuidado Mecánico 🧹
- **Descripción**: Limpieza alta pero bajo afecto
- **Requisitos**:
  - Mínimo 2400 ticks
  - Acaricias (PET) ≥ 70% de acciones totales
  - Felicidad ≥ 0 (puede estar triste)
  - Hambre ≤ 50
- **Cómo lograrlo**: Acaricia mucho, pero mantén pocas otras acciones

## Sistema de Prioridades

Si el pet cumple múltiples condiciones, evoluciona a:

```
1. POMPOMPURIN (Prioridad 1)
2. BAGEL      (Prioridad 2)
3. MUFFIN     (Prioridad 3)
4. SCONE      (Prioridad 4)
```

**Ejemplo**: Si cumples condiciones de MUFFIN y SCONE, evolucionarás a MUFFIN.

## Evolución Técnica

```typescript
import { evaluateEvolution, applyEvolutionIfNeeded } from '@pompom/core';

const newSpecies = evaluateEvolution(state);  // Retorna especies o undefined
const evolvedState = applyEvolutionIfNeeded(state);  // Aplica automáticamente
```

- **Determinista**: Solo usa el estado actual, sin RNG
- **Sin efectos secundarios**: Las funciones son puras
- **Eventos**: Se registra EVOLVED en el historial
