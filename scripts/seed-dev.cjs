const { createUserService } = require('../apps/api/src/users.cjs');
const { createCaregiverProfileService } = require('../apps/api/src/caregiver-profiles.cjs');
const { createCircleService } = require('../apps/api/src/circles.cjs');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');
const { createFacilitatorService } = require('../apps/api/src/facilitators.cjs');
const { createCheckInEmotionalService } = require('../apps/api/src/check-ins.cjs');

function createBasePayload(index) {
  const nombre = `Usuario ${index + 1}`;
  const email = `usuario${index + 1}@circulos.dev`;

  return {
    email,
    password: `SeedPass${index + 1}!`,
    nombreReal: nombre,
    nombreVisible: nombre,
    rol: index < 3 ? 'facilitador' : index === 3 ? 'admin' : 'cuidador',
    emailVerified: true,
    anonimo: index % 4 === 0,
  };
}

function createProfilePayload(user, index) {
  return {
    usuarioId: user.id,
    edad: 55 + (index % 10),
    enfermedadPrincipal: index % 2 === 0 ? 'Cuidado de la memoria' : 'Ansiedad',
    faseCuidado: index % 3 === 0 ? 'intermedio' : 'inicial',
    disponibilidadHoraria: {
      lunes: ['09:00-11:00', '16:00-18:00'],
      viernes: ['10:00-12:00'],
    },
    idioma: 'es',
    ubicacion: index % 2 === 0 ? 'Madrid' : 'Valencia',
    urgencia: 3 + (index % 5),
    notas: 'Perfil generado por el seed de desarrollo.',
  };
}

function createFacilitatorPayload(user, index) {
  return {
    usuarioId: user.id,
    experienciaYears: 4 + index,
    especialidades: ['Acompañamiento', 'Escucha activa', 'Gestión del cuidado'],
    certificaciones: ['Curso de facilitación comunitaria'],
    disponibilidad: {
      lunes: ['10:00-12:00'],
      miercoles: ['18:00-20:00'],
    },
    calificacionPromedio: 4.5 + (index * 0.1),
    activo: true,
  };
}

function createCirclePayload(index, facilitadorId) {
  return {
    nombre: `Círculo ${index + 1}`,
    tema: ['Cuidado compartido', 'Bienestar emocional', 'Respiro y acompañamiento'][index % 3],
    descripcion: `Grupo de apoyo generado para el seed de desarrollo ${index + 1}.`,
    facilitadorId,
    capacidadMinima: 4,
    capacidadMaxima: 8,
    estado: 'activo',
  };
}

function createMemberPayload(circleId, usuarioId, role, state) {
  return {
    circleId,
    usuarioId,
    rol: role,
    estado: state,
    fechaIngreso: '2026-01-01T00:00:00.000Z',
  };
}

function createCheckInPayload(user, index) {
  const questions = [
    '¿Cómo te sentiste hoy?',
    '¿Qué te ha dado energía hoy?',
    '¿Qué te ha pesado hoy?',
  ];

  return {
    usuarioId: user.id,
    pregunta: questions[index % questions.length],
    escala: 3 + ((index + user.id.length) % 8),
    nota: index % 2 === 0 ? 'Nota generada automáticamente.' : null,
    respondidoEn: new Date(Date.now() - index * 60_000).toISOString(),
  };
}

function seedDevelopmentData() {
  const userService = createUserService();
  const profileService = createCaregiverProfileService();
  const circleService = createCircleService();
  const memberService = createCircleMemberService();
  const facilitatorService = createFacilitatorService();
  const checkInService = createCheckInEmotionalService();

  const usersCreated = [];
  const profilesCreated = [];
  const facilitatorsCreated = [];
  const circlesCreated = [];
  const membersCreated = [];
  const checkInsCreated = [];

  for (let index = 0; index < 20; index += 1) {
    const createdUser = userService.registerUser(createBasePayload(index));
    usersCreated.push(createdUser);

    if (index < 10) {
      profilesCreated.push(profileService.createProfile(createProfilePayload(createdUser, index)));
    }
  }

  for (let index = 0; index < 3; index += 1) {
    const facilitator = facilitatorService.createFacilitator(createFacilitatorPayload(usersCreated[index], index));
    facilitatorsCreated.push(facilitator);
  }

  for (let index = 0; index < 5; index += 1) {
    const facilitator = facilitatorsCreated[index % facilitatorsCreated.length];
    const createdCircle = circleService.createCircle(createCirclePayload(index, facilitator.id));
    circlesCreated.push(createdCircle);

    const participants = usersCreated.slice(3 + index, 3 + index + 6);
    participants.forEach((participant, participantIndex) => {
      const role = participantIndex === 0 ? 'admin' : 'participante';
      const state = participantIndex === 0 ? 'activo' : 'activo';
      membersCreated.push(memberService.createMember(createMemberPayload(createdCircle.id, participant.id, role, state)));
    });
  }

  for (let index = 0; index < 50; index += 1) {
    const user = usersCreated[index % usersCreated.length];
    checkInsCreated.push(checkInService.createCheckIn(createCheckInPayload(user, index)));
  }

  return {
    users: usersCreated.length,
    facilitators: facilitatorsCreated.length,
    circles: circlesCreated.length,
    checkIns: checkInsCreated.length,
    usersCreated,
    profilesCreated,
    facilitatorsCreated,
    circlesCreated,
    membersCreated,
    checkInsCreated,
  };
}

if (require.main === module) {
  const result = seedDevelopmentData();
  console.log(`Seed completado: ${result.users} usuarios, ${result.facilitators} facilitadores, ${result.circles} círculos y ${result.checkIns} check-ins.`);
}

module.exports = {
  seedDevelopmentData,
};
