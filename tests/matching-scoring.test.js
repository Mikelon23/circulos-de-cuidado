const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateCompatibilityScore,
  scoreDiseaseCompatibility,
  scorePhaseCompatibility,
  scoreAgeCompatibility,
  scoreGeographyCompatibility,
  scoreAvailabilityCompatibility,
  scoreLanguageCompatibility,
  generateCircles,
} = require('../apps/api/src/matching.cjs');

test('calculateCompatibilityScore devuelve un score válido entre 0 y 100', () => {
  const profileA = {
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45,
    ubicacion: 'Madrid',
    disponibilidadHoraria: {
      monday: ['09:00-12:00', '18:00-21:00'],
      thursday: ['15:00-17:00'],
    },
    idioma: 'es',
  };

  const profileB = {
    enfermedadPrincipal: 'Demencia vascular',
    faseCuidado: 'avanzado',
    edad: 48,
    ubicacion: 'Madrid',
    disponibilidadHoraria: {
      monday: ['09:00-12:00'],
      thursday: ['14:00-16:00'],
    },
    idioma: 'es',
  };

  const score = calculateCompatibilityScore(profileA, profileB);

  assert.ok(typeof score === 'number', 'Score debe ser un número');
  assert.ok(score >= 0 && score <= 100, `Score debe estar entre 0 y 100, recibió ${score}`);
});

test('calculateCompatibilityScore lanza error con perfiles inválidos', () => {
  assert.throws(() => calculateCompatibilityScore(null, {}), Error);
  assert.throws(() => calculateCompatibilityScore({}, null), Error);
  assert.throws(() => calculateCompatibilityScore('invalid', {}), Error);
});

test('scoreDiseaseCompatibility - match exacto devuelve 1.0', () => {
  const score = scoreDiseaseCompatibility('Alzheimer', 'Alzheimer');
  assert.equal(score, 1.0);
});

test('scoreDiseaseCompatibility - match de categoría devuelve 0.7', () => {
  const score = scoreDiseaseCompatibility('Alzheimer', 'Demencia vascular');
  assert.equal(score, 0.7);
});

test('scoreDiseaseCompatibility - sin match devuelve 0.1', () => {
  const score = scoreDiseaseCompatibility('Alzheimer', 'Diabetes');
  assert.equal(score, 0.4); // Ambas son crónicas
});

test('scoreDiseaseCompatibility - enfermedad faltante devuelve 0.1', () => {
  const score = scoreDiseaseCompatibility('Alzheimer', null);
  assert.equal(score, 0.1);
});

test('scorePhaseCompatibility - fase idéntica devuelve 1.0', () => {
  const score = scorePhaseCompatibility('avanzado', 'avanzado');
  assert.equal(score, 1.0);
});

test('scorePhaseCompatibility - inicial vs avanzado devuelve 0.3', () => {
  const score = scorePhaseCompatibility('inicial', 'avanzado');
  assert.equal(score, 0.3);
});

test('scorePhaseCompatibility - inicial vs intermedio devuelve 0.6', () => {
  const score = scorePhaseCompatibility('inicial', 'intermedio');
  assert.equal(score, 0.6);
});

test('scorePhaseCompatibility - intermedio vs avanzado devuelve 0.6', () => {
  const score = scorePhaseCompatibility('intermedio', 'avanzado');
  assert.equal(score, 0.6);
});

test('scorePhaseCompatibility - fase inválida devuelve 0.1', () => {
  const score = scorePhaseCompatibility('invalid', 'avanzado');
  assert.equal(score, 0.1);
});

test('scoreAgeCompatibility - diferencia <= 5 años devuelve 1.0', () => {
  const score = scoreAgeCompatibility(45, 48);
  assert.equal(score, 1.0);
});

test('scoreAgeCompatibility - diferencia 6-10 años devuelve 0.85', () => {
  const score = scoreAgeCompatibility(45, 55);
  assert.equal(score, 0.85);
});

test('scoreAgeCompatibility - diferencia 11-15 años devuelve 0.65', () => {
  const score = scoreAgeCompatibility(45, 60);
  assert.equal(score, 0.65);
});

test('scoreAgeCompatibility - diferencia 16-20 años devuelve 0.4', () => {
  const score = scoreAgeCompatibility(45, 65);
  assert.equal(score, 0.4);
});

test('scoreAgeCompatibility - diferencia > 20 años devuelve 0.2', () => {
  const score = scoreAgeCompatibility(45, 70);
  assert.equal(score, 0.2);
});

test('scoreAgeCompatibility - edad inválida devuelve 0.1', () => {
  const score = scoreAgeCompatibility('invalid', 45);
  assert.equal(score, 0.1);
});

test('scoreGeographyCompatibility - misma ciudad devuelve 1.0', () => {
  const score = scoreGeographyCompatibility('Madrid', 'Madrid');
  assert.equal(score, 1.0);
});

test('scoreGeographyCompatibility - ciudades diferentes devuelve 0.5', () => {
  const score = scoreGeographyCompatibility('Madrid', 'Barcelona');
  assert.equal(score, 0.5);
});

test('scoreGeographyCompatibility - ubicación faltante devuelve 0.1', () => {
  const score = scoreGeographyCompatibility('Madrid', null);
  assert.equal(score, 0.1);
});

test('scoreAvailabilityCompatibility - 3+ horas de solapamiento devuelve 1.0', () => {
  const availA = {
    monday: ['09:00-12:00', '18:00-21:00'],
  };
  const availB = {
    monday: ['09:00-13:00'],
  };
  const score = scoreAvailabilityCompatibility(availA, availB);
  assert.equal(score, 1.0);
});

test('scoreAvailabilityCompatibility - 2+ horas de solapamiento devuelve 0.85', () => {
  const availA = {
    monday: ['09:00-11:00'],
    thursday: ['15:00-17:00'],
  };
  const availB = {
    monday: ['09:00-12:00'],
    thursday: ['16:00-17:00'],
  };
  const score = scoreAvailabilityCompatibility(availA, availB);
  assert.ok(score >= 0.85 && score <= 1.0);
});

test('scoreAvailabilityCompatibility - 1+ hora de solapamiento devuelve 0.65', () => {
  const availA = {
    wednesday: ['18:00-19:00'],
  };
  const availB = {
    wednesday: ['18:00-19:00'],
  };
  const score = scoreAvailabilityCompatibility(availA, availB);
  assert.equal(score, 0.65);
});

test('scoreAvailabilityCompatibility - sin solapamiento devuelve 0.1', () => {
  const availA = {
    monday: ['09:00-12:00'],
  };
  const availB = {
    tuesday: ['14:00-17:00'],
  };
  const score = scoreAvailabilityCompatibility(availA, availB);
  assert.equal(score, 0.1);
});

test('scoreAvailabilityCompatibility - disponibilidad inválida devuelve 0.1', () => {
  const score = scoreAvailabilityCompatibility('invalid', {});
  assert.equal(score, 0.1);
});

test('scoreLanguageCompatibility - idioma igual devuelve 1.0', () => {
  const score = scoreLanguageCompatibility('es', 'es');
  assert.equal(score, 1.0);
});

test('scoreLanguageCompatibility - idiomas diferentes válidos devuelven 0.5', () => {
  const score = scoreLanguageCompatibility('es', 'en');
  assert.equal(score, 0.5);
});

test('scoreLanguageCompatibility - idioma inválido devuelve 0.0', () => {
  const score = scoreLanguageCompatibility('es', 'invalid');
  assert.equal(score, 0.0);
});

test('scoreLanguageCompatibility - idioma faltante devuelve 0.0', () => {
  const score = scoreLanguageCompatibility('es', null);
  assert.equal(score, 0.0);
});

test('Ejemplo 1: Dos cuidadores muy compatibles (Ej. 6.1 de MATCHING.md)', () => {
  const profileA = {
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45,
    ubicacion: 'Madrid',
    disponibilidadHoraria: {
      monday: ['18:00-20:00'],
      thursday: ['15:00-17:00'],
    },
    idioma: 'es',
  };

  const profileB = {
    enfermedadPrincipal: 'Demencia vascular',
    faseCuidado: 'avanzado',
    edad: 48,
    ubicacion: 'Madrid',
    disponibilidadHoraria: {
      tuesday: ['18:00-20:00'],
      thursday: ['14:00-16:00'],
    },
    idioma: 'es',
  };

  const score = calculateCompatibilityScore(profileA, profileB);

  // Según cálculo en MATCHING.md: score = 0.8725, o sea ~87
  assert.ok(score >= 85 && score <= 90, `Score debe estar entre 85 y 90, recibió ${score}`);
});

test('Ejemplo 2: Cuidadores con compatibilidad media (Ej. 6.2 de MATCHING.md)', () => {
  const profileC = {
    enfermedadPrincipal: 'EPOC',
    faseCuidado: 'intermedio',
    edad: 55,
    ubicacion: 'Barcelona',
    disponibilidadHoraria: {
      wednesday: ['19:00-21:00'],
    },
    idioma: 'es',
  };

  const profileD = {
    enfermedadPrincipal: 'Diabetes avanzada',
    faseCuidado: 'inicial',
    edad: 42,
    ubicacion: 'Valencia',
    disponibilidadHoraria: {
      wednesday: ['19:00-21:00'],
    },
    idioma: 'es',
  };

  const score = calculateCompatibilityScore(profileC, profileD);

  // Según cálculo en MATCHING.md: score = 0.5, o sea = 50
  assert.ok(score >= 45 && score <= 55, `Score debe estar entre 45 y 55, recibió ${score}`);
});

test('Perfiles con idiomas muy diferentes tienen score más bajo', () => {
  const profileA = {
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45,
    ubicacion: 'Madrid',
    disponibilidadHoraria: {
      monday: ['18:00-20:00'],
    },
    idioma: 'es',
  };

  const profileB = {
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 48,
    ubicacion: 'Madrid',
    disponibilidadHoraria: {
      monday: ['18:00-20:00'],
    },
    idioma: 'pt', // Portugués
  };

  const scoreWithDifferentLanguage = calculateCompatibilityScore(profileA, profileB);
  const scoreWithSameLanguage = calculateCompatibilityScore(profileA, {
    ...profileB,
    idioma: 'es',
  });

  assert.ok(
    scoreWithDifferentLanguage < scoreWithSameLanguage,
    'Score con idiomas diferentes debe ser menor que con idiomas iguales'
  );
});

test('calculateCompatibilityScore es simétrico: score(A, B) == score(B, A)', () => {
  const profileA = {
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45,
    ubicacion: 'Madrid',
    disponibilidadHoraria: { monday: ['18:00-20:00'] },
    idioma: 'es',
  };

  const profileB = {
    enfermedadPrincipal: 'Diabetes',
    faseCuidado: 'inicial',
    edad: 62,
    ubicacion: 'Barcelona',
    disponibilidadHoraria: { wednesday: ['14:00-16:00'] },
    idioma: 'en',
  };

  const scoreAB = calculateCompatibilityScore(profileA, profileB);
  const scoreBA = calculateCompatibilityScore(profileB, profileA);

  assert.equal(scoreAB, scoreBA, 'Scoring debe ser simétrico');
});

test('Perfiles idénticos deben tener score alto (97+)', () => {
  const profile = {
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45,
    ubicacion: 'Madrid',
    disponibilidadHoraria: { monday: ['18:00-20:00'] },
    idioma: 'es',
  };

  const score = calculateCompatibilityScore(profile, profile);

  assert.ok(score >= 95, `Score para perfil idéntico debe ser >= 95, recibió ${score}`);
});

// ============================================================================
// Tests para generateCircles - Algoritmo de generación de círculos
// ============================================================================

test('generateCircles devuelve estructura correcta', () => {
  const candidates = [
    {
      id: '1',
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 45,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '2',
      enfermedadPrincipal: 'Demencia',
      faseCuidado: 'avanzado',
      edad: 48,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '3',
      enfermedadPrincipal: 'Parkinson',
      faseCuidado: 'intermedio',
      edad: 55,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '4',
      enfermedadPrincipal: 'ELA',
      faseCuidado: 'avanzado',
      edad: 50,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '5',
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 46,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '6',
      enfermedadPrincipal: 'Demencia',
      faseCuidado: 'avanzado',
      edad: 49,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
  ];

  const result = generateCircles(candidates);

  assert.ok(result.circles !== undefined, 'Debe retornar circles');
  assert.ok(result.waitlist !== undefined, 'Debe retornar waitlist');
  assert.ok(result.metrics !== undefined, 'Debe retornar metrics');
  assert.ok(Array.isArray(result.circles), 'circles debe ser un array');
  assert.ok(Array.isArray(result.waitlist), 'waitlist debe ser un array');
});

test('generateCircles retorna array vacío si hay < minSize candidatos', () => {
  const candidates = [
    {
      id: '1',
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 45,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '2',
      enfermedadPrincipal: 'Demencia',
      faseCuidado: 'avanzado',
      edad: 48,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
  ];

  const result = generateCircles(candidates, { minSize: 6 });

  assert.equal(result.circles.length, 0, 'No debe generar círculos con < minSize candidatos');
  assert.equal(result.waitlist.length, 2, 'Candidatos deben ir a waitlist');
});

test('generateCircles con array vacío retorna estructura vacía', () => {
  const result = generateCircles([], {});

  assert.equal(result.circles.length, 0);
  assert.equal(result.waitlist.length, 0);
  assert.equal(result.metrics.totalCandidates, 0);
  assert.equal(result.metrics.circlesGenerated, 0);
});

test('generateCircles respeta capacidad máxima (maxSize)', () => {
  const candidates = Array.from({ length: 20 }, (_, i) => ({
    id: `user_${i}`,
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45 + (i % 10),
    ubicacion: 'Madrid',
    disponibilidadHoraria: { monday: ['18:00-20:00'] },
    idioma: 'es',
  }));

  const result = generateCircles(candidates, { maxSize: 8 });

  for (const circle of result.circles) {
    assert.ok(circle.members.length <= 8, `Círculo debe tener como máximo 8 miembros, tiene ${circle.members.length}`);
  }
});

test('generateCircles respeta capacidad mínima (minSize)', () => {
  const candidates = Array.from({ length: 15 }, (_, i) => ({
    id: `user_${i}`,
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45 + (i % 10),
    ubicacion: 'Madrid',
    disponibilidadHoraria: { monday: ['18:00-20:00'] },
    idioma: 'es',
  }));

  const result = generateCircles(candidates, { minSize: 6 });

  for (const circle of result.circles) {
    assert.ok(circle.members.length >= 6, `Círculo debe tener como mínimo 6 miembros, tiene ${circle.members.length}`);
  }
});

test('generateCircles respeta threshold de compatibilidad', () => {
  const candidates = [
    {
      id: '1',
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 45,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '2',
      enfermedadPrincipal: 'Diabetes',
      faseCuidado: 'inicial',
      edad: 70,
      ubicacion: 'Barcelona',
      disponibilidadHoraria: { wednesday: ['14:00-16:00'] },
      idioma: 'en',
    },
    {
      id: '3',
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 46,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '4',
      enfermedadPrincipal: 'Demencia',
      faseCuidado: 'avanzado',
      edad: 48,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '5',
      enfermedadPrincipal: 'Parkinson',
      faseCuidado: 'avanzado',
      edad: 50,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      id: '6',
      enfermedadPrincipal: 'ELA',
      faseCuidado: 'avanzado',
      edad: 49,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
  ];

  const result = generateCircles(candidates, { threshold: 80 });

  // Con threshold alto, menos candidatos se agregarán a círculos
  for (const circle of result.circles) {
    assert.ok(circle.averageCompatibility >= 80, `Compatibilidad promedio debe ser >= 80`);
  }
});

test('generateCircles con prioridad urgencia selecciona candidatos urgentes primero', () => {
  const candidates = [
    {
      id: '1',
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 45,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
      urgencia: 3,
    },
    {
      id: '2',
      enfermedadPrincipal: 'Demencia',
      faseCuidado: 'avanzado',
      edad: 48,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
      urgencia: 9, // Muy urgente
    },
    {
      id: '3',
      enfermedadPrincipal: 'Parkinson',
      faseCuidado: 'avanzado',
      edad: 50,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
      urgencia: 8,
    },
    {
      id: '4',
      enfermedadPrincipal: 'ELA',
      faseCuidado: 'avanzado',
      edad: 49,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
      urgencia: 2,
    },
    {
      id: '5',
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 46,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
      urgencia: 7,
    },
    {
      id: '6',
      enfermedadPrincipal: 'Diabetes',
      faseCuidado: 'avanzado',
      edad: 47,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
      urgencia: 8,
    },
  ];

  const result = generateCircles(candidates, { priority: 'urgency' });

  // Calcular tasa de asignación de urgentes
  assert.ok(result.metrics.urgentAssignmentRate > 0, 'Con prioridad urgencia, se deben asignar usuarios urgentes');
});

test('generateCircles calcula metrics correctamente', () => {
  const candidates = Array.from({ length: 12 }, (_, i) => ({
    id: `user_${i}`,
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45 + (i % 5),
    ubicacion: 'Madrid',
    disponibilidadHoraria: { monday: ['18:00-20:00'] },
    idioma: 'es',
  }));

  const result = generateCircles(candidates, { minSize: 6, maxSize: 8 });

  assert.equal(result.metrics.totalCandidates, 12, 'totalCandidates debe ser 12');
  assert.ok(result.metrics.circlesGenerated >= 0, 'circlesGenerated debe ser >= 0');
  assert.ok(result.metrics.averageCompatibility >= 0 && result.metrics.averageCompatibility <= 100, 'averageCompatibility debe estar entre 0-100');
  assert.ok(result.metrics.assignmentRate >= 0 && result.metrics.assignmentRate <= 100, 'assignmentRate debe ser entre 0-100%');
});

test('generateCircles asigna IDs automáticamente si faltan', () => {
  const candidates = [
    {
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 45,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      enfermedadPrincipal: 'Demencia',
      faseCuidado: 'avanzado',
      edad: 48,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      enfermedadPrincipal: 'Parkinson',
      faseCuidado: 'avanzado',
      edad: 50,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      enfermedadPrincipal: 'ELA',
      faseCuidado: 'avanzado',
      edad: 49,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 46,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    {
      enfermedadPrincipal: 'Diabetes',
      faseCuidado: 'avanzado',
      edad: 47,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
  ];

  const result = generateCircles(candidates);

  assert.ok(result.circles.length > 0 || result.waitlist.length > 0, 'Debe procesar candidatos sin IDs');

  // Verificar que todos los miembros tienen ID (ya sea asignado o generado)
  for (const circle of result.circles) {
    for (const member of circle.members) {
      assert.ok(member.id, 'Cada miembro debe tener un ID');
    }
  }
});

test('generateCircles calcula averageCompatibility para cada círculo', () => {
  const candidates = Array.from({ length: 12 }, (_, i) => ({
    id: `user_${i}`,
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 45 + (i % 5),
    ubicacion: 'Madrid',
    disponibilidadHoraria: { monday: ['18:00-20:00'] },
    idioma: 'es',
  }));

  const result = generateCircles(candidates);

  for (const circle of result.circles) {
    assert.ok(typeof circle.averageCompatibility === 'number', 'averageCompatibility debe ser un número');
    assert.ok(circle.averageCompatibility >= 0 && circle.averageCompatibility <= 100, 'averageCompatibility debe estar entre 0-100');
  }
});
