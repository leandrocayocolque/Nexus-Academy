const definicionesCategorias = [
  [
    '10000000-0000-4000-8000-000000000001',
    'Programación',
    'programacion',
    'Desarrollo de software, arquitectura y fundamentos de computación.'
  ],
  [
    '10000000-0000-4000-8000-000000000002',
    'Diseño',
    'diseno',
    'Diseño visual, de productos y de experiencias digitales.'
  ],
  [
    '10000000-0000-4000-8000-000000000003',
    'Negocios',
    'negocios',
    'Gestión, estrategia, finanzas y emprendimiento.'
  ],
  [
    '10000000-0000-4000-8000-000000000004',
    'Marketing',
    'marketing',
    'Marketing digital, contenidos y análisis de campañas.'
  ],
  [
    '10000000-0000-4000-8000-000000000005',
    'Idiomas',
    'idiomas',
    'Aprendizaje práctico de idiomas para el trabajo y los viajes.'
  ],
  [
    '10000000-0000-4000-8000-000000000006',
    'Ciencia de Datos',
    'ciencia-de-datos',
    'Análisis, visualización y aprendizaje automático con datos.'
  ]
];

const definicionesCursos = [
  [
    'Fundamentos de JavaScript',
    'fundamentos-javascript',
    'programacion',
    '8 semanas',
    18,
    '2027-02-01',
    '249.90',
    'PRINCIPIANTE',
    'EN_LINEA',
    true
  ],
  [
    'APIs modernas con Node.js',
    'apis-modernas-nodejs',
    'programacion',
    '10 semanas',
    12,
    '2027-02-15',
    '389.00',
    'INTERMEDIO',
    'HIBRIDA',
    true
  ],
  [
    'Arquitectura web avanzada',
    'arquitectura-web-avanzada',
    'programacion',
    '12 semanas',
    8,
    '2027-03-08',
    '549.50',
    'AVANZADO',
    'EN_LINEA',
    false
  ],
  [
    'Python desde cero',
    'python-desde-cero',
    'programacion',
    '8 semanas',
    20,
    '2027-04-05',
    '279.00',
    'PRINCIPIANTE',
    'PRESENCIAL',
    false
  ],
  [
    'Investigación de experiencia de usuario',
    'investigacion-experiencia-usuario',
    'diseno',
    '6 semanas',
    16,
    '2027-02-10',
    '229.00',
    'PRINCIPIANTE',
    'HIBRIDA',
    true
  ],
  [
    'Sistemas de diseño para productos digitales',
    'sistemas-diseno-productos-digitales',
    'diseno',
    '8 semanas',
    10,
    '2027-03-01',
    '359.90',
    'INTERMEDIO',
    'EN_LINEA',
    true
  ],
  [
    'Taller avanzado de diseño de producto',
    'taller-diseno-producto',
    'diseno',
    '10 semanas',
    0,
    '2027-03-22',
    '479.00',
    'AVANZADO',
    'PRESENCIAL',
    false
  ],
  [
    'Fundamentos de diseño gráfico',
    'fundamentos-diseno-grafico',
    'diseno',
    '7 semanas',
    14,
    '2027-04-12',
    '259.00',
    'PRINCIPIANTE',
    'PRESENCIAL',
    false
  ],
  [
    'Programa intensivo de emprendimiento',
    'programa-emprendimiento',
    'negocios',
    '6 semanas',
    22,
    '2027-02-06',
    '319.00',
    'TODOS_LOS_NIVELES',
    'HIBRIDA',
    true
  ],
  [
    'Dirección estratégica',
    'direccion-estrategica',
    'negocios',
    '8 semanas',
    9,
    '2027-03-03',
    '429.00',
    'AVANZADO',
    'EN_LINEA',
    false
  ],
  [
    'Finanzas para emprendimientos',
    'finanzas-emprendimientos',
    'negocios',
    '5 semanas',
    17,
    '2027-04-07',
    '289.90',
    'INTERMEDIO',
    'EN_LINEA',
    false
  ],
  [
    'Liderazgo en la práctica',
    'liderazgo-practica',
    'negocios',
    '6 semanas',
    11,
    '2027-05-05',
    '339.00',
    'TODOS_LOS_NIVELES',
    'PRESENCIAL',
    true
  ],
  [
    'Fundamentos de marketing digital',
    'fundamentos-marketing-digital',
    'marketing',
    '7 semanas',
    25,
    '2027-02-08',
    '239.00',
    'PRINCIPIANTE',
    'EN_LINEA',
    true
  ],
  [
    'Taller de estrategia de contenidos',
    'taller-estrategia-contenidos',
    'marketing',
    '4 semanas',
    13,
    '2027-03-15',
    '199.00',
    'INTERMEDIO',
    'HIBRIDA',
    false
  ],
  [
    'Analítica aplicada al marketing',
    'analitica-marketing',
    'marketing',
    '8 semanas',
    7,
    '2027-04-19',
    '369.00',
    'AVANZADO',
    'EN_LINEA',
    false
  ],
  [
    'Inglés para tecnología',
    'ingles-tecnologia',
    'idiomas',
    '10 semanas',
    19,
    '2027-02-03',
    '219.00',
    'INTERMEDIO',
    'EN_LINEA',
    true
  ],
  [
    'Español para negocios',
    'espanol-negocios',
    'idiomas',
    '10 semanas',
    15,
    '2027-03-10',
    '219.00',
    'PRINCIPIANTE',
    'HIBRIDA',
    false
  ],
  [
    'Conversación en portugués',
    'conversacion-portugues',
    'idiomas',
    '8 semanas',
    0,
    '2027-04-14',
    '189.00',
    'INTERMEDIO',
    'PRESENCIAL',
    false
  ],
  [
    'Análisis de datos con Python',
    'analisis-datos-python',
    'ciencia-de-datos',
    '10 semanas',
    14,
    '2027-02-17',
    '449.00',
    'INTERMEDIO',
    'HIBRIDA',
    true
  ],
  [
    'SQL y modelado de datos',
    'sql-modelado-datos',
    'ciencia-de-datos',
    '8 semanas',
    18,
    '2027-03-17',
    '349.00',
    'PRINCIPIANTE',
    'EN_LINEA',
    true
  ],
  [
    'Fundamentos de aprendizaje automático',
    'fundamentos-aprendizaje-automatico',
    'ciencia-de-datos',
    '12 semanas',
    6,
    '2027-04-21',
    '599.00',
    'AVANZADO',
    'EN_LINEA',
    false
  ],
  [
    'Visualización efectiva de datos',
    'visualizacion-datos',
    'ciencia-de-datos',
    '6 semanas',
    12,
    '2027-05-12',
    '329.00',
    'TODOS_LOS_NIVELES',
    'PRESENCIAL',
    false
  ],
  [
    'Modernización de sistemas heredados',
    'modernizacion-sistemas-heredados',
    'programacion',
    '6 semanas',
    5,
    '2027-05-17',
    '419.00',
    'AVANZADO',
    'HIBRIDA',
    false,
    false
  ],
  [
    'Estrategia de marca',
    'estrategia-marca',
    'marketing',
    '6 semanas',
    10,
    '2027-05-24',
    '309.00',
    'INTERMEDIO',
    'PRESENCIAL',
    false
  ]
];

const crearFechaSemilla = (fecha) => new Date(`${fecha}T14:00:00.000Z`);
const crearIdEstable = (prefijo, indice) =>
  `${prefijo}-0000-4000-8000-${String(indice + 1).padStart(12, '0')}`;

export function construirDatosSemilla({
  correoAdmin,
  nombreAdmin = 'Nexus',
  apellidoAdmin = 'Administrador'
}) {
  const correoAdminNormalizado = correoAdmin?.trim().toLowerCase();

  if (!correoAdminNormalizado) {
    throw new TypeError('Se requiere el correo del administrador para construir la semilla.');
  }

  const categorias = definicionesCategorias.map(([id, nombre, slug, descripcion]) => ({
    id,
    nombre,
    slug,
    descripcion,
    activa: true
  }));

  const cursos = definicionesCursos.map((definicion, indice) => {
    const [
      titulo,
      slug,
      slugCategoria,
      duracion,
      cuposDisponibles,
      fechaInicio,
      precio,
      nivel,
      modalidad,
      destacado,
      activo = true
    ] = definicion;

    return {
      id: crearIdEstable('20000000', indice),
      titulo,
      slug,
      slugCategoria,
      descripcion: `${titulo} combina acompañamiento docente, práctica guiada y un proyecto integrador.`,
      duracion,
      cuposDisponibles,
      fechaInicio: crearFechaSemilla(fechaInicio),
      precio,
      nivel,
      modalidad,
      destacado,
      activo
    };
  });

  return {
    negocio: {
      id: '00000000-0000-4000-8000-000000000001',
      claveUnica: 'negocio',
      nombre: 'NEXUS Academy',
      descripcion:
        'Formación práctica en tecnología, diseño, negocios y habilidades profesionales.',
      direccion: 'Avenida del Aprendizaje 100',
      telefono: '+54 11 5555 0100',
      correo: 'hola@nexus.example',
      enlacesSociales: {
        instagram: 'https://instagram.com/nexusacademy',
        linkedin: 'https://linkedin.com/company/nexusacademy'
      },
      horariosAtencion: {
        lunesAViernes: '09:00-20:00',
        sabado: '09:00-13:00'
      }
    },
    administrador: {
      id: '00000000-0000-4000-8000-000000000002',
      correo: correoAdminNormalizado,
      nombre: nombreAdmin.trim(),
      apellido: apellidoAdmin.trim(),
      rol: 'ADMIN',
      activo: true
    },
    categorias,
    cursos,
    promociones: [
      {
        id: '30000000-0000-4000-8000-000000000001',
        slugCurso: 'fundamentos-javascript',
        titulo: 'Inscripción anticipada',
        descripcion: 'Descuento por inscripción anticipada al curso de Fundamentos de JavaScript.',
        porcentajeDescuento: 15,
        estado: 'ACTIVA',
        fechaInicio: crearFechaSemilla('2027-01-01'),
        fechaFin: crearFechaSemilla('2027-01-25')
      },
      {
        id: '30000000-0000-4000-8000-000000000002',
        slugCurso: 'analisis-datos-python',
        titulo: 'Semana de los datos',
        descripcion: 'Promoción limitada para iniciar el recorrido de formación en datos.',
        porcentajeDescuento: 20,
        estado: 'ACTIVA',
        fechaInicio: crearFechaSemilla('2027-01-10'),
        fechaFin: crearFechaSemilla('2027-02-10')
      },
      {
        id: '30000000-0000-4000-8000-000000000003',
        slugCurso: null,
        titulo: 'Bienvenida a la comunidad',
        descripcion: 'Promoción general programada para nuevos estudiantes.',
        porcentajeDescuento: 10,
        estado: 'INACTIVA',
        fechaInicio: crearFechaSemilla('2027-06-01'),
        fechaFin: crearFechaSemilla('2027-06-30')
      },
      {
        id: '30000000-0000-4000-8000-000000000004',
        slugCurso: 'fundamentos-marketing-digital',
        titulo: 'Promoción de lanzamiento finalizada',
        descripcion: 'Registro histórico de una promoción ya finalizada.',
        porcentajeDescuento: 0,
        estado: 'EXPIRADA',
        fechaInicio: crearFechaSemilla('2026-11-01'),
        fechaFin: crearFechaSemilla('2026-11-15')
      }
    ],
    consultas: [
      {
        id: '40000000-0000-4000-8000-000000000001',
        slugCurso: 'apis-modernas-nodejs',
        nombre: 'Alejandra Molina',
        correo: 'alejandra.molina@example.com',
        telefono: '+54 11 5555 0101',
        asunto: 'Conocimientos previos',
        mensaje: '¿Qué temas de JavaScript debería repasar antes de comenzar el curso?',
        estado: 'PENDIENTE'
      },
      {
        id: '40000000-0000-4000-8000-000000000002',
        slugCurso: 'sistemas-diseno-productos-digitales',
        nombre: 'Tomás Rivas',
        correo: 'tomas.rivas@example.com',
        telefono: null,
        asunto: 'Detalle de horarios',
        mensaje: '¿Las clases en vivo quedan grabadas para poder repasarlas?',
        estado: 'LEIDA'
      },
      {
        id: '40000000-0000-4000-8000-000000000003',
        slugCurso: null,
        nombre: 'Julia López',
        correo: 'julia.lopez@example.com',
        telefono: null,
        asunto: 'Capacitación para equipos',
        mensaje: 'Necesito información sobre opciones de capacitación para un equipo de trabajo.',
        estado: 'RESPONDIDA'
      }
    ]
  };
}

export const buildSeedData = construirDatosSemilla;
