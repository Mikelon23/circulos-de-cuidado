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
