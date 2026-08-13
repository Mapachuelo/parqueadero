# parqueadero

Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia.

## Documentacion

- [Especificacion de Requisitos (IEEE 830)](docs/ieee830.md)
- [Prompts y comandos utiles](docs/prompts.md)
- [Estrategia de sincronizacion](db/sync_strategy.md)

## Stack

Node.js + TypeScript | pnpm v11 | React + Vite + Tailwind CSS | Fastify | PostgreSQL + Prisma | Podman (pods nativos)

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno (solo desarrollo local)
cp .env.example .env
# Editar .env con tus valores reales (JWT_SECRET, PLATE_ENCRYPTION_KEY, etc.)

# Modo desarrollo
pnpm dev              # Servidor backend en :3000
pnpm dev:client       # Frontend en :5173 (con proxy a :3000)
```

### Testing

```bash
pnpm test             # Unit tests
pnpm test:watch       # Unit tests modo watch
pnpm test:coverage    # Unit tests con cobertura
pnpm lint             # ESLint
pnpm typecheck        # TypeScript type checking
pnpm build            # Compilar TypeScript
```

### Primer uso

1. Levantar base de datos y aplicacion (ver seccion Despliegue)
2. Acceder a `http://localhost:3000` con las credenciales de prueba
3. Completar el checklist legal de pre-operacion (menú Admin → Checklist Legal)
4. Registrar entrada de vehiculos (placa, categoria, datos del propietario)
5. Calcular tarifa de salida y procesar pago
6. Consultar reportes de ocupacion e ingresos

Documentacion Swagger en `http://localhost:3000/docs`.

## Produccion (Podman pods)

### Arquitectura

Dos pods separados en red compartida:

| Pod | Contenedores | Imagen | Puerto host |
|-----|-------------|--------|-------------|
| `parqueadero-db` | `postgres` | postgres:16 | 5433 |
| `parqueadero-app` | `backend` + `frontend` | local (Containerfile) | 3000 |

- `backend` y `frontend` comparten network namespace (nginx → `localhost:3000`)
- `parqueadero-db` persistente con PVC `parqueadero-pgdata`
- `parqueadero-app` recreable sin perdida de datos

### Despliegue
#### 1. Buildear imagenes locales
```bash
podman build -t parqueadero-backend:latest -f Containerfile.backend .
podman build -t parqueadero-frontend:latest -f Containerfile.frontend .
```
#### 2. Cambiar de nombre la ejecución de los contenedores
```
cp example.app-pod.yaml app-pod.yaml
cp example.db-pod.yaml db-pod.yaml
```

#### 3. levantar contenedores
```bash
# Crear el Secret parqueadero-secrets (definido en app-pod.yaml) y el pod de aplicacion
podman kube play app-pod.yaml
# Levantar base de datos (el backend reintenta hasta que PostgreSQL este listo)
podman kube play db-pod.yaml
```

Frontend + API en `http://localhost:3000`.  
Documentacion Swagger en `http://localhost:3000/docs`.

### Detener
```bash
podman kube down app-pod.yaml
podman kube down db-pod.yaml
```

Los volumenes (BD, uploads, backups) se preservan entre reinicios.

## Credenciales de prueba

| Rol      | Usuario    | Contraseña    |
|----------|-----------|---------------|
| Admin    | `admin`   | `Admin123!`   |
| Operador | `operador`| `Operador123!`|

El primer acceso fuerza cambio de contraseña.
