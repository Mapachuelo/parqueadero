# parqueadero

Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia.

## Documentacion

- [Especificacion de Requisitos (IEEE 830)](docs/ieee830.md)
- [Prompts y comandos utiles](docs/prompts.md)
- [Estrategia de sincronizacion](db/sync_strategy.md)
- [Arquitectura, stack y API](.agents/skills/architecture.md)
- [Diseno tecnico: UML, mockups y modelo de datos](docs/diseno/README.md)
- [Calidad: plan de pruebas, matriz RF-test e informe](docs/calidad/informe-resultados.md)
- [Manual tecnico](docs/manuales/manual-tecnico.md)
- [Manual de usuario](docs/manuales/manual-usuario.md)
- [Guia rapida del operador](docs/manuales/guia-rapida.md)
- [Changelog](CHANGELOG.md)

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

1. Levantar base de datos y aplicacion (ver seccion Despliegue).
2. Aplicar migraciones y seed **manualmente** (el backend NO los corre al
   arrancar):
   ```bash
   # dentro del contenedor backend o con DATABASE_URL apuntando al pod
   node_modules/.bin/prisma migrate deploy
   node dist/db/seeds/index.js
   ```
   El seed crea los usuarios `admin` y `operador` con contraseñas aleatorias y
   las imprime **una sola vez** en la salida del comando. No hay credenciales
   fijas ni en `.env` ni en el repositorio. El primer acceso fuerza el cambio
   de contraseña.
3. Completar el checklist legal de pre-operacion (menú Admin → Checklist Legal).
4. Registrar entrada de vehiculos (placa, categoria, datos del propietario).
5. Calcular tarifa de salida y procesar pago.
6. Consultar reportes de ocupacion e ingresos.

Documentacion Swagger en `http://localhost:3000/docs`.

### Roles de usuario

La aplicacion tiene tres roles:

| Rol | Usuario | Como se obtiene |
|-----|---------|-----------------|
| Admin | `admin` | Creado por el seed con clave aleatoria (una vez) |
| Operador | `operador` | Creado por el seed con clave aleatoria (una vez) |
| Cliente | segun se registre | Lo crea un Admin desde Usuarios → Nuevo Usuario (rol Cliente) |

Como entrar:

1. Abrir la aplicacion en `https://localhost:3001` (o el dominio configurado).
2. Para Admin/Operador: iniciar sesion en la pantalla principal con las
   credenciales capturadas del seed.
3. El rol `admin` tiene acceso a todo (tarifas, reportes, usuarios, checklist
   legal, reclamos) y tambien a entrada/salida. El rol `operador` gestiona
   entradas, salidas, pagos y vehiculos activos.
4. El rol `cliente` usa el Portal de Clientes en `/_cliente`: puede entrar con
   email + contraseña, o con el ID de transaccion + los ultimos 4 caracteres
   alfanumericos de la placa (ej. `ABC-123` → `C123`).

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

Flujo manual: se copian las plantillas `example.*.yaml` a los archivos de
trabajo y se editan los valores de secretos directamente en ellos antes de
ejecutar `podman kube play` sobre la red interna `parqueadero-net`.

#### 1. Buildear imagenes locales
```bash
podman build -t localhost/parqueadero-backend:latest -f Containerfile.backend .
podman build -t localhost/parqueadero-frontend:latest -f Containerfile.frontend .
```
> Los tags deben ser `localhost/parqueadero-*` porque asi los referencian
> `app-pod.yaml`/`example.app-pod.yaml`.
#### 2. Crear los archivos de trabajo desde las plantillas
```bash
cp example.db-pod.yaml db-pod.yaml
cp example.app-pod.yaml app-pod.yaml
```
#### 3. Generar claves y editarlas en db-pod.yaml
```bash
openssl rand -base64 24 | tr '+/' '-_'   # db_password (postgres, URL-safe) - tambien va embebida en database_url
openssl rand -hex 32      # jwt_secret
openssl rand -hex 32      # plate_encryption_key (64 hex exactos)
openssl rand -hex 16      # sync_api_key
```
> Nota: la contraseña de postgres debe ser segura para URLs (sin `+`, `/`, `=`).
> El comando `tr '+/' '-_'` la convierte a base64url.
> Editar a mano los valores en la seccion `stringData` del Secret
> `parqueadero-secrets` en `db-pod.yaml` (db_password, database_url,
> jwt_secret, plate_encryption_key, sync_api_key).
> `app-pod.yaml` y `db-pod.yaml` estan en `.gitignore`. No los commitees.

#### 4. Certificados TLS
En produccion los certificados del frontend se administran por fuera (otra app)
y se montan desde `/etc/parqueadero/ssl` en el host hacia `/etc/nginx/ssl`
dentro del contenedor.

Para pruebas locales sin acceso a `/etc`, se puede generar un certificado
autofirmado en el repo y apuntar el `hostPath` de `app-pod.yaml` a esa carpeta:
```bash
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -nodes -keyout ssl/server.key \
  -out ssl/server.crt -days 365 -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
chcon -R -t container_file_t ssl   # SELinux
```
El navegador debe confiar en el certificado (importarlo en `~/.pki/nssdb` con
`certutil`) o ignorar errores HTTPS.

#### 5. Levantar contenedores
```bash
# Crear la red interna (una sola vez)
podman network create parqueadero-net

# Levantar los pods
podman kube play --replace --network parqueadero-net db-pod.yaml
podman kube play --replace --network parqueadero-net app-pod.yaml

# Migrar y sembrar (manual): imprime las credenciales aleatorias una sola vez
podman run --rm --network parqueadero-net \
  -e DATABASE_URL='postgresql://parqueadero:<db_password>@parqueadero-db:5432/parqueadero' \
  localhost/parqueadero-backend:latest \
  sh -c "node_modules/.bin/prisma migrate deploy && node dist/db/seeds/index.js"
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
  `operador` se generan aleatoriamente al ejecutar el seed, se guardan
  hasheadas (bcrypt) en la base de datos y se imprimen una sola vez en su
  salida. No hay credenciales fijas ni en `.env` ni en el repositorio.
- Las claves de la aplicacion (JWT, cifrado de placas, sync) van en el Secret
  `parqueadero-secrets` (podman) o en `.env` local, nunca en el repositorio.
- El release en GitHub Actions excluye `.env`, `*.pod.yaml`, certificados y claves.
