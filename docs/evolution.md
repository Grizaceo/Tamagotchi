# Evolution System - PomPom Tama (Flan & Seal)

Determinista: mismas acciones ⇒ mismo resultado. Cada línea de mascota tiene su cadena de etapas y condiciones finales.

## Líneas disponibles
- **Flan/PomPomPurin**: huevo → FLAN_BEBE → FLAN_TEEN → adulto (BAGEL normal, POMPOMPURIN perfecto, SCONE fallido).
- **Foca (Seal)**: huevo → SEAL_BABY → SEAL_TEEN → adulto (SEAL_PERFECT, SEAL_BROWN parda, SEAL_FAIL morza).

## Flan / PomPomPurin
- **Transiciones base**:  
  - 60 ticks: FLAN_BEBE → FLAN_TEEN  
  - 300 ticks: FLAN_TEEN → FLAN_ADULT  
- **Adulto (evalúa desde 900–1200 ticks)**  
  1. **POMPOMPURIN** (perfecto): `totalTicks ≥ 1200`, Happiness ≥ 85, Health ≥ 85, Hunger ≤ 25, Energy ≥ 65.  
  2. **MUFFIN** (snack addict): `totalTicks ≥ 900`, Feeds ≥ 30, Plays ≤ 6, Health ≥ 45.  
  3. **SCONE** (mecánico): `totalTicks ≥ 900`, PET ≤ 25% de acciones, Hunger ≤ 55, Health ≥ 35.  
  4. **BAGEL** (normal/fallback): `totalTicks ≥ 900`, si nada más aplica.

## Foca (Seal)
- **Transiciones base**:  
  - 60 ticks: SEAL_EGG → SEAL_BABY  
  - 300 ticks: SEAL_BABY → SEAL_TEEN  
- **Adulto (evalúa a partir de 900 ticks)**  
  1. **SEAL_PERFECT**: Health ≥ 85, Happiness ≥ 80, Energy ≥ 50, Hunger ≤ 30.  
  2. **SEAL_FAIL (morza)**: Health < 40 **o** Happiness < 30 **o** Hunger > 75.  
  3. **SEAL_BROWN**: fallback por defecto.

## Prioridad
Se evalúa en orden en cada línea (1 es mayor prioridad).  
- Flan: POMPOMPURIN → MUFFIN → SCONE → BAGEL.  
- Foca: SEAL_PERFECT → SEAL_FAIL → SEAL_BROWN.  

Usa `evaluateEvolution(state)` para chequear; `applyEvolutionIfNeeded(state)` aplica y registra el evento EVOLVED.
