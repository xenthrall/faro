# Faro

Sistema de gestión para pequeñas empresas: inventario, compras, ventas y traslados entre ubicaciones.

> **Proyecto experimental.** Faro es un concepto en etapa inicial de diseño y desarrollo. La arquitectura, el esquema y la interfaz pueden cambiar sin aviso.

## La idea

Faro busca que un sistema de gestión cueste **casi nada en infraestructura**: aprovechar servicios gratuitos y administrados mientras alcancen, y que los costos solo crezcan cuando el uso real lo justifique.

Por eso es una SPA estática, desplegable en cualquier hosting de archivos (como GitHub Pages), que habla directamente con Supabase. No hay servidor de aplicación propio: la seguridad vive en la base de datos con Row Level Security.

```text
React + TypeScript + Vite  ──HTTPS──▶  Supabase (PostgreSQL · Auth · RLS)
```

## Puesta en marcha

Requiere Node 22+. Primero instalá las dependencias y creá el archivo de entorno:

```bash
npm install
cp .env.example .env.local
```

Después elegí dónde corre Supabase.

### Opción A: proyecto remoto de Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com) (el plan gratuito alcanza).
2. Completá `.env.local` con los datos de Project Settings → API:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Vinculá la CLI y cargá el esquema y los datos de ejemplo:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npm run db:reset
   ```

   El `project-ref` es el subdominio de `VITE_SUPABASE_URL`. `db:reset` **borra todos los datos** del proyecto antes de recrearlo; para solo aplicar migraciones nuevas usá `npm run db:push`.

### Opción B: Supabase local con Docker

1. Levantá el stack local y cargá el esquema y los datos de ejemplo:

   ```bash
   npx supabase start
   npx supabase db reset
   ```

2. Completá `.env.local` con la `API URL` y la `Publishable key` que imprime `npx supabase status`.

### Correr la app

```bash
npm run dev
```

Los datos de ejemplo incluyen el usuario `demo@faro.app` / `faro-demo` para entrar al panel.

## Despliegue

El workflow `.github/workflows/deploy.yml` publica en GitHub Pages en cada push a `main`. Necesita `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` configuradas en Settings → Secrets and variables → Actions.

Para otro hosting estático: `npm run build` y publicar la carpeta `dist/`.

## Documentación

* [docs/database.md](docs/database.md): modelo de datos, migraciones y RLS.
* [docs/panel.md](docs/panel.md): arquitectura del panel y cómo extenderlo.
* [docs/demo-user.md](docs/demo-user.md): la instancia pública de demostración.
