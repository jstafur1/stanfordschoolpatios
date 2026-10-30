# Guía de Clonación, Configuración y Despliegue Web
## Proyecto: Stanford School Patios

Esta guía detalla paso a paso cómo cualquier desarrollador o administrador puede clonar este repositorio, configurar la base de datos y autenticación con **Supabase**, ejecutar el proyecto en local y ponerlo en producción en la web (usando **Vercel** o alternativas como Render, Railway o VPS).

---

## 📋 Requisitos Previos

1. **Node.js**: Versión `18.18+` o `20+ LTS` ([nodejs.org](https://nodejs.org/)).
2. **Git**: Instalado en tu equipo ([git-scm.com](https://git-scm.com/)).
3. **Cuenta de GitHub**: Para clonar o hacer fork del proyecto ([github.com](https://github.com/)).
4. **Cuenta de Supabase**: Para base de datos PostgreSQL, Auth y Storage ([supabase.com](https://supabase.com/)).
5. **Cuenta de Vercel**: Para el hosting web recomendado ([vercel.com](https://vercel.com/)).
6. *(Opcional)* **API Key de NVIDIA NIM**: Para el chatbot interactivo con IA de los cursos ([build.nvidia.com](https://build.nvidia.com/)).

---

## 🚀 Paso 1: Clonar el Repositorio e Instalar Dependencias

Abre tu terminal y ejecuta:

```bash
# 1. Clonar el repositorio
git clone https://github.com/jstafur1/stanfordschoolpatios.git

# 2. Entrar a la carpeta
cd stanfordschoolpatios

# 3. Instalar las dependencias
npm install
```

---

## 🗄️ Paso 2: Crear y Configurar el Proyecto en Supabase

1. Ve a tu panel en [Supabase Dashboard](https://supabase.com/dashboard) y haz clic en **"New Project"**.
2. Asigna un nombre (por ejemplo: `stanfordschoolpatios`) y una **contraseña segura para la base de datos**. *¡Guarda esta contraseña!*
3. Selecciona la región geográfica más cercana y haz clic en **"Create new project"**.
4. **Obtener credenciales:**
   - Ve a **Project Settings → API**:
     - Copia el **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`).
     - Copia la clave **anon (public)** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
     - Copia la clave secreta **service_role** (`SUPABASE_SERVICE_ROLE_KEY`).
   - Ve a **Project Settings → Database → Connection string → URI**:
     - Copia la cadena URI de PostgreSQL (`DATABASE_URL`), reemplazando `[YOUR-PASSWORD]` por la clave de tu base de datos.
5. **Configuración de Autenticación:**
   - Ve a **Authentication → Providers** y confirma que **Email** esté activado.

---

## ⚙️ Paso 3: Configurar Variables de Entorno (`.env.local`)

Copia la plantilla `.env.example` para crear tu archivo `.env.local`:

```bash
cp .env.example .env.local
```

Rellena los valores en `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-anon-key-publica
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta

# Database Connection (URI de Supabase)
DATABASE_URL=postgresql://postgres.tu-proyecto:tu-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# AI / Chatbot (Opcional - NVIDIA NIM)
NVIDIA_API_KEY=tu-nvidia-nim-api-key

# Contraseña inicial del Superadmin (Opcional)
ADMIN_SEED_PASSWORD=12345678
```

> ⚠️ **Importante**: Nunca subas el archivo `.env.local` a GitHub. Está protegido en `.gitignore`.

---

## 📦 Paso 4: Migraciones y Usuario Inicial

Aplica el esquema a tu base de datos y crea el usuario administrador:

```bash
# 1. Aplicar migraciones con Drizzle ORM
npm run db:migrate

# 2. Sembrar el usuario administrador inicial
npm run seed:admin
```

### Credenciales de Administrador Inicial:
- **Correo:** `administracion@stanfordschoolpatios.com`
- **Contraseña:** La definida en `ADMIN_SEED_PASSWORD` (o `12345678` por defecto).

*(Opcional: Si deseas aplicar las políticas de Row Level Security (RLS) avanzadas, ejecuta los scripts de la carpeta `supabase/migrations/` en el SQL Editor de Supabase).*

---

## 💻 Paso 5: Probar en Local

Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)
- Comprueba que la landing page cargue.
- Inicia sesión en `/login` con el usuario administrador para comprobar la conexión a Supabase.

---

## 🌐 Paso 6: Despliegue en la Web con Vercel (Recomendado)

1. **Hacer Fork del repositorio**: En GitHub, haz clic en **Fork** en [jstafur1/stanfordschoolpatios](https://github.com/jstafur1/stanfordschoolpatios) para tener tu copia propia.
2. **Importar en Vercel**:
   - Inicia sesión en [Vercel](https://vercel.com/) con tu cuenta de GitHub.
   - Presiona **"Add New..." → "Project"**.
   - Selecciona el repositorio y haz clic en **"Import"**.
3. **Configurar Variables de Entorno en Vercel**:
   - En la sección **"Environment Variables"**, agrega:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     - `DATABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `NVIDIA_API_KEY` (si aplica)
4. **Deploy**: Haz clic en **"Deploy"**. En un par de minutos tu aplicación estará en línea con una URL tipo `https://tu-proyecto.vercel.app`.
5. **Configurar Redirecciones en Supabase**:
   - En Supabase Dashboard → **Authentication → URL Configuration**:
     - **Site URL**: `https://tu-proyecto.vercel.app`
     - **Redirect URLs**: `https://tu-proyecto.vercel.app/**`

---

## 🔄 Paso 7: Alternativas de Despliegue

- **Render.com**: Crea un *Web Service*, conecta el repositorio, define `npm run build` como Build Command y `npm run start` como Start Command.
- **Railway.app**: Conecta el repositorio, configura las variables de entorno y Railway se encargará del contenedor de Next.js.
- **Servidor VPS (Ubuntu/Nginx/PM2)**:
  ```bash
  npm run build
  pm2 start npm --name "stanford" -- start
  ```

---

## ❓ Preguntas Frecuentes

- **¿Qué hacer si recibo error 408 o timeout en la base de datos?**  
  Verifica si estás usando el puerto de Session Pooler (`5432`) o Transaction Pooler (`6543`). Si usas el puerto 6543, incluye `?pgbouncer=true` al final de la URL.
- **¿Cómo desactivo el registro abierto de usuarios?**  
  En Supabase Dashboard → **Authentication → Sign In / Sign Up**, desactiva la opción *"Allow new users to sign up"*.
