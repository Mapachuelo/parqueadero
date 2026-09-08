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

### Credenciales de acceso (roles Admin y Operador)

La aplicacion tiene dos roles de usuario:

| Rol | Usuario | Contraseña |
|-----|---------|-----------|
| Admin | `admin` | `123456` |
| Operador | `operador` | `123456` |

Como entrar:

1. Abrir la aplicacion en `https://localhost:3001` (o el dominio configurado).
2. En la pantalla de inicio de sesion ingresar el usuario y la contraseña
   segun el rol.
3. El rol `admin` tiene acceso a todo (tarifas, reportes, usuarios, checklist
   legal, reclamos). El rol `operador` gestiona entradas y salidas de vehiculos
   y pagos.

Al cambiar la contraseña dentro de la plataforma se exige: minimo 8
caracteres, una mayuscula, una minuscula, un numero y un simbolo (ej.
`Abc12345!`).

## Produccion (Podman pods)

### Arquitectura

Dos pods separados en la red interna dedicada `parqueadero-net`:

| Pod | Contenedores | Imagen | Puerto host |
|-----|-------------|--------|-------------|
| `parqueadero-db` | `postgres` | postgres:16 | ninguno (solo red interna) |
| `parqueadero-app` | `backend` + `frontend` | local (Containerfile) | 3001 (HTTPS) |

- Todos los contenedores se comunican por la red interna `parqueadero-net`
  (DNS de podman: `parqueadero-db:5432`); ningun contenedor usa `host`
  networking
- `backend` y `frontend` comparten network namespace (nginx → `localhost:3000`)
- El backend (`containerPort 3000`) y postgres (`containerPort 5432`) viven en
  la red interna: no compiten con los puertos del host
- Solo el frontend publica un `hostPort` (3001) hacia el host: es la única
  entrada web (HTTPS)
- `parqueadero-db` persistente con PVC `parqueadero-pgdata`
- `parqueadero-app` recreable sin perdida de datos

### Despliegue

Los valores de `.env` se inyectan en las plantillas `db-pod.yaml`/`app-pod.yaml`
(no llevan secretos commiteados) con `envsubst` antes de ejecutar
`podman kube play` sobre la red interna `parqueadero-net`.

#### 1. Buildear imagenes locales
```bash
podman build -t parqueadero-backend:latest -f Containerfile.backend .
podman build -t parqueadero-frontend:latest -f Containerfile.frontend .
```
#### 2. Configurar `.env`
```bash
cp .env.example .env
openssl rand -base64 24 | tr '+/' '-_'   # DB_PASSWORD (postgres, URL-safe)
openssl rand -hex 32      # JWT_SECRET
openssl rand -hex 32      # PLATE_ENCRYPTION_KEY (64 hex exactos)
openssl rand -hex 16      # SYNC_API_KEY
```
> Nota: la contraseña de postgres debe ser segura para URLs (sin `+`, `/`, `=`).
> El comando `tr '+/' '-_'` la convierte a base64url.
> `DB_PASSWORD` se usa para crear el Secret `parqueadero-secrets` y armar la
> `database_url` interna del pod. `.env` no se commitea (esta en `.gitignore`).

#### 3. Certificados TLS
Los certificados del frontend se administran por fuera (otra app) y se montan
desde `/etc/parqueadero/ssl` en el host hacia `/etc/nginx/ssl` dentro del
contenedor.

#### 4. Levantar contenedores
```bash
# Crear la red interna (una sola vez)
podman network create parqueadero-net

# Inyectar .env en las plantillas y levantar los pods
set -a; source .env; set +a
envsubst < db-pod.yaml  | podman kube play --replace --network parqueadero-net -
envsubst < app-pod.yaml | podman kube play --replace --network parqueadero-net -

# Credenciales temporales del primer arranque
podman logs -f parqueadero-app
```
El backend valida los secretos al arrancar (placeholder, vacio o demasiado
corto) y se detiene con error si falla la validacion.

Frontend + API en `https://localhost:3001`.  
Documentacion Swagger en `https://localhost:3001/docs`.

### Detener
```bash
podman kube down app-pod.yaml db-pod.yaml
```

Los volumenes (BD, uploads, backups) se preservan entre reinicios.

## Seguridad de secretos

- No existe ningun login de usuario en `.env`: las credenciales de `admin` y
  `operador` se generan aleatoriamente en el primer arranque, se guardan
  hasheadas (bcrypt) en la base de datos y se imprimen una sola vez en el log.
- Las claves de la aplicacion (JWT, cifrado de placas, sync) van en el Secret
  `parqueadero-secrets` (podman) o en `.env` local, nunca en el repositorio.
- El release en GitHub Actions excluye `.env`, `*.pod.yaml`, certificados y claves.