# Backend de NEXUS Academy

Backend modular en Node.js, Express, Prisma y PostgreSQL. La API REST se publica bajo `/api` con el flujo Route -> Middleware -> Controller -> Service -> Repository. La documentación interactiva está en `GET /api/docs` (Swagger UI) y la especificación OpenAPI en `GET /api/docs.json`.

La inteligencia artificial está deliberadamente fuera del proceso principal y no forma parte de esta base.

## Inicio rápido

1. Instale Node.js 24 o una versión compatible y PostgreSQL.
2. Copie `.env.example` como `.env` y reemplace las credenciales de ejemplo.
3. Cree la base de datos indicada en `DATABASE_URL`.
4. Ejecute:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

5. Verifique `http://localhost:3000/api/health`.

Respuesta esperada:

```json
{ "estado": "ok", "servicio": "nexus-api" }
```

## Requisitos

| Recurso    | Uso                                                          |
| ---------- | ------------------------------------------------------------ |
| Node.js    | Runtime ESM de la aplicación y herramientas.                 |
| PostgreSQL | Persistencia de usuarios, catálogo, consultas y promociones. |
| npm        | Instalación reproducible mediante `package-lock.json`.       |

Los proveedores SMTP y Cloudinary son opcionales para iniciar el proceso. Si faltan credenciales, la aplicación arranca y la funcionalidad correspondiente devuelve un error operacional seguro cuando se invoca.

## Configuración

### Variables obligatorias fuera de pruebas

| Variable       | Descripción                                                       |
| -------------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | URL PostgreSQL.                                                   |
| `JWT_SECRET`   | Secreto aleatorio de al menos 32 caracteres.                      |
| `CORS_ORIGIN`  | Uno o más orígenes explícitos separados por comas. No admite `*`. |

### Administrador de desarrollo

El seed usa `ADMIN_DESARROLLO_CORREO`, `ADMIN_DESARROLLO_CONTRASENA`, `ADMIN_DESARROLLO_NOMBRE` y `ADMIN_DESARROLLO_APELLIDO`. Cambie siempre la contraseña de ejemplo antes de ejecutar el seed.

### Correo

| Variable                                | Descripción                                                         |
| --------------------------------------- | ------------------------------------------------------------------- |
| `EMAIL_PROVIDER`                        | `console` o `nodemailer`. Desarrollo y pruebas usan consola segura. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Conexión SMTP para Nodemailer.                                      |
| `SMTP_USER`, `SMTP_PASS`                | Credenciales SMTP.                                                  |
| `EMAIL_FROM`                            | Remitente visible.                                                  |
| `EMAIL_NOTIFICATION_TO`                 | Destino interno para nuevas consultas.                              |

El proveedor de consola registra únicamente metadatos. Nunca registra tokens de restablecimiento ni enlaces completos.

### Imágenes

Cloudinary requiere `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`. `CLOUDINARY_FOLDER` controla la carpeta remota.

Sólo se aceptan JPEG, PNG y WebP de hasta 5 MB. Los nombres se normalizan y cada recurso recibe un identificador aleatorio seguro.

## Base de datos

### Desarrollo

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

El seed es determinista e idempotente: crea un negocio singleton, un ADMIN, seis categorías, más de veinte cursos, promociones y consultas sin duplicar registros al repetirlo.

### Despliegue

1. Configure secretos y `DATABASE_URL`.
2. Ejecute `npm run prisma:migrate:deploy` antes de iniciar la aplicación.
3. Inicie con `npm start`.
4. Compruebe `/api/health`.

No ejecute migraciones destructivas ni el seed contra producción sin revisar previamente los datos.

## Decisiones de dominio

- La disponibilidad de un curso se deriva como `activo && cuposDisponibles > 0`; nunca se almacena.
- El dinero se persiste como `Decimal` y se serializa como texto para evitar pérdida de precisión.
- Una categoría con cursos no puede eliminarse y produce `CATEGORIA_EN_USO`.
- Al eliminar un curso, sus imágenes de base de datos se eliminan por cascada; consultas y promociones conservan su historial con `cursoId = null`.
- La limpieza de imágenes externas ocurre después del borrado persistente y es best-effort: un fallo se registra sin restaurar referencias ya eliminadas.
- Las consultas se guardan antes de enviar correo; una caída de SMTP no pierde la consulta.
- Los restablecimientos guardan sólo SHA-256 del token, expiran, son de un solo uso y se consumen en transacción.

## Comandos

| Comando                         | Acción                                 |
| ------------------------------- | -------------------------------------- |
| `npm run dev`                   | Inicia con recarga por cambios.        |
| `npm start`                     | Inicia el servidor.                    |
| `npm test`                      | Ejecuta toda la suite una vez.         |
| `npm run test:watch`            | Ejecuta Vitest en modo observación.    |
| `npm run lint`                  | Ejecuta ESLint.                        |
| `npm run format`                | Formatea el proyecto con Prettier.     |
| `npm run format:check`          | Verifica formato sin modificar.        |
| `npm run prisma:format`         | Formatea el schema Prisma.             |
| `npm run prisma:validate`       | Valida el schema Prisma.               |
| `npm run prisma:generate`       | Genera Prisma Client.                  |
| `npm run prisma:migrate`        | Crea/aplica migraciones de desarrollo. |
| `npm run prisma:migrate:deploy` | Aplica migraciones existentes.         |
| `npm run prisma:seed`           | Ejecuta la semilla idempotente.        |
| `npm run prisma:studio`         | Abre Prisma Studio.                    |

## Estructura

```text
prisma/                 schema, migración inicial y seed
src/
  config/               entorno, seguridad, logger, CORS y Prisma
  database/             repositorios agregados y transacciones
  modules/              schemas, repositorios y servicios de dominio
  providers/            correo y almacenamiento reemplazables
  shared/               errores, seguridad, mappers y middleware
tests/
  integration/prisma/   validaciones estáticas y pruebas condicionadas por DB
  modules/              servicios de identidad y negocio
  providers/            adaptadores sin red real
  repositories/         contratos de persistencia con cliente simulado
  api/                  pruebas HTTP con supertest por módulo
  runtime/              health, defensas, configuración y apagado
```

## API HTTP

Cada módulo expone `*.controller.js` y `*.routes.js`; `src/routes.js` los agrega bajo `/api`. Las rutas públicas y las de administración (`/api/admin/*`) se separan: todo `/api/admin/*` y `/api/usuarios/*` exige `Authorization: Bearer <jwt>` con rol `ADMIN`.

| Módulo        | Públicas                                                                                      | Administración (`/api/admin`)                                                                      |
| ------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Autenticación | `POST /api/autenticacion/{registro,login,logout,recuperar-contrasena,restablecer-contrasena}` | —                                                                                                  |
| Usuario       | `GET/PATCH /api/usuarios/me` (requiere token)                                                 | —                                                                                                  |
| Academia      | `GET /api/academia`                                                                           | `PUT /academia`                                                                                    |
| Categorías    | `GET /api/categorias` (sólo activas)                                                          | `GET, POST /categorias`, `PATCH, DELETE /categorias/:id`                                           |
| Cursos        | `GET /api/cursos`, `GET /api/cursos/:id` (sólo activos)                                       | `GET, POST /cursos`, `GET, PATCH, DELETE /cursos/:id`, `PATCH /cursos/:id/{estado,destacado}`      |
| Imágenes      | —                                                                                             | `POST /cursos/:id/imagenes` (multipart, campo `imagenes`), `DELETE /cursos/:id/imagenes/:imagenId` |
| Consultas     | `POST /api/consultas`                                                                         | `GET /consultas`, `GET, DELETE /consultas/:id`, `PATCH /consultas/:id/estado`                      |
| Promociones   | `GET /api/promociones` (sólo vigentes)                                                        | `GET, POST /promociones`, `GET, PATCH, DELETE /promociones/:id`                                    |
| Dashboard     | —                                                                                             | `GET /dashboard?desde&hasta&limite&umbral`                                                         |

Decisiones de la capa HTTP:

- **Registro:** mientras no exista ningún administrador, `POST /api/autenticacion/registro` es abierto (alta inicial). Después exige el token de un administrador, para que nadie pueda autoasignarse permisos.
- **Logout:** los JWT no tienen estado; el endpoint valida el token y el cliente lo descarta.
- **Visibilidad pública:** los cursos inactivos no aparecen en `/api/cursos` y su detalle responde 404; las categorías públicas son sólo las activas.
- **Límites de solicitudes:** login y registro usan el limitador de inicio de sesión; recuperación/restablecimiento, el de restablecimiento; `POST /api/consultas`, el de consultas.
- **Imágenes:** hasta 5 archivos por solicitud y 10 por curso. Se verifica la firma binaria además del MIME declarado. Si falla una subida o la persistencia, se eliminan las imágenes externas ya subidas.
- **Validación:** los services validan con Zod; los errores se responden como `400 DATOS_INVALIDOS` con `detalles`.

## Verificación local

```bash
npm ci
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run format:check
npm run lint
npm test
```

Las pruebas no realizan solicitudes a SMTP, Cloudinary ni otros proveedores externos. Las comprobaciones de migración, relaciones y seed contra PostgreSQL requieren una instancia real y deben informarse como bloqueadas cuando no esté disponible.
