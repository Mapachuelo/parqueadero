# parqueadero

Sistema de Gestion de Parqueaderos Publicos - Neiva, Colombia.

## Documentacion

- [Especificacion de Requisitos (IEEE 830)](docs/ieee830.md)
- [Prompts y comandos utiles](docs/prompts.md)
- [Estrategia de sincronizacion](db/sync_strategy.md)

## Stack

Node.js + TypeScript | pnpm v11 | React + Vite + Tailwind CSS | Fastify | PostgreSQL + Prisma | Podman

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Levantar servicios (PostgreSQL + App)
podman-compose up -d

# Seed de base de datos (usuarios, tarifas, espacios)
pnpm db:seed

# Modo desarrollo
pnpm dev              # Servidor backend en :3000
pnpm dev:client       # Frontend en :5173 (con proxy a :3000)
```

## Produccion

```bash
pnpm build:all        # Construye frontend + backend
podman-compose up --build -d
```

Frontend + API en `http://localhost:3000`.  
Documentacion Swagger en `http://localhost:3000/docs`.

## Credenciales de prueba

| Rol      | Usuario    | Contraseña    |
|----------|-----------|---------------|
| Admin    | `admin`   | `Admin123!`   |
| Operador | `operador`| `Operador123!`|

El primer acceso fuerza cambio de contraseña.
