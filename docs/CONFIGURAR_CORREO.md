# Configurar Gmail para consultas y recuperación de contraseña

Podés usar una sola cuenta Gmail existente para enviar y recibir durante las pruebas. Esta guía contiene ejemplos, no credenciales reales. Todavía no se comprobó la entrega real.

## 1. Preparar la cuenta de Google

1. Iniciá sesión en la cuenta Gmail que va a usar la academia para enviar.
2. Entrá en https://myaccount.google.com/security y activá la **Verificación en dos pasos**.
3. Entrá en https://myaccount.google.com/apppasswords.
4. Creá una contraseña de aplicación con un nombre como **NEXUS Academia**.
5. Guardá esa contraseña directamente en tu archivo local `backend/.env`, como se indica abajo. Si Google la muestra agrupada con espacios, copiá los 16 caracteres sin los espacios de presentación.

**No uses tu contraseña habitual de Google. No compartas la contraseña de aplicación en el chat ni la subas al repositorio.** Si la cuenta es administrada por una institución, tiene Protección Avanzada u otra restricción, Google puede no ofrecer contraseñas de aplicación. No desactives la seguridad para resolverlo; hay que usar otro método o proveedor autorizado.

## 2. Completar `backend/.env`

Abrí **`backend/.env`** en el editor. Reemplazá las variables que ya existan y agregá las que falten; **no dupliques los nombres ni reemplaces el archivo entero**. Conservá `DATABASE_URL`, `JWT_SECRET`, Cloudinary y el resto de tu configuración.

Copiá este bloque y reemplazá los valores de ejemplo:

```dotenv
NODE_ENV=development
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu_cuenta@gmail.com
SMTP_PASS=REEMPLAZAR_CON_CONTRASENA_DE_APLICACION
EMAIL_FROM=tu_cuenta@gmail.com
EMAIL_NOTIFICATION_TO=tu_cuenta@gmail.com
FRONTEND_URL=http://localhost:5173
```

| Variable                | Qué poner                                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `SMTP_USER`             | La cuenta Gmail que va a enviar.                                                                                             |
| `SMTP_PASS`             | La contraseña de aplicación generada por Google, no la contraseña normal.                                                    |
| `EMAIL_FROM`            | La misma dirección Gmail de `SMTP_USER` para esta configuración.                                                             |
| `EMAIL_NOTIFICATION_TO` | El buzón que recibirá las consultas. Puede ser la misma cuenta Gmail.                                                        |
| `FRONTEND_URL`          | La dirección donde abrís la página. Los enlaces de recuperación apuntan allí. Para la prueba local: `http://localhost:5173`. |

**Tres variables con dirección de correo no significan tres cuentas diferentes.** Para probar, usá la misma dirección en `SMTP_USER`, `EMAIL_FROM` y `EMAIL_NOTIFICATION_TO`.

`EMAIL_PROVIDER=console` simula correos; no los entrega. Para enviar realmente debe quedar `nodemailer` y estar completa la configuración SMTP. En modo `test`, el código conserva el proveedor de consola por seguridad.

### Configuración del frontend (solo si falta)

En **`frontend/.env.local`** debe estar:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Esto conecta el navegador con el backend, no con Gmail. **Nunca pongas la contraseña SMTP en el frontend ni en una variable `VITE_*`.**

## 3. Reiniciar las aplicaciones

Detené el backend con `Ctrl+C` y volvé a iniciarlo. Desde la raíz del proyecto, en PowerShell:

```powershell
cd backend
npm run dev
```

En otra terminal, desde la raíz:

```powershell
cd frontend
npm run dev
```

Si ya tenés el frontend funcionando y no cambiaste su configuración, no hace falta reiniciarlo. Abrí `http://localhost:5173`. El backend debe mostrar **API NEXUS disponible**; si falla la conexión con Supabase, resolvé ese error antes de probar formularios.

## 4. Probar una consulta real

Esta prueba **crea una consulta en la base de datos y envía un correo real**.

1. Abrí **Contacto**.
2. Completá nombre, un correo válido del visitante, asunto y mensaje. Usá un asunto reconocible, por ejemplo `Prueba de correo NEXUS`.
3. Enviá una sola vez.
4. Comprobá que la consulta aparezca en la gestión de consultas del administrador.
5. Revisá el buzón configurado en **`EMAIL_NOTIFICATION_TO`**, incluida la carpeta de spam.

El correo del formulario identifica al visitante: **no decide a qué buzón llega la notificación**. El correo editado en la información del comercio tampoco reemplaza `EMAIL_NOTIFICATION_TO` en la implementación actual.

La implementación actual **no envía confirmación automática al visitante**. Su dirección aparece en el cuerpo del correo; tampoco hay un encabezado `Reply-To` configurado, así que para responderle copiá su dirección, no uses el botón Responder sin revisar el destinatario.

**Que el formulario diga que la consulta se guardó no demuestra que llegó el mail:** el sistema conserva la consulta aunque falle la notificación. No repitas el envío para intentar forzar el correo, porque crearías consultas duplicadas.

## Responder consultas desde administración (contrato para frontend)

El backend permite `POST /api/admin/consultas/:id/respuestas`, protegido por el mismo token **ADMIN** del resto de administración. No se sincronizan respuestas entrantes: llegan al buzón de la academia. No hay cola ni reintentos automáticos.

### Preparación pendiente de autorización

La migración manual `backend/prisma/migrations/20261120000000_add_inquiry_reply_attempts/migration.sql` debe aplicarse al entorno destino antes de usar este endpoint, siguiendo el procedimiento de despliegue autorizado. **No fue ejecutada como parte de esta implementación.** Validar/generar el cliente Prisma local no aplica migraciones. No se requieren dependencias ni variables nuevas; se reutiliza el transportador SMTP existente. No se comprobó entrega real.

### Solicitud y resultado

```http
POST /api/admin/consultas/ID_GUARDADO/respuestas
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json

{"mensaje":"Hola, el curso comienza el lunes. Saludos, NEXUS.","claveIdempotencia":"550e8400-e29b-41d4-a716-446655440000"}
```

- `mensaje`: texto plano de 1–5000 caracteres después de recortar extremos. Admite saltos de línea/tabulaciones; rechaza otros controles. No se envía HTML ni adjuntos. El frontend debe renderizar el texto escapado, nunca como HTML.
- `claveIdempotencia`: 16–100 caracteres ASCII alfanuméricos, guion o guion bajo; generar una vez por intención de envío (por ejemplo UUID) y conservarla junto al borrador. No regenerar al hacer doble clic, tras timeout, al reconectar ni al repetir una petición.
- Se rechazan campos adicionales. Destinatario y asunto (`Re: ...`, sin controles) salen exclusivamente de la consulta guardada. `actorId` se toma del token autenticado y se conserva como identificador histórico, sin relación con borrado de usuarios.

HTTP **200**, tanto para un intento terminado como para uno repetido:

```json
{
  "repetida": false,
  "respuesta": {
    "id": "ID_INTENTO",
    "consultaId": "ID_GUARDADO",
    "claveIdempotencia": "550e8400-e29b-41d4-a716-446655440000",
    "actorId": "ID_ADMIN",
    "destinatario": "visitante@example.com",
    "asunto": "Re: Información del curso",
    "mensaje": "Hola, el curso comienza el lunes. Saludos, NEXUS.",
    "estado": "ACEPTADA",
    "proveedorId": "ID_SMTP",
    "errorCodigo": null,
    "creadaEn": "2026-11-20T12:00:00.000Z",
    "finalizadaEn": "2026-11-20T12:00:01.000Z"
  }
}
```

`GET /api/admin/consultas/:id` conserva sus campos actuales y agrega `respuestas: []`, con esos mismos intentos ordenados por `creadaEn`, luego `id`, ascendentes. `proveedorId`, `errorCodigo` y `finalizadaEn` pueden ser `null`. El listado general no incluye historial.

| Estado del intento | Significado y acción del frontend                                                                                                                                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ENVIANDO`         | Reserva persistida antes del envío. Puede estar activo o haber quedado interrumpido. Conservar borrador y clave; consultar historial. Nunca interpretar el paso del tiempo como fallo definitivo.                                                                                    |
| `ACEPTADA`         | SMTP confirmó aceptación del destinatario exacto. No garantiza entrega/lectura. Historial y `consulta.estado=RESPONDIDA` se guardan en una misma transacción. Puede limpiar el borrador de esa intención.                                                                            |
| `FALLIDA`          | No hubo aceptación confirmada y el fallo es definitivo (rechazo explícito, autenticación/configuración, o simulación). Conservar borrador; mostrar `errorCodigo`. Tras resolver la causa, un nuevo envío requiere acción explícita y **una clave nueva**; la anterior nunca reenvía. |
| `INCIERTA`         | Conexión interrumpida/timeout u otro resultado sin evidencia suficiente. Conservar borrador; comprobar con el proveedor/buzón antes de decidir un nuevo envío. Nunca reintentar automáticamente con otra clave.                                                                      |

**Idempotencia:** se reserva una fila única por consulta+clave antes de contactar SMTP. Peticiones concurrentes con esa misma clave recuperan el intento y devuelven `repetida: true` sin enviar de nuevo, cualquiera sea su estado. Reutilizar clave con texto normalizado diferente da **409**. Una clave nueva representa otra intención explícita y puede enviar otro correo; no es un mecanismo de recuperación automática.

Errores HTTP: **400** entrada inválida, **401/403** autenticación/permisos, **404** consulta inexistente, **409** clave reutilizada con otro texto. Si SMTP termina pero falla la persistencia final, se devuelve **503** con código `RESPUESTA_NO_CONFIRMADA` y `detalles.respuestaId`; no se afirma éxito ni se repite SMTP. La reserva normalmente sigue `ENVIANDO` (o puede estar finalizada si se perdió la confirmación de commit). Consultar detalle o repetir la misma clave permite recuperar lo persistido sin reenviar. Si la reserva inicial falla, no se contacta SMTP.

Los códigos seguros de resultado son `SMTP_RECHAZADO`, `SMTP_NO_ACEPTADO`, `SMTP_RESULTADO_INCIERTO`, `CORREO_NO_DISPONIBLE`, `CORREO_SIMULADO`, `RESULTADO_DESCONOCIDO`; no se guardan excepciones ni respuestas SMTP crudas. Los proveedores consola/memoria **no** simulan aceptación: generan `FALLIDA / CORREO_SIMULADO` y no marcan `RESPONDIDA`.

No se pueden eliminar consultas con historial (incluidas fallidas): **409**, respaldado por clave foránea restrictiva. Así se conservan auditoría e idempotencia incluso durante un envío. Los cambios manuales de estado existentes siguen siendo manuales y no envían correo; el estado del intento es la evidencia del envío. No hay reconciliación automática de intentos interrumpidos ni interfaz de administración para resolverlos en este alcance.

## 5. Probar recuperación de contraseña

Esta prueba genera un enlace real y, si lo usás, **cambia la contraseña de la cuenta elegida**. Usá una cuenta de prueba que controles.

1. Confirmá que el correo guardado en el perfil del administrador sea una dirección a la que tengas acceso.
2. En **Iniciar sesión**, elegí **Recuperar contraseña**.
3. Ingresá exactamente el correo de esa cuenta administradora.
4. Revisá ese buzón y spam. El destinatario es el correo del administrador, **no** `EMAIL_NOTIFICATION_TO`.
5. Abrí el enlace y completá una contraseña nueva válida con su confirmación.
6. Comprobá que puedas iniciar sesión con la nueva contraseña.

Por seguridad, la respuesta de recuperación es genérica: no confirma si una cuenta existe ni si el correo pudo entregarse. Un correo no registrado o una falla SMTP pueden mostrar la misma respuesta que un pedido válido. Los enlaces vencen y son de un solo uso.

## Si no llega el correo

| Síntoma                                 | Qué revisar                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| La terminal dice correo simulado        | `EMAIL_PROVIDER` debe ser `nodemailer`; reiniciá el backend después de cambiar `.env`.                                               |
| Error de autenticación                  | Cuenta correcta y contraseña de aplicación vigente, sin espacios de presentación; no contraseña normal.                              |
| Consulta guardada pero sin correo       | Destinatario, spam y log del backend; guardar la consulta y entregar el correo son operaciones distintas.                            |
| Recuperación sin correo                 | Cuenta administradora existente y activa, dirección guardada correcta, spam y log del backend.                                       |
| No conecta con Gmail                    | Conectividad saliente a `smtp.gmail.com:465` y combinación `SMTP_PORT=465` / `SMTP_SECURE=true`.                                     |
| El enlace abre una dirección incorrecta | Revisá `FRONTEND_URL` y solicitá un enlace nuevo tras reiniciar. `localhost` solo funciona en la misma PC donde corre la aplicación. |

Si necesitás ayuda, compartí únicamente el código de error y el mensaje sin credenciales. **No compartas `.env`, contraseñas, enlaces/tokens de recuperación ni logs completos sin revisarlos.**

## Antes de publicar

- [ ] No quedan valores de ejemplo en las variables de correo locales.
- [ ] Llegó una consulta de prueba al buzón receptor.
- [ ] La recuperación llegó a la cuenta de prueba y permitió restablecer su contraseña.
- [ ] No se agregaron `.env`, `.env.local` ni contraseñas a Git.
- [ ] Para un despliegue real, `FRONTEND_URL` apunta a la dirección pública correcta, no a `localhost`.
