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
# Generar claves reales:
#   JWT_SECRET: openssl rand -hex 32
#   PLATE_ENCRYPTION_KEY: openssl rand -hex 32   (64 caracteres hex exactos)
#   SYNC_API_KEY: openssl rand -hex 16
# El contenedor rechaza valores placeholder (CAMBIAR_POR_*) al arrancar.

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
2. En el primer arranque el backend crea los usuarios `admin` y `operador` con
   contraseñas aleatorias, impresas una sola vez en el log del contenedor.
   El primer acceso fuerza el cambio de contraseña. Estas credenciales no se
   guardan en ningun archivo ni repositorio.
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
| `parqueadero-db` | `postgres` | postgres:16 | ninguno (solo red interna) |
| `parqueadero-app` | `backend` + `frontend` | local (Containerfile) | 3001 (HTTPS) |

- `backend` y `frontend` comparten network namespace (nginx → `localhost:3000`)
- El backend (`containerPort 3000`) y postgres (`containerPort 5432`) viven en la red interna del pod: no compiten con los puertos del host
- Solo el frontend publica un `hostPort` (3001) hacia el host: es la única entrada web (HTTPS)
- `parqueadero-db` persistente con PVC `parqueadero-pgdata`
- `parqueadero-app` recreable sin perdida de datos

### Despliegue
#### 1. Buildear imagenes locales
```bash
podman build -t parqueadero-backend:latest -f Containerfile.backend .
podman build -t parqueadero-frontend:latest -f Containerfile.frontend .
```
#### 2. Cambiar de nombre la ejecución de los contenedores
```bash
cp example.app-pod.yaml app-pod.yaml
cp example.db-pod.yaml db-pod.yaml
```
#### 3. Generar claves y editarlas en app-pod.yaml
```bash
openssl rand -base64 24   # db_password (postgres) - tambien va embebida en database_url
openssl rand -hex 32      # jwt_secret
openssl rand -hex 32      # plate_encryption_key (64 hex exactos)
openssl rand -hex 16      # sync_api_key
chmod 600 app-pod.yaml db-pod.yaml
```
> IMPORTANTE: `app-pod.yaml` y `db-pod.yaml` estan en `.gitignore`. No los
> commitees. Un hook pre-commit los bloquea:
> `git config core.hooksPath .githooks`

#### 4. Certificados TLS
Colocar los certificados en el host (podman root):
```bash
mkdir -p /etc/parqueadero/ssl
cp server.crt server.key /etc/parqueadero/ssl/
chmod 600 /etc/parqueadero/ssl/server.key
```
Se montan en `/etc/nginx/ssl` dentro del frontend.

#### 5. levantar contenedores
```bash
# Crear el Secret parqueadero-secrets (definido en app-pod.yaml) y el pod de aplicacion
podman kube play app-pod.yaml
# Levantar base de datos (el backend reintenta hasta que PostgreSQL este listo)
podman kube play db-pod.yaml
# Ver credenciales temporales del primer arranque
podman logs -f parqueadero-app
```

El backend valida los secretos al arrancar: si alguno es placeholder
(`CAMBIAR_POR_*`), vacio o demasiado corto, el contenedor se detiene con error.

Frontend + API en `https://localhost:3001`.  
Documentacion Swagger en `https://localhost:3001/docs`.

### Detener
```bash
podman kube down app-pod.yaml
podman kube down db-pod.yaml
```

Los volumenes (BD, uploads, backups) se preservan entre reinicios.

## Seguridad de secretos

- No existe ningun login de usuario en `.env`: las credenciales de `admin` y
  `operador` se generan aleatoriamente en el primer arranque, se guardan
  hasheadas (bcrypt) en la base de datos y se imprimen una sola vez en el log.
- Las claves de la aplicacion (JWT, cifrado de placas, sync) van en el Secret
  `parqueadero-secrets` (podman) o en `.env` local, nunca en el repositorio.
- Hook pre-commit activo: `git config core.hooksPath .githooks`
- El release en GitHub Actions excluye `.env`, `*.pod.yaml`, certificados y claves.