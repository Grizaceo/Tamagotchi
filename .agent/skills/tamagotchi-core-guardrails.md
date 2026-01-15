---
name: Tamagotchi Core Guardrails
description: Reglas estrictas para el desarrollo del core y la integración del Tamagotchi.
---

# Tamagotchi Core Guardrails

Estas reglas son obligatorias para mantener la integridad de la arquitectura y facilitar el trabajo multi-agente.

## 1. Core Puro (packages/core)

-   **Sin DOM/Canvas**: El código en `packages/core` NUNCA debe importar ni hacer referencia a `window`, `document`, `canvas`, o cualquier API específica del navegador.
-   **Sin Efectos Secundarios UI**: El core no debe emitir sonidos ni actualizar la pantalla directamente. Solo debe cambiar su estado interno y emitir eventos o devolver el nuevo estado.

## 2. Determinismo y Ticks

-   **Ticks Enteros**: El bucle principal del juego ("tick") debe operar con números enteros para evitar problemas de punto flotante y asegurar determinismo.
-   **RNG Controlado**: Cualquier aleatoriedad debe ser inyectable o controlada por semillas (seeds) para garantizar que los tests sean reproducibles.

## 3. UI (apps/web)

-   **Solo Render + Input**: La aplicación web debe ser una capa fina que:
    1.  Toma el estado del Core.
    2.  Lo dibuja en el Canvas.
    3.  Captura eventos de entrada (clics, teclas) y llama a funciones del Core.
-   **No Lógica de Negocio**: No implementes reglas del juego en la UI. Si el Tamagotchi debe morir por hambre, esa lógica va en el Core.

## 4. Persistencia (SaveData)

-   **Features Modernas**: Cualquier nueva funcionalidad o característica ("feature") que afecte el estado del Tamagotchi debe ser serializable y persistir en `SaveData`.
-   **Compatibilidad**: Asegura que la estructura de datos permita guardar y cargar la partida sin pérdida de información crítica.
