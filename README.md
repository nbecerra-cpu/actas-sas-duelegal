# Generador de Actas de Asamblea S.A.S. — Due Legal

Plataforma completa para generar actas de asamblea de accionistas de sociedades S.A.S. colombianas, con inteligencia artificial (LucIA) integrada.

## Características

- **7 pasos guiados**: Sociedad → Reunión → Accionistas → Mesa Directiva → Orden del Día → Decisiones → Generar Acta
- **LucIA (AI)**: Redacción automática de puntos del acta con lenguaje jurídico colombiano formal
- **Descarga .docx**: Documento Word profesional con formato legal (Times New Roman, tabla de asistencia, firmas)
- **Google Drive**: Subida directa al Drive del abogado
- **Marco legal**: Ley 1258/2008, Código de Comercio (Arts. 189, 431), Ley 222/1995, Circular Básica Jurídica Supersociedades

## Deploy en Vercel (Paso a Paso)

### 1. Subir a GitHub

```bash
# En la raíz del proyecto
git init
git add .
git commit -m "Actas S.A.S. - Due Legal v1.0"
git remote add origin https://github.com/tu-usuario/actas-sas-duelegal.git
git push -u origin main
```

### 2. Crear proyecto en Vercel

1. Ir a [vercel.com](https://vercel.com) → New Project
2. Importar el repositorio de GitHub
3. Framework: **Next.js** (se detecta automáticamente)
4. Click **Deploy**

### 3. Configurar Variables de Entorno

En Vercel → Settings → Environment Variables, agregar:

#### Obligatorio: API de Anthropic (LucIA)

| Variable | Valor | Dónde obtenerlo |
|----------|-------|----------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |

**Costo**: ~$0.01-0.03 USD por redacción de punto. Con 100 actas/mes ≈ $3-10 USD/mes.

#### Opcional: Google Drive

| Variable | Valor | Dónde obtenerlo |
|----------|-------|----------------|
| `GOOGLE_CLIENT_ID` | `xxxxx.apps.googleusercontent.com` | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx` | Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://tu-dominio.vercel.app/api/drive/callback` | Tu URL de Vercel |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.vercel.app` | Tu URL de Vercel |

##### Configurar Google Drive:

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear proyecto → APIs & Services → Enable **Google Drive API**
3. OAuth consent screen → External → Añadir scope: `drive.file`
4. Credentials → Create **OAuth 2.0 Client ID** → Web application
5. Authorized redirect URIs: `https://tu-dominio.vercel.app/api/drive/callback`
6. Copiar Client ID y Client Secret a las variables de Vercel

### 4. Redeploy

Después de configurar las variables, ir a Deployments → Redeploy para que tome efecto.

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus keys

# Iniciar en modo desarrollo
npm run dev
# Abrir http://localhost:3000
```

## Estructura del Proyecto

```
actas-sas-nextjs/
├── app/
│   ├── layout.js          # Layout raíz
│   ├── page.js            # Página principal
│   ├── globals.css         # Estilos globales
│   └── api/
│       ├── lucia/route.js          # Backend LucIA (Claude AI)
│       ├── generate-docx/route.js  # Generación de .docx
│       └── drive/
│           ├── auth/route.js       # OAuth inicio
│           ├── callback/route.js   # OAuth callback
│           ├── status/route.js     # Verificar conexión
│           └── upload/route.js     # Subir archivo
├── components/
│   └── ActasApp.jsx        # Componente principal (React)
├── package.json
├── next.config.js
└── .env.local.example      # Template de variables
```

## Embeber en Webflow (Due Legal)

Para integrar en el sitio de Due Legal (Webflow), tienes dos opciones:

### Opción A: iframe (Recomendada)
```html
<iframe src="https://actas.duelegal.co" width="100%" height="900" frameborder="0"></iframe>
```

### Opción B: Link directo
Simplemente apuntar un subdominio como `actas.duelegal.co` al deploy de Vercel.
En Vercel → Settings → Domains → Add `actas.duelegal.co` y configurar DNS.

## Seguridad

- La API key de Anthropic **nunca** se expone al cliente — todas las llamadas pasan por el backend
- Los tokens de Google Drive se almacenan en cookies HttpOnly
- Las API routes validan todos los inputs

## Soporte

Desarrollado por Due Legal. Para soporte técnico, contactar al equipo de desarrollo.
