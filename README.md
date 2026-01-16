# Proyecto Tamagotchi (Monorepo)

Este repositorio contiene la implementación de un Tamagotchi utilizando una arquitectura monorepo con `pnpm`.

## Requisitos

- **Node.js**: Versión LTS recomendada.
- **pnpm**: Gestor de paquetes.

## Comandos Principales

Ejecutar desde la raíz del proyecto:

- **Instalar dependencias**:
  ```bash
  pnpm install
  ```

- **Ejecutar tests (Core)**:
  ```bash
  pnpm test
  ```

- **Iniciar servidor de desarrollo (UI)**:
  ```bash
  pnpm dev
  ```

## Estructura del Repositorio

- **`apps/web`**: Aplicación web construida con Vite. Maneja la UI y el renderizado en Canvas.
- **`packages/core`**: Lógica de negocio pura del Tamagotchi. Contiene las reglas del juego y estado, testeado con Vitest.

## Reglas de Desarrollo

1.  **Separación de Responsabilidades**:
    - `packages/core`: **NO** debe contener referencias al DOM, Canvas o APIs del navegador. Debe ser puramente lógica y datos.
    - `apps/web`: Se encarga exclusivamente de capturar input del usuario y renderizar el estado proporcionado por el core.

2.  **Determinismo**:
    - La lógica del core debe ser determinista para facilitar el testing y la consistencia.

## Controles (UI retro)

La UI usa tres botones tipo tamagotchi y un boton de regreso:

- Izquierda: `ArrowLeft` (boton A)
- Derecha: `ArrowRight` (boton B)
- Confirmar: `Enter` (boton C)
- Volver: `Escape`

Si agregas un sprite basado en `descarga.jpg`, coloca el archivo en `apps/web/public/descarga.jpg` para que el renderer lo cargue automaticamente.
