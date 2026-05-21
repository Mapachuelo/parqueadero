# Skill: Reglas de documentacion y comportamiento

Guia de como el agente debe comportarse y documentar durante el desarrollo.

## Activacion

Esta skill se activa automaticamente en cada sesion. Sus reglas aplican a todas las interacciones del agente con el proyecto.

## Estructura de carpetas de documentacion

```
.
├── .agents
│   ├── notes
│   │   └── memory.md
│   └── skills
│       ├── architecture.md
│       └── skill.md
├── docs
└── README.md
```

## Creacion y edicion de carpetas/archivos para documentacion

- **Memoria entre sesiones:** Al final de cada sesion, guardar en `.agents/notes/memory.md` la informacion relevante sobre la funcionalidad del software desarrollada o modificada. Solo lo que otro agente en una sesion futura necesitaria saber para continuar el trabajo: estado actual, decisiones tomadas, estructura creada, bugs conocidos, y pendientes.
- **Documentacion nueva:** Guardarla en la carpeta `docs/`. Cada tema en una subcarpeta diferente. Si hay coincidencia entre temas, hacer referencias cruzadas con enlaces relativos. No duplicar carpetas: por ejemplo, usar `docs/docker/` en vez de `docs/docker/` y `docs/docker_compose/` por separado.
- **README.md:** Debe contener enlaces a toda la documentacion dentro de `docs/`. Actualizarlo siempre que haya cambios de despliegue, con instrucciones paso a paso segun el formato de `docs/ieee830.md` y las plataformas disponibles.
- **Arquitectura:** Al iniciar la infraestructura del software, crear o actualizar `.agents/skills/architecture.md` con las tecnologias, comandos de ejecucion, pruebas, y convenciones del proyecto.

## Reglas de comportamiento del agente

### Comunicacion
- Sin emojis en texto ni en codigo.
- Ser objetivo y directo. Respuestas minimas, sin preambulos ni explicaciones innecesarias.
- Preguntar solo cuando sea estrictamente necesario para continuar.

### Archivos y documentacion
- Toda documentacion en sintaxis markdown.
- Nombres de archivos y carpetas siempre en minusculas, sin tildes, sin espacios (usar guiones).
- No crear archivos de documentacion (*.md) a menos que sea solicitado o este en las reglas de esta skill.
- No modificar `README.md` sin que el usuario lo pida, excepto para mantener actualizados los enlaces a `docs/`.

### Codigo
- Antes de escribir codigo, leer el contexto: imports, convenciones, libraries del proyecto.
- Usar las mismas librerias y patrones que ya existen en el codigo.
- No asumir que una libreria esta disponible sin verificarlo en los archivos del proyecto.
- No agregar comentarios en el codigo a menos que el usuario los pida.
- Seguir las reglas de seguridad definidas en `architecture.md` (bcrypt, AES-256, HTTPS, JWT, RBAC).

### Testing y verificacion
- Siempre ejecutar lint y typecheck despues de hacer cambios de codigo.
- Si el proyecto tiene tests, ejecutarlos despues de cambios significativos.
- No commitear cambios a menos que el usuario lo pida explicitamente.

### Git
- Antes de commitear, revisar `git status`, `git diff` y `git log --oneline -10`.
- Solo stagear los archivos intencionados, nunca secrets o archivos de configuracion local.
- Mensajes de commit en español, descriptivos, en presente.
- No hacer push ni crear PRs sin que el usuario lo indique.

### Documentacion de sesion (memory.md)
Al final de cada sesion, actualizar `.agents/notes/memory.md` con:
- Que se hizo (modulos, archivos, cambios)
- Decisiones importantes y por que se tomaron
- Estado actual del desarrollo
- Bugs o problemas conocidos
- Proximos pasos sugeridos
- Solo lo que un nuevo agente en otra sesion necesitaria para continuar
