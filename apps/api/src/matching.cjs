/**
 * Matching Scoring Service
 * Implements the compatibility scoring algorithm defined in docs/MATCHING.md
 */

// Disease categories mapping
const DISEASE_CATEGORIES = {
  // Neurodegenerative
  alzheimer: 'neurodegenerative',
  parkinson: 'neurodegenerative',
  ela: 'neurodegenerative',
  demencia: 'neurodegenerative',
  demencia_vascular: 'neurodegenerative',
  deterioro_cognitivo: 'neurodegenerative',
  esclerosis_lateral_amiotrofica: 'neurodegenerative',

  // Oncological
  cancer: 'oncological',
  tumor: 'oncological',
  maligno: 'oncological',
  neoplasia: 'oncological',

  // Cardiovascular
  insuficiencia_cardiaca: 'cardiovascular',
  acv: 'cardiovascular',
  accidente_cerebrovascular: 'cardiovascular',
  hipertension: 'cardiovascular',
  cardiopatia: 'cardiovascular',
  enfermedad_cardiaca: 'cardiovascular',

  // Respiratory
  epoc: 'respiratory',
  enfermedad_pulmonar_obstructiva_cronica: 'respiratory',
  fibrosis_pulmonar: 'respiratory',
  asma: 'respiratory',
  insuficiencia_respiratoria: 'respiratory',

  // Endocrine
  diabetes: 'endocrine',
  hipotiroidismo: 'endocrine',
  tiroidismo: 'endocrine',
  metabolica: 'endocrine',

  // Mobility
  paralisis: 'mobility',
  artrosis: 'mobility',
  artritis: 'mobility',
  osteoporosis: 'mobility',
  movilidad_reducida: 'mobility',
  limitacion_motriz: 'mobility',

  // Palliative
  cuidado_paliativo: 'palliative',
  paliativos: 'palliative',
  fin_de_vida: 'palliative',
  terminal: 'palliative',
};

const VALID_PHASES = new Set(['inicial', 'intermedio', 'avanzado']);
const VALID_LANGUAGES = new Set(['es', 'en', 'pt', 'fr', 'de']);

/**
 * Normalize disease name to category
 * @param {string} disease - Disease name
 * @returns {string|null} - Disease category or null if invalid
 */
function normalizeDiseaseToCategory(disease) {
  if (!disease || typeof disease !== 'string') {
    return null;
  }

  const normalized = disease
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[áéíóú]/g, (char) => {
      const map = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
      return map[char];
    });

  return DISEASE_CATEGORIES[normalized] || null;
}

/**
 * Calculate disease compatibility score (0-1)
 * Based on exact match, category match, or no match
 * @param {string} diseaseA - Disease of profile A
 * @param {string} diseaseB - Disease of profile B
 * @returns {number} - Score 0-1
 */
function scoreDiseaseCompatibility(diseaseA, diseaseB) {
  if (!diseaseA || !diseaseB) {
    return 0.1; // One or both diseases missing
  }

  const normalizedA = diseaseA.toLowerCase().trim();
  const normalizedB = diseaseB.toLowerCase().trim();

  // Exact match
  if (normalizedA === normalizedB) {
    return 1.0;
  }

  // Category match
  const categoryA = normalizeDiseaseToCategory(diseaseA);
  const categoryB = normalizeDiseaseToCategory(diseaseB);

  if (categoryA && categoryB && categoryA === categoryB) {
    return 0.7; // Similar category
  }

  // Both chronic but different categories
  if (categoryA && categoryB) {
    return 0.4;
  }

  return 0.1;
}

/**
 * Calculate phase compatibility score (0-1)
 * Using matrix from MATCHING.md
 * @param {string} phaseA - Care phase of profile A
 * @param {string} phaseB - Care phase of profile B
 * @returns {number} - Score 0-1
 */
function scorePhaseCompatibility(phaseA, phaseB) {
  if (!phaseA || !phaseB) {
    return 0.1;
  }

  const normalizedA = phaseA.toLowerCase().trim();
  const normalizedB = phaseB.toLowerCase().trim();

  if (!VALID_PHASES.has(normalizedA) || !VALID_PHASES.has(normalizedB)) {
    return 0.1;
  }

  // Same phase = perfect match
  if (normalizedA === normalizedB) {
    return 1.0;
  }

  // Compatibility matrix
  const matrix = {
    inicial: { intermedio: 0.6, avanzado: 0.3 },
    intermedio: { inicial: 0.6, avanzado: 0.6 },
    avanzado: { inicial: 0.3, intermedio: 0.6 },
  };

  return matrix[normalizedA][normalizedB] || 0.1;
}

/**
 * Calculate age compatibility score (0-1)
 * @param {number} ageA - Age of profile A
 * @param {number} ageB - Age of profile B
 * @returns {number} - Score 0-1
 */
function scoreAgeCompatibility(ageA, ageB) {
  if (typeof ageA !== 'number' || typeof ageB !== 'number') {
    return 0.1;
  }

  if (ageA < 18 || ageB < 18) {
    return 0.1;
  }

  const diff = Math.abs(ageA - ageB);

  if (diff <= 5) return 1.0;
  if (diff <= 10) return 0.85;
  if (diff <= 15) return 0.65;
  if (diff <= 20) return 0.4;
  return 0.2;
}

/**
 * Calculate geography compatibility score (0-1)
 * @param {string} locationA - Location of profile A (city/region)
 * @param {string} locationB - Location of profile B (city/region)
 * @returns {number} - Score 0-1
 */
function scoreGeographyCompatibility(locationA, locationB) {
  if (!locationA || !locationB || typeof locationA !== 'string' || typeof locationB !== 'string') {
    return 0.1;
  }

  const normalizedA = locationA.toLowerCase().trim();
  const normalizedB = locationB.toLowerCase().trim();

  // Same city/region
  if (normalizedA === normalizedB) {
    return 1.0;
  }

  // Different locations - lower score but not disqualifying
  // This is simplified; a real implementation would use geographic data
  return 0.5;
}

/**
 * Calculate availability compatibility score (0-1)
 * Based on overlapping hours in a week
 * @param {object} availabilityA - Availability object of profile A
 * @param {object} availabilityB - Availability object of profile B
 * @returns {number} - Score 0-1
 */
function scoreAvailabilityCompatibility(availabilityA, availabilityB) {
  if (!availabilityA || !availabilityB || typeof availabilityA !== 'object' || typeof availabilityB !== 'object') {
    return 0.1;
  }

  try {
    const overlapMinutes = calculateWeeklyOverlapMinutes(availabilityA, availabilityB);

    if (overlapMinutes >= 180) return 1.0; // 3+ hours
    if (overlapMinutes >= 120) return 0.85; // 2+ hours
    if (overlapMinutes >= 60) return 0.65; // 1+ hour
    if (overlapMinutes >= 30) return 0.4; // 30+ min
    if (overlapMinutes > 0) return 0.1;

    return 0.1; // No overlap
  } catch {
    return 0.1; // Invalid availability format
  }
}

/**
 * Calculate weekly overlap minutes between two availability objects
 * @param {object} availA - { "monday": ["09:00-12:00", "18:00-21:00"], ... }
 * @param {object} availB - Same format
 * @returns {number} - Total overlapping minutes
 */
function calculateWeeklyOverlapMinutes(availA, availB) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  let totalMinutes = 0;

  for (const day of days) {
    const slotsA = availA[day] || [];
    const slotsB = availB[day] || [];

    // Parse time slots and calculate overlaps
    for (const slotA of slotsA) {
      for (const slotB of slotsB) {
        const overlapMinutes = calculateTimeOverlap(slotA, slotB);
        totalMinutes += overlapMinutes;
      }
    }
  }

  return totalMinutes;
}

/**
 * Calculate overlap between two time slots
 * @param {string} slotA - "09:00-12:00" format
 * @param {string} slotB - "09:00-12:00" format
 * @returns {number} - Overlapping minutes
 */
function calculateTimeOverlap(slotA, slotB) {
  try {
    const [startA, endA] = slotA.split('-');
    const [startB, endB] = slotB.split('-');

    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const aStart = timeToMinutes(startA);
    const aEnd = timeToMinutes(endA);
    const bStart = timeToMinutes(startB);
    const bEnd = timeToMinutes(endB);

    if (aStart >= bEnd || bStart >= aEnd) {
      return 0; // No overlap
    }

    const overlapStart = Math.max(aStart, bStart);
    const overlapEnd = Math.min(aEnd, bEnd);

    return Math.max(0, overlapEnd - overlapStart);
  } catch {
    return 0;
  }
}

/**
 * Calculate language compatibility score (0-1)
 * @param {string} languageA - Language code of profile A
 * @param {string} languageB - Language code of profile B
 * @returns {number} - Score 0-1
 */
function scoreLanguageCompatibility(languageA, languageB) {
  if (!languageA || !languageB || typeof languageA !== 'string' || typeof languageB !== 'string') {
    return 0.0;
  }

  const normalizedA = languageA.toLowerCase().trim();
  const normalizedB = languageB.toLowerCase().trim();

  // Same language
  if (normalizedA === normalizedB) {
    return 1.0;
  }

  // Different languages
  if (VALID_LANGUAGES.has(normalizedA) && VALID_LANGUAGES.has(normalizedB)) {
    return 0.5; // Can communicate but with difficulty
  }

  return 0.0;
}

/**
 * Calculate overall compatibility score between two profiles
 * @param {object} profileA - Caregiver profile A
 * @param {object} profileB - Caregiver profile B
 * @returns {number} - Score 0-100
 */
function calculateCompatibilityScore(profileA, profileB) {
  if (!profileA || !profileB || typeof profileA !== 'object' || typeof profileB !== 'object') {
    throw new Error('Both profiles must be valid objects');
  }

  // Calculate individual factor scores (0-1 range)
  const diseaseScore = scoreDiseaseCompatibility(profileA.enfermedadPrincipal, profileB.enfermedadPrincipal);
  const phaseScore = scorePhaseCompatibility(profileA.faseCuidado, profileB.faseCuidado);
  const ageScore = scoreAgeCompatibility(profileA.edad, profileB.edad);
  const geographyScore = scoreGeographyCompatibility(profileA.ubicacion, profileB.ubicacion);
  const availabilityScore = scoreAvailabilityCompatibility(profileA.disponibilidadHoraria, profileB.disponibilidadHoraria);
  const languageScore = scoreLanguageCompatibility(profileA.idioma, profileB.idioma);

  // Apply weights
  const weights = {
    disease: 0.25,
    phase: 0.2,
    age: 0.15,
    geography: 0.2,
    availability: 0.15,
    language: 0.05,
  };

  const weightedScore = diseaseScore * weights.disease +
    phaseScore * weights.phase +
    ageScore * weights.age +
    geographyScore * weights.geography +
    availabilityScore * weights.availability +
    languageScore * weights.language;

  // Convert from 0-1 range to 0-100
  return Math.round(weightedScore * 100);
}

// Export for CommonJS
module.exports = {
  calculateCompatibilityScore,
  scoreDiseaseCompatibility,
  scorePhaseCompatibility,
  scoreAgeCompatibility,
  scoreGeographyCompatibility,
  scoreAvailabilityCompatibility,
  scoreLanguageCompatibility,
};
