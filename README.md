# Faro

Sistema de gestión para pequeñas empresas, actualmente en etapa inicial de diseño y desarrollo.

## Objetivo

Faro busca ofrecer una solución de gestión para pequeñas empresas con un costo de infraestructura **económicamente absurdo de lo bajo**.

La premisa es aprovechar **servicios gratuitos y administrados mientras sean suficientes**, evitando incorporar infraestructura propia o servicios de pago innecesarios.

El objetivo no es construir un SaaS basado en una infraestructura costosa y centralizada, sino desarrollar una aplicación que pueda mantenerse operativa con una infraestructura mínima y que solo requiera aumentar los costos cuando el uso real lo justifique.

## Arquitectura

Faro está siendo desarrollado como una aplicación **SPA (Single Page Application)** con un frontend estático y servicios backend administrados.

```text
┌─────────────────────────────┐
│            Faro             │
│                             │
│ React + TypeScript + Vite   │
│ React Router + Tailwind CSS │
└──────────────┬──────────────┘
               │
               │ HTTPS
               ▼
┌─────────────────────────────┐
│          Supabase           │
│                             │
│ PostgreSQL                  │
│ Authentication              │
│ Storage                     │
│ Row Level Security (RLS)    │
└─────────────────────────────┘
```

### Principios iniciales

* **Frontend estático:** el frontend debe poder desplegarse como archivos estáticos sin necesidad de mantener un servidor de aplicación.
* **Servicios administrados:** aprovechar servicios administrados para reducir la infraestructura propia.
* **Free tier first:** utilizar servicios gratuitos mientras sus límites sean suficientes para las necesidades reales del proyecto.
* **Bajo costo operativo:** evitar servidores, procesos y servicios de pago permanentes cuando no sean técnicamente necesarios.
* **Seguridad en la base de datos:** utilizar PostgreSQL y Row Level Security (RLS) para proteger los datos independientemente de la lógica del frontend.
* **Escalabilidad progresiva:** aumentar la infraestructura únicamente cuando el crecimiento real del proyecto lo justifique.
* **Infraestructura como consecuencia del uso:** los costos deben crecer como consecuencia del uso y las necesidades reales, no simplemente por adoptar una arquitectura más compleja desde el inicio.

## Stack

### Frontend

* React
* TypeScript
* Vite
* React Router
* Tailwind CSS

### Backend / servicios

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Row Level Security (RLS)

## Modelo de infraestructura

Faro busca mantener una separación clara entre la aplicación y la infraestructura necesaria para ejecutarla.

```text
                    Faro
                      │
                      ▼
              Frontend estático
                      │
              ┌───────┴───────┐
              ▼               ▼
          Supabase        Servicios
          Free Tier       adicionales
              │
              ▼
          PostgreSQL
```

Mientras los límites de los servicios gratuitos sean suficientes, no se busca introducir infraestructura adicional.

Si las necesidades de Faro superan dichos límites, la arquitectura podrá evolucionar de forma progresiva.

## Estado del proyecto

Faro se encuentra actualmente en **etapa inicial de diseño y desarrollo**.

La arquitectura y el stack pueden evolucionar durante el desarrollo a medida que aparezcan nuevas necesidades técnicas.

## Configuración

Copiá `.env.example` a `.env.local` y completá las credenciales del proyecto de Supabase (Project Settings → API):

```bash
cp .env.example .env.local
```

* `VITE_SUPABASE_URL`
* `VITE_SUPABASE_PUBLISHABLE_KEY`

## Scripts

```bash
npm run dev
```

Inicia el servidor de desarrollo.

```bash
npm run build
```

Genera el build de producción.

```bash
npm run lint
```

Ejecuta ESLint para analizar el código.

```bash
npm run preview
```

Sirve localmente el build de producción para realizar pruebas antes del despliegue.
