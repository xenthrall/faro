# Faro — Cuenta de demostración

Faro está publicado como concepto experimental en GitHub Pages. Para que
cualquiera pueda probarlo, el login viene precargado con una cuenta pública
compartida.

## Datos de la cuenta

| Campo | Valor |
|---|---|
| Email | `demo@faro.app` |
| Contraseña | `faro-demo` |
| Display name | `Usuario demo` |

Estos valores tienen que coincidir con `src/auth/demo-user.ts` (precarga del
login), `supabase/seeds/demo_user.sql` (creación) y el email de
`supabase/migrations/20261003120000_demo_user_lock.sql` (bloqueo en la base).

## 1. Crear el usuario

El seed `supabase/seeds/demo_user.sql` lo crea ya confirmado. Corre solo en
cada `db reset` (está en `sql_paths` de `config.toml`) y también se puede
correr suelto contra el proyecto vinculado:

```bash
npm run db:seed-demo
```

Es idempotente: si la cuenta ya existe, no hace nada. Requiere haber hecho
`npx supabase login` y `npx supabase link --project-ref <project-ref>`.

## 2. Aplicar el bloqueo en la base

La clave publicable va dentro del bundle público, así que cualquiera puede
llamar a la API de Auth con la sesión demo (`auth.updateUser`) y cambiarle la
contraseña o el email. Ocultar los formularios en el panel no alcanza. La
migración `20261003120000_demo_user_lock.sql` agrega un trigger sobre
`auth.users` que rechaza esos cambios para `demo@faro.app`.

Aplicala de una de estas dos formas:

- **SQL Editor:** pegar el contenido del archivo y ejecutarlo.
- **CLI** (con el proyecto vinculado): `npm run db:push`.

### Qué bloquea

Cuando el cambio pasa por el servicio de Auth, sea por la API pública o por el
dashboard, se rechaza cualquier cambio de:

- email (incluido iniciar un cambio de email)
- contraseña (incluido el flujo de "olvidé mi contraseña")
- teléfono
- `full_name` de los metadatos

La API responde con error (500). El cambio de email además lo rechaza Auth
antes de llegar a la base (400 `email_address_invalid`), porque no puede
mandar mails a `demo@faro.app`. El login, el
refresco de sesión y el cierre de sesión siguen funcionando normal.

### Cómo cambiar la cuenta a propósito

El bloqueo no aplica al **SQL Editor**. Por ejemplo, para cambiar la
contraseña:

```sql
update auth.users
set encrypted_password = extensions.crypt('nueva-contraseña', extensions.gen_salt('bf'))
where email = 'demo@faro.app';
```

Y actualizar `src/auth/demo-user.ts` con la nueva contraseña.

## 3. Verificar

1. Entrar al panel con la cuenta demo: debe iniciar sesión sin problemas.
2. En **Configuración de la cuenta**, en lugar de los formularios de nombre,
   email y contraseña aparece el aviso "Cuenta de demostración".

## Recomendado: desactivar registros públicos

Faro no tiene pantalla de registro, pero con la clave publicable cualquiera
puede llamar a `auth.signUp`. Para que la única cuenta abierta sea la demo:
**Authentication → Sign In / Providers → desactivar "Allow new users to sign
up"**. Los usuarios que crees desde el dashboard no se ven afectados.

## Tené en cuenta

Todos los datos que se cargan con la cuenta demo son públicos y compartidos:
cualquier visitante puede crearlos, editarlos o borrarlos.
