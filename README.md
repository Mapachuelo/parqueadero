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

# Modo desarrollo
pnpm dev              # Servidor backend en :3000
pnpm dev:client       # Frontend en :5173 (con proxy a :3000)
```

## Produccion (Podman pods)

### Arquitectura

Dos pods separados en red compartida:

| Pod | Contenedores | Imagen | Puerto host |
|-----|-------------|--------|-------------|
| `parqueadero-db` | `postgres` | postgres:16 | 5432 |
| `parqueadero-app` | `backend` + `frontend` | local (Containerfile) | 3000 |

- `backend` y `frontend` comparten network namespace (nginx → `localhost:3000`)
- `parqueadero-db` persistente con PVC `parqueadero-pgdata`
- `parqueadero-app` recreable sin perdida de datos

### Despliegue
# 1. Buildear imagenes locales
```bash
podman build -t parqueadero-backend:latest -f Containerfile.backend .
podman build -t parqueadero-frontend:latest -f Containerfile.frontend .
```
### 2. Levantar base de datos
```bash
podman kube play 01-db-pod.yaml
``` 
### 3. Levantar aplicacion
```bash
podman kube play 02-app-pod.yaml
```

Frontend + API en `http://localhost:3000`.  
Documentacion Swagger en `http://localhost:3000/docs`.

### Detener
```bash
podman kube down 02-app-pod.yaml
podman kube down 01-db-pod.yaml
```

Los volumenes (BD, uploads, backups) se preservan entre reinicios.

## Credenciales de prueba

| Rol      | Usuario    | Contraseña    |
|----------|-----------|---------------|
| Admin    | `admin`   | `Admin123!`   |
| Operador | `operador`| `Operador123!`|

El primer acceso fuerza cambio de contraseña.
