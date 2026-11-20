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

| Variable | Qué poner |
| --- | --- |
| `SMTP_USER` | La cuenta Gmail que va a enviar. |
| `SMTP_PASS` | La contraseña de aplicación generada por Google, no la contraseña normal. |
| `EMAIL_FROM` | La misma dirección Gmail de `SMTP_USER` para esta configuración. |
| `EMAIL_NOTIFICATION_TO` | El buzón que recibirá las consultas. Puede ser la misma cuenta Gmail. |
| `FRONTEND_URL` | La dirección donde abrís la página. Los enlaces de recuperación apuntan allí. Para la prueba local: `http://localhost:5173`. |

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

| Síntoma | Qué revisar |
| --- | --- |
| La terminal dice correo simulado | `EMAIL_PROVIDER` debe ser `nodemailer`; reiniciá el backend después de cambiar `.env`. |
| Error de autenticación | Cuenta correcta y contraseña de aplicación vigente, sin espacios de presentación; no contraseña normal. |
| Consulta guardada pero sin correo | Destinatario, spam y log del backend; guardar la consulta y entregar el correo son operaciones distintas. |
| Recuperación sin correo | Cuenta administradora existente y activa, dirección guardada correcta, spam y log del backend. |
| No conecta con Gmail | Conectividad saliente a `smtp.gmail.com:465` y combinación `SMTP_PORT=465` / `SMTP_SECURE=true`. |
| El enlace abre una dirección incorrecta | Revisá `FRONTEND_URL` y solicitá un enlace nuevo tras reiniciar. `localhost` solo funciona en la misma PC donde corre la aplicación. |

Si necesitás ayuda, compartí únicamente el código de error y el mensaje sin credenciales. **No compartas `.env`, contraseñas, enlaces/tokens de recuperación ni logs completos sin revisarlos.**

## Antes de publicar

- [ ] No quedan valores de ejemplo en las variables de correo locales.
- [ ] Llegó una consulta de prueba al buzón receptor.
- [ ] La recuperación llegó a la cuenta de prueba y permitió restablecer su contraseña.
- [ ] No se agregaron `.env`, `.env.local` ni contraseñas a Git.
- [ ] Para un despliegue real, `FRONTEND_URL` apunta a la dirección pública correcta, no a `localhost`.
