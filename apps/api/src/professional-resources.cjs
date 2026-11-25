const DEFAULT_RESOURCES = [
  {
    id: 'madrid-salud-mental-comunitaria',
    nombre: 'Atención psicológica comunitaria',
    region: 'Madrid',
    modalidad: 'presencial',
    tipo: 'Centro comunitario',
    coste: 'Gratuito o bajo costo',
    descripcion: 'Apoyo psicológico comunitario para personas cuidadoras y familias.',
    contacto: '112',
    disponibilidad: 'Consulta disponibilidad y derivación en el centro de salud local.',
  },
  {
    id: 'barcelona-linia-salut',
    nombre: 'Orientación de salud mental',
    region: 'Barcelona',
    modalidad: 'telefono',
    tipo: 'Servicio público',
    coste: 'Gratuito',
    descripcion: 'Orientación para identificar recursos asistenciales adecuados.',
    contacto: '061',
    disponibilidad: 'Servicio de orientación según horarios del sistema sanitario.',
  },
  {
    id: 'nacional-linea-profesional',
    nombre: 'Primera orientación psicológica',
    region: 'Nacional',
    modalidad: 'telefonica',
    tipo: 'Línea de orientación',
    coste: 'Gratuito',
    descripcion: 'Información inicial sobre apoyo profesional y derivación.',
    contacto: 'Consulta tu 012 o 061',
    disponibilidad: 'Disponibilidad según tu comunidad autónoma.',
  },
  {
    id: 'universidad-practicas-psicologia',
    nombre: 'Consulta psicológica con supervisión',
    region: 'Todas',
    modalidad: 'presencial',
    tipo: 'Facultad o práctica universitaria',
    coste: 'Bajo costo',
    descripcion: 'Sesiones con estudiantes supervisadas por profesionales y tarifas reducidas.',
    contacto: 'Consulta las universidades públicas de tu provincia',
    disponibilidad: 'Requiere solicitud previa y criterio de admisión.',
  },
];

function normalizeText(value) {
  return String(value || '').trim();
}

function createProfessionalResourcesService() {
  const resources = DEFAULT_RESOURCES.map((resource) => ({ ...resource }));

  function sanitizeResource(resource) {
    return { ...resource };
  }

  function listResources(options = {}) {
    const region = normalizeText(options.region).toLowerCase();
    const modality = normalizeText(options.modalidad).toLowerCase();
    const cost = normalizeText(options.coste).toLowerCase();

    return resources
      .filter((resource) => {
        if (!region || region === 'todas') return true;
        const resourceRegion = resource.region.toLowerCase();
        return (
          resourceRegion === 'nacional' ||
          resourceRegion === 'todas' ||
          resourceRegion === region
        );
      })
      .filter((resource) =>
        !modality || modality === 'todas'
          ? true
          : resource.modalidad.toLowerCase() === modality
      )
      .filter((resource) =>
        !cost
          ? true
          : cost === 'gratuito'
            ? resource.coste.toLowerCase().includes('gratuito')
            : cost === 'bajo-costo'
              ? resource.coste.toLowerCase().includes('bajo costo')
              : true
      )
      .map(sanitizeResource);
  }

  function getResource(resourceId) {
    const normalizedId = normalizeText(resourceId);
    if (!normalizedId) {
      throw new Error('El identificador del recurso es obligatorio');
    }
    const resource = resources.find((candidate) => candidate.id === normalizedId);
    if (!resource) {
      throw new Error('Recurso profesional no encontrado');
    }
    return sanitizeResource(resource);
  }

  function listRegions() {
    return [...new Set(resources.map((resource) => resource.region))].sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  }

  return {
    listResources,
    getResource,
    listRegions,
  };
}

module.exports = {
  createProfessionalResourcesService,
  DEFAULT_RESOURCES,
};
