# Serverless fácil: React + Lambda + API Gateway + CloudFront (AWS SAM)

Demo para una charla de 30 minutos, lista para publicar en GitHub. El **frontend React** usa **Vite** y llama a `GET /api/saludo?nombre=Ana`; el backend es una **Lambda Node.js nativa**, sin Express ni dependencias npm. AWS SAM define S3 privado, CloudFront, API Gateway HTTP API y Lambda.

## Arquitectura

```text
Navegador / React (HTTPS)
          |
       CloudFront
          |
     +----+------+
     |           |
     /          /api/*
     |           |
  S3 privado   API Gateway (HTTP API)
  HTML/CSS/JS     |
                AWS Lambda
                Node.js 24
```

- React se ejecuta en el **navegador**, no dentro de Lambda.
- `npm run build` (Vite) crea los archivos estáticos en `frontend/dist/`.
- CloudFront usa **Origin Access Control (OAC)** para acceder a S3 privado.
- Las peticiones `/api/*` van a API Gateway, sin caché. El navegador usa una URL relativa y no necesita CORS con esta configuración.
- La demo tiene una API **pública, sin autenticación**; no almacenar ni exponer datos sensibles.

## Requisitos

- Para ejecutar local: Node.js **24.x** y npm. La versión mayor está fijada en `.nvmrc` y `.node-version`.
- Python **3.13** está fijado en `.python-version` para herramientas auxiliares; la aplicación actualmente no contiene código Python ni depende de Python para ejecutarse.
- Para desplegar: [instalá AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) y [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html), y configurá una cuenta AWS con permisos para CloudFormation, IAM, Lambda, API Gateway, S3 y CloudFront.
- Usar usuarios/roles con permisos adecuados; no utilizar la cuenta root.

## A. Ejecutar localmente (sin AWS ni Docker)

Desde la raíz del proyecto, instalá las dependencias del frontend una vez y levantá ambos servicios con un solo comando:

```bash
npm --prefix frontend install
npm run dev
```

Abrí **http://127.0.0.1:5173**. Vite redirige `/api/*` a la API local en `127.0.0.1:3000`. Para detener ambos servicios, presioná `Ctrl+C`.

El backend no requiere `npm install`: usa módulos nativos de Node.js y no tiene dependencias npm. Si preferís ejecutarlo por separado, usá `node backend/local-server.js` en una terminal y `npm --prefix frontend run start` en otra.

### Alternativa: ejecutar la Lambda con SAM local

Si querés probar la función dentro del runtime de Lambda, instalá y abrí Docker Desktop. Desde la raíz del proyecto ejecutá:

```bash
sam build
sam local start-api
```

SAM inicia una API local en `http://127.0.0.1:3000`. Probá la ruta con:

```bash
curl "http://127.0.0.1:3000/api/saludo?nombre=Ana"
```

Deberías recibir un JSON con el saludo. Para detener el servidor, presioná `Ctrl+C`. Esta prueba usa Docker y SAM; no requiere desplegar recursos ni credenciales AWS. El servidor Node.js de la sección anterior es una alternativa más liviana que no usa Docker.
## B. Desplegar la infraestructura con AWS SAM

Desde la raíz del proyecto, con AWS CLI y SAM CLI ya configurados:

```bash
aws sts get-caller-identity
sam validate
sam build
sam deploy --guided
```

Para el primer despliegue, elegí nombre de stack `serverless-facil-demo`, región AWS y revisá antes los permisos IAM solicitados. SAM/CloudFormation crea API Gateway, Lambda, bucket S3 privado, distribución CloudFront y políticas de acceso. La creación de CloudFront puede llevar varios minutos.

**Importante:** todavía falta subir los archivos de React compilados al bucket. Los siguientes scripts obtienen los Outputs del stack y hacen build + publicación.

**Windows PowerShell:**

```powershell
.\scripts\deploy-frontend.ps1 -StackName serverless-facil-demo
```

**macOS / Linux / Git Bash:**

```bash
bash scripts/deploy-frontend.sh serverless-facil-demo
```

Los scripts instalan las dependencias del **frontend** con `npm ci` (si existe lockfile; si no, `npm install`), ejecutan `npm run build` y publican `frontend/dist/` en S3. El backend no requiere instalación npm. Luego invalidan `/*` en CloudFront. Al finalizar imprimen la URL de la aplicación.

## Comprobar que funciona

- La URL del Output `AppUrl`, `https://XXXXX.cloudfront.net`, debe abrir la web React.
- `https://XXXXX.cloudfront.net/api/saludo?nombre=Ana` debe devolver JSON de Lambda.
- `DirectApiUrl` muestra la URL pública de API Gateway para pruebas directas.
- Revisar **Amazon CloudWatch Logs** si la función falla.

## Estructura de archivos

| Archivo | Para qué sirve |
|---|---|
| `frontend/src/App.jsx` | Formulario React, estado con `useState`, llamada `fetch` |
| `frontend/src/main.jsx` | Inicializa la aplicación React |
| `frontend/vite.config.js` | Build Vite y proxy local `/api` → Node.js :3000 |
| `backend/app.js` | Handler de AWS Lambda sin Express |
| `backend/local-server.js` | Ejecuta la misma lógica localmente sin AWS |
| `template.yaml` | IaC con AWS SAM/CloudFormation |
| `scripts/deploy-frontend.*` | Build React, upload S3, invalidación CloudFront |
| `scripts/cleanup.*` | Vacía bucket y elimina el stack |

## Solución de problemas

- **La web da 403:** verificar que se hayan subido archivos a S3, la política OAC y la distribución CloudFront.
- **La API da 404:** revisar behavior `/api/*` y ruta `GET /api/saludo` en API Gateway.
- **Ves una versión vieja:** revisar invalidación CloudFront y caché del navegador.
- **React no llega a la API local:** comprobar que Node escucha en :3000 y Vite en :5173.
- **Página en blanco:** comprobar que `frontend/dist/index.html` y `assets/` hayan sido publicados.
- Para añadir rutas de React Router, configurar fallback de SPA de manera que no convierta errores de `/api` en `index.html`.

## Eliminar recursos para evitar cargos

Después de terminar, vaciá el bucket y eliminá la infraestructura. Los scripts automatizan esto y pueden borrar datos: **revisalos antes de usarlos**.

```bash
bash scripts/cleanup.sh serverless-facil-demo
```

```powershell
.\scripts\cleanup.ps1 -StackName serverless-facil-demo
```

Comprobar después que CloudFormation terminó y que no quedan recursos facturables. **AWS puede cobrar** Lambda, API Gateway, S3 y CloudFront; los créditos y ofertas de nivel gratuito dependen de cada cuenta. Configurar AWS Budgets.

## Publicar en GitHub

Crear primero un repositorio vacío en GitHub, luego desde esta carpeta:

```bash
git init
git add .
git commit -m "Demo serverless: React + Lambda + SAM"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/serverless-facil-aws.git
git push -u origin main
```

No subir secretos ni credenciales AWS. Se recomienda incluir `package-lock.json` para instalaciones reproducibles; está incluido cuando se haya podido generar.

## Ejercicios sugeridos

1. Cambiar el saludo en `backend/app.js` y ejecutar `sam build && sam deploy`.
2. Cambiar los colores o el título de `frontend/src/App.jsx` y volver a ejecutar el script de publicación.
3. Agregar una ruta `GET /api/estado` a Lambda/SAM y probarla.
4. Incorporar autenticación antes de utilizar datos reales.

## Documentación oficial

- [React: construir una app desde cero](https://es.react.dev/learn/build-a-react-app-from-scratch)
- [Vite: configuración del servidor y proxy](https://vite.dev/config/server-options)
- [AWS SAM: deploy](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli-deploy.html)
- [CloudFront: Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [AWS Lambda: Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)

**Validación:** el backend puede probarse localmente con Node; `npm run build` y un deploy real AWS requieren una instalación de dependencias y credenciales AWS.
