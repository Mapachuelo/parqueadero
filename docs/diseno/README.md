# Diseno tecnico

Diseno del Sistema de Gestion de Parqueaderos Publicos (Neiva, Colombia): diagramas UML,
mockups de interfaz, modelo de datos y trazabilidad con el SRS (`docs/ieee830.md`).

Todos los diagramas se entregan en tres formatos:

- `.drawio` editable (abrir en [draw.io](https://app.diagrams.net/) o la app de escritorio).
- `.svg` vectorial.
- `.png` para incrustar en documentos.

## Diagramas UML (`uml/`)

| Diagrama | Archivos | Descripcion |
|----------|----------|-------------|
| Casos de uso | [drawio](uml/casos-de-uso.drawio) - [svg](uml/casos-de-uso.svg) - [png](uml/casos-de-uso.png) | Actores Admin, Operador y Cliente y sus casos, con trazabilidad a los RF. |
| Clases | [drawio](uml/clases.drawio) - [svg](uml/clases.svg) - [png](uml/clases.png) | Modelo de dominio con relaciones y cardinalidades. |
| Secuencia login | [drawio](uml/secuencia-login.drawio) - [svg](uml/secuencia-login.svg) - [png](uml/secuencia-login.png) | Autenticacion y creacion de sesion. |
| Secuencia entrada | [drawio](uml/secuencia-entrada.drawio) - [svg](uml/secuencia-entrada.svg) - [png](uml/secuencia-entrada.png) | Registro de entrada, asignacion de espacio y ticket. |
| Secuencia salida y pago | [drawio](uml/secuencia-salida-pago.drawio) - [svg](uml/secuencia-salida-pago.svg) - [png](uml/secuencia-salida-pago.png) | Calculo de tarifa, pago y recibo. |
| Secuencia sync | [drawio](uml/secuencia-sync.drawio) - [svg](uml/secuencia-sync.svg) - [png](uml/secuencia-sync.png) | Sincronizacion offline y conflictos. |
| Componentes | [drawio](uml/componentes.drawio) - [svg](uml/componentes.svg) - [png](uml/componentes.png) | SPA, nginx, backend modular, Prisma y PostgreSQL. |
| Despliegue | [drawio](uml/despliegue.drawio) - [svg](uml/despliegue.svg) - [png](uml/despliegue.png) | Pods Podman, red interna, volumenes y TLS. |
| Estados de transaccion | [drawio](uml/estados-transaccion.drawio) - [svg](uml/estados-transaccion.svg) - [png](uml/estados-transaccion.png) | Ciclo de vida activa/completada/cancelada. |

## Mockups de interfaz (`mockups/`)

| Pantalla | Archivos | Rol |
|----------|----------|-----|
| Inicio de sesion | [drawio](mockups/01-login.drawio) - [png](mockups/01-login.png) | Todos |
| Dashboard | [drawio](mockups/02-dashboard.drawio) - [png](mockups/02-dashboard.png) | Admin |
| Registrar entrada + ticket | [drawio](mockups/03-entrada.drawio) - [png](mockups/03-entrada.png) | Admin / Operador |
| Registrar salida y pago | [drawio](mockups/04-salida-pago.drawio) - [png](mockups/04-salida-pago.png) | Admin / Operador |
| Recibo de salida | [drawio](mockups/05-recibo.drawio) - [png](mockups/05-recibo.png) | Admin / Operador |
| Vehiculos activos | [drawio](mockups/06-activos.drawio) - [png](mockups/06-activos.png) | Admin / Operador |
| Tarifas | [drawio](mockups/07-tarifas.drawio) - [png](mockups/07-tarifas.png) | Admin |
| Reportes | [drawio](mockups/08-reportes.drawio) - [png](mockups/08-reportes.png) | Admin |
| Reclamos | [drawio](mockups/09-reclamos.drawio) - [png](mockups/09-reclamos.png) | Admin |
| Legal | [drawio](mockups/10-legal.drawio) - [png](mockups/10-legal.png) | Admin |
| Espacios | [drawio](mockups/11-espacios.drawio) - [png](mockups/11-espacios.png) | Admin |
| Usuarios | [drawio](mockups/12-usuarios.drawio) - [png](mockups/12-usuarios.png) | Admin |
| Portal cliente (acceso) | [drawio](mockups/13-portal-cliente-auth.drawio) - [png](mockups/13-portal-cliente-auth.png) | Cliente |
| Portal cliente (historial) | [drawio](mockups/14-portal-cliente-historial.drawio) - [png](mockups/14-portal-cliente-historial.png) | Cliente |

## Modelo de datos (`datos/`)

| Documento | Descripcion |
|-----------|-------------|
| [er-modelo.drawio](datos/er-modelo.drawio) / [svg](datos/er-modelo.svg) / [png](datos/er-modelo.png) | Diagrama entidad-relacion de las 29 entidades. |
| [modelo-er.dbml](datos/modelo-er.dbml) | Modelo en DBML (importable a dbdiagram.io). |
| [diccionario-datos.md](datos/diccionario-datos.md) | Diccionario campo a campo de las 29 entidades. |
| [mapeo-er-prisma.md](datos/mapeo-er-prisma.md) | Correspondencia entidad / modelo Prisma / tabla SQL. |

## Regeneracion

Los diagramas se generan por script (fuente de verdad reproducible):

```bash
python3 docs/diseno/tools/generar-uml.py      # uml/*.drawio + *.svg
python3 docs/diseno/tools/generar-mockups.py  # mockups/*.drawio + *.svg
python3 docs/diseno/tools/generar-datos.py    # datos/er-modelo + dbml + diccionario
# PNG (requiere ImageMagick): convierte cada .svg a .png
for f in docs/diseno/{uml,mockups,datos}/*.svg; do magick -background white "$f" "${f%.svg}.png"; done
```

El ER, DBML y el diccionario se derivan de `src/db/prisma/schema.prisma`; si cambia el
schema, volver a ejecutar `generar-datos.py`.
