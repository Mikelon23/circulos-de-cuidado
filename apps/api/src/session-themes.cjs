const crypto = require('node:crypto');

const DEFAULT_THEMES = [
  {
    id: 'tema-manejo-de-la-culpa',
    titulo: 'Manejo de la culpa',
    descripcion: 'Explorar cómo cuidar sin cargar con toda la responsabilidad.',
    categoria: 'autoaceptación',
    etiquetas: ['culpa', 'autoaceptación', 'bienestar'],
    activo: true,
  },
  {
    id: 'tema-comunicacion-con-medicos',
    titulo: 'Comunicación con médicos',
    descripcion: 'Preparar preguntas claras y comunicar necesidades con más confianza.',
    categoria: 'acompañamiento',
    etiquetas: ['médicos', 'comunicación', 'apoyo'],
    activo: true,
  },
  {
    id: 'tema-cuando-ya-no-puedes-mas',
    titulo: 'Cuando ya no puedes más',
    descripcion: 'Reconocer límites, pedir ayuda y buscar pequeñas formas de sostén.',
    categoria: 'límite',
    etiquetas: ['agotamiento', 'límites', 'apoyo'],
    activo: true,
  },
  {
    id: 'tema-limites-sanos',
    titulo: 'Límites sanos',
    descripcion: 'Crear decisiones claras para proteger tu energía y tus relaciones.',
    categoria: 'relaciones',
    etiquetas: ['límites', 'relaciones', 'energía'],
    activo: true,
  },
];

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function sanitizeTheme(theme) {
  if (!theme) {
    return theme;
  }

  return {
    ...theme,
    etiquetas: Array.isArray(theme.etiquetas) ? [...theme.etiquetas] : [],
  };
}

function createSessionThemeService() {
  const themes = DEFAULT_THEMES.map((theme) => ({
    ...theme,
    etiquetas: [...theme.etiquetas],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return {
    listThemes({ includeInactive = true } = {}) {
      const result = [...themes];
      return result
        .filter((theme) => includeInactive || theme.activo !== false)
        .map((theme) => sanitizeTheme(theme));
    },

    getTheme(themeId) {
      if (!themeId) {
        throw new Error('El identificador del tema es obligatorio');
      }

      const theme = themes.find((candidate) => candidate.id === themeId);
      if (!theme) {
        throw new Error('Tema no encontrado');
      }

      return sanitizeTheme(theme);
    },

    createTheme(payload = {}) {
      const titulo = String(payload.titulo || payload.title || '').trim();
      const descripcion = String(payload.descripcion || payload.description || '').trim();
      const categoria = String(payload.categoria || payload.category || '').trim();
      const etiquetas = normalizeTags(payload.etiquetas ?? payload.tags ?? []);
      const activo = payload.activo === undefined ? true : Boolean(payload.activo);

      if (!titulo) {
        throw new Error('El título del tema es obligatorio');
      }

      const theme = {
        id: payload.id ? String(payload.id).trim() : crypto.randomUUID(),
        titulo,
        descripcion: descripcion || 'Tema de sesión para acompañar la conversación del grupo.',
        categoria: categoria || 'general',
        etiquetas,
        activo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      themes.push(theme);
      return sanitizeTheme(theme);
    },

    updateTheme(themeId, updates = {}) {
      if (!themeId) {
        throw new Error('El identificador del tema es obligatorio');
      }

      const theme = themes.find((candidate) => candidate.id === themeId);
      if (!theme) {
        throw new Error('Tema no encontrado');
      }

      if (updates.titulo !== undefined || updates.title !== undefined) {
        const titulo = String(updates.titulo ?? updates.title ?? theme.titulo).trim();
        if (!titulo) {
          throw new Error('El título del tema es obligatorio');
        }
        theme.titulo = titulo;
      }

      if (updates.descripcion !== undefined || updates.description !== undefined) {
        theme.descripcion = String(updates.descripcion ?? updates.description ?? theme.descripcion).trim() || theme.descripcion;
      }

      if (updates.categoria !== undefined || updates.category !== undefined) {
        theme.categoria = String(updates.categoria ?? updates.category ?? theme.categoria).trim() || theme.categoria;
      }

      if (updates.etiquetas !== undefined || updates.tags !== undefined) {
        theme.etiquetas = normalizeTags(updates.etiquetas ?? updates.tags ?? theme.etiquetas);
      }

      if (updates.activo !== undefined) {
        theme.activo = Boolean(updates.activo);
      }

      theme.updatedAt = new Date().toISOString();
      return sanitizeTheme(theme);
    },

    deleteTheme(themeId) {
      if (!themeId) {
        throw new Error('El identificador del tema es obligatorio');
      }

      const index = themes.findIndex((candidate) => candidate.id === themeId);
      if (index === -1) {
        throw new Error('Tema no encontrado');
      }

      const [deleted] = themes.splice(index, 1);
      return sanitizeTheme(deleted);
    },
  };
}

module.exports = {
  createSessionThemeService,
  DEFAULT_THEMES,
};
