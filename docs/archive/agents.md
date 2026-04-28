# Reglas de Agente

## Política de Integración y Despliegue
- **Validación Local Mandatoria:** Ningún commit o cambio será integrado en el repositorio remoto sin un testeo profundo previo en el entorno local. 
- **Sincronización de Parches:** Debido a que existen GitHub Actions activas que afectan el entorno de producción/usuario final, los cambios deben subirse de manera consolidada (como un parche verificado) para garantizar la estabilidad.
