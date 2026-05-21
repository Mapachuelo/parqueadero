# Prompts y comandos utiles

## Desarrollo

```bash
pnpm dev              # Servidor de desarrollo
pnpm build            # Compilar TypeScript
pnpm lint             # ESLint
pnpm typecheck        # Type checking
pnpm test             # Unit tests
pnpm test:coverage    # Cobertura de tests
```

## Base de datos

```bash
podman-compose up -d  # Levantar PostgreSQL
pnpm db:generate      # Generar migraciones
pnpm db:migrate       # Ejecutar migraciones
pnpm db:seed          # Datos de prueba
```

## Git

```bash
git checkout -b feature/<nombre>  # Nueva rama
git add <archivos>
git commit -m "<mensaje>"
```
