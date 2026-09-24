import 'dotenv/config';
import { z } from 'zod';

const vacioAIndefinido = (valor) => {
  if (typeof valor !== 'string') return valor;
  const normalizado = valor.trim();
  return normalizado === '' ? undefined : normalizado;
};

const textoOpcional = z.preprocess(vacioAIndefinido, z.string().min(1).optional());
const urlOpcional = z.preprocess(vacioAIndefinido, z.string().url().optional());
const booleanoOpcional = z.preprocess((valor) => {
  const normalizado = vacioAIndefinido(valor);
  if (normalizado === 'true') return true;
  if (normalizado === 'false') return false;
  return normalizado;
}, z.boolean().optional());

const esquemaVariables = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    DATABASE_URL: z.preprocess(
      vacioAIndefinido,
      z
        .string()
        .url()
        .refine((url) => ['postgresql:', 'postgres:'].includes(new URL(url).protocol), {
          message: 'Debe ser una URL de PostgreSQL.'
        })
        .optional()
    ),
    JWT_SECRET: z.preprocess(vacioAIndefinido, z.string().optional()),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhd]$/, 'Debe usar un formato como 15m, 8h o 7d.')
      .default('1d'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
    CLOUDINARY_CLOUD_NAME: textoOpcional,
    CLOUDINARY_API_KEY: textoOpcional,
    CLOUDINARY_API_SECRET: textoOpcional,
    CLOUDINARY_FOLDER: textoOpcional,
    EMAIL_PROVIDER: z.preprocess(vacioAIndefinido, z.enum(['console', 'nodemailer']).optional()),
    SMTP_HOST: textoOpcional,
    SMTP_PORT: z.preprocess(
      vacioAIndefinido,
      z.coerce.number().int().min(1).max(65_535).optional()
    ),
    SMTP_SECURE: booleanoOpcional,
    SMTP_USER: textoOpcional,
    SMTP_PASS: textoOpcional,
    EMAIL_FROM: textoOpcional,
    EMAIL_NOTIFICATION_TO: textoOpcional,
    FRONTEND_URL: urlOpcional,
    PUBLIC_BASE_URL: urlOpcional
  })
  .superRefine((variables, contexto) => {
    if (variables.NODE_ENV !== 'test' && !variables.DATABASE_URL) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'Es obligatoria fuera del entorno de pruebas.'
      });
    }

    if (variables.NODE_ENV !== 'test') {
      const secreto = variables.JWT_SECRET ?? '';
      const secretoInseguro = /replace|reemplazar|cambiar|secret|password|contrase/i.test(secreto);

      if (secreto.length < 32 || secretoInseguro) {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'Debe contener al menos 32 caracteres y no puede ser un valor de ejemplo.'
        });
      }
    }

    const origenes = variables.CORS_ORIGIN.split(',').map((origen) => origen.trim());
    for (const origen of origenes) {
      if (!origen || origen === '*') {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: 'Debe contener orígenes explícitos separados por comas; no se permite *.'
        });
        break;
      }

      try {
        new URL(origen);
      } catch {
        contexto.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: `El origen ${origen} no es una URL válida.`
        });
      }
    }
  });

export function validarEntorno(variables = process.env) {
  const resultado = esquemaVariables.safeParse(variables);

  if (!resultado.success) {
    const detalle = resultado.error.issues
      .map((incidencia) => `${incidencia.path.join('.') || 'entorno'}: ${incidencia.message}`)
      .join('; ');
    throw new Error(`Configuración de entorno inválida: ${detalle}`);
  }

  const variablesValidas = resultado.data;
  const esPruebas = variablesValidas.NODE_ENV === 'test';

  const origenesCors = variablesValidas.CORS_ORIGIN.split(',').map((origen) => origen.trim());

  return Object.freeze({
    ambiente: variablesValidas.NODE_ENV,
    esDesarrollo: variablesValidas.NODE_ENV === 'development',
    esPruebas,
    esProduccion: variablesValidas.NODE_ENV === 'production',
    puerto: variablesValidas.PORT,
    urlBaseDatos: variablesValidas.DATABASE_URL,
    jwt: Object.freeze({
      secreto: variablesValidas.JWT_SECRET ?? 'secreto-exclusivo-para-pruebas-nexus-1234567890',
      expiracion: variablesValidas.JWT_EXPIRES_IN
    }),
    origenesCors: Object.freeze(origenesCors),
    nivelRegistro: variablesValidas.LOG_LEVEL ?? (esPruebas ? 'silent' : 'info'),
    proveedores: Object.freeze({
      cloudinary: Object.freeze({
        cloudName: variablesValidas.CLOUDINARY_CLOUD_NAME,
        apiKey: variablesValidas.CLOUDINARY_API_KEY,
        apiSecret: variablesValidas.CLOUDINARY_API_SECRET,
        carpeta: variablesValidas.CLOUDINARY_FOLDER ?? 'nexus/cursos'
      }),
      correo: Object.freeze({
        proveedor:
          variablesValidas.EMAIL_PROVIDER ??
          (variablesValidas.NODE_ENV === 'production' ? 'nodemailer' : 'console'),
        smtpHost: variablesValidas.SMTP_HOST,
        smtpPort: variablesValidas.SMTP_PORT,
        smtpSeguro: variablesValidas.SMTP_SECURE ?? variablesValidas.SMTP_PORT === 465,
        smtpUser: variablesValidas.SMTP_USER,
        smtpPassword: variablesValidas.SMTP_PASS,
        remitente: variablesValidas.EMAIL_FROM,
        destinatarioNotificaciones: variablesValidas.EMAIL_NOTIFICATION_TO
      })
    }),
    urlFrontend: variablesValidas.FRONTEND_URL ?? origenesCors[0],
    urlPublica: variablesValidas.PUBLIC_BASE_URL
  });
}

export const entorno = validarEntorno();
export const env = entorno;
