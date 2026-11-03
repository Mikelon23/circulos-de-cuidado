const test = require('node:test');
const assert = require('node:assert/strict');

const { createCircleService } = require('../apps/api/src/circles.cjs');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');
const { createCircleSuggestionService } = require('../apps/api/src/circle-suggestions.cjs');
const { createCircleWorkflowService } = require('../apps/api/src/circle-workflow.cjs');
const { createWaitingQueueService } = require('../apps/api/src/waiting-queue.cjs');
const { generateCircles } = require('../apps/api/src/matching.cjs');

function createCandidates(count = 6) {
  return Array.from({ length: count }, (_, index) => ({
    id: `caregiver-${index + 1}`,
    enfermedadPrincipal: 'Alzheimer',
    faseCuidado: 'avanzado',
    edad: 40 + index,
    ubicacion: 'Madrid',
    disponibilidadHoraria: { monday: ['18:00-20:00'] },
    idioma: 'es',
    urgencia: 5,
  }));
}

function createHarness(options = {}) {
  const circleService = createCircleService();
  const memberService = createCircleMemberService();
  const suggestionService = options.suggestionService || createCircleSuggestionService();
  const waitingQueueService = createWaitingQueueService();
  const workflow = createCircleWorkflowService({
    generateCircles,
    circleService,
    memberService,
    suggestionService,
    waitingQueueService,
  });

  return { workflow, circleService, memberService, suggestionService, waitingQueueService };
}

test('createCirclesFromMatching crea círculos, miembros invitados e invitaciones relacionadas', () => {
  const { workflow, circleService, memberService, suggestionService } = createHarness();
  const result = workflow.createCirclesFromMatching(createCandidates());

  assert.equal(result.circles.length, 1);
  assert.equal(result.circles[0].members.length, 6);
  assert.equal(result.circles[0].invitations.length, 6);
  assert.equal(result.waitlist.length, 0);
  assert.equal(circleService.listCircles().length, 1);
  assert.ok(memberService.listMembers().every((member) => member.estado === 'invitado'));

  const invitation = result.circles[0].invitations[0];
  const listed = workflow.listInvitationsForCaregiver(invitation.cuidadorId);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].circle.id, result.circles[0].id);
  assert.equal(listed[0].member.id, invitation.metadata.memberId);
  assert.equal(listed[0].estado, 'sent');
  assert.equal('score' in listed[0], false);
  assert.doesNotMatch(listed[0].mensaje, /\d+%/);
  assert.equal(suggestionService.listSuggestions({ tipo: 'circle_offer' }).length, 6);
});

test('respondToInvitation confirma/rechaza y actualiza la cola de espera', () => {
  const { workflow, memberService, suggestionService, waitingQueueService } = createHarness();
  const candidates = createCandidates();
  const queueEntryIds = Object.fromEntries(
    candidates.map((candidate) => [
      candidate.id,
      waitingQueueService.addToQueue({
        cuidadorId: candidate.id,
        perfilCuidador: candidate,
        urgencia: candidate.urgencia,
      }).id,
    ])
  );
  waitingQueueService.markAsOffered(Object.values(queueEntryIds));

  const result = workflow.createCirclesFromMatching(candidates, { queueEntryIds });
  const acceptedMember = result.circles[0].members[0];
  const rejectedMember = result.circles[0].members[1];

  const accepted = workflow.respondToInvitation(
    acceptedMember.id,
    acceptedMember.usuarioId,
    'accepted'
  );
  assert.equal(accepted.member.estado, 'activo');
  assert.ok(accepted.member.fechaIngreso);
  assert.equal(accepted.invitation.estado, 'accepted');
  assert.equal('score' in accepted.invitation, false);
  assert.equal(
    waitingQueueService.getQueueEntry(queueEntryIds[acceptedMember.usuarioId]).estado,
    'accepted'
  );

  const rejected = workflow.respondToInvitation(
    rejectedMember.id,
    rejectedMember.usuarioId,
    'rejected'
  );
  assert.equal(rejected.member.estado, 'salido');
  assert.ok(rejected.member.fechaSalida);
  assert.equal(rejected.invitation.estado, 'dismissed');
  assert.equal(
    waitingQueueService.getQueueEntry(queueEntryIds[rejectedMember.usuarioId]).estado,
    'rejected'
  );
  assert.equal(suggestionService.listSuggestions({ tipo: 'circle_offer' }).length, 6);
});

test('respondToInvitation impide responder por otro cuidador o confirmar dos veces', () => {
  const { workflow } = createHarness();
  const result = workflow.createCirclesFromMatching(createCandidates());
  const member = result.circles[0].members[0];

  assert.throws(
    () => workflow.respondToInvitation(member.id, 'otro-cuidador', 'accepted'),
    /no pertenece/
  );
  workflow.respondToInvitation(member.id, member.usuarioId, 'accepted');
  assert.throws(
    () => workflow.respondToInvitation(member.id, member.usuarioId, 'rejected'),
    /ya fue respondida/
  );
});

test('createCirclesFromMatching valida candidatos duplicados antes de crear registros', () => {
  const { workflow, circleService, memberService } = createHarness();
  const candidates = createCandidates();
  candidates[1].id = candidates[0].id;

  assert.throws(() => workflow.createCirclesFromMatching(candidates), /más de una vez/);
  assert.equal(circleService.listCircles().length, 0);
  assert.equal(memberService.listMembers().length, 0);
});

test('createCirclesFromMatching revierte registros si falla al crear invitaciones', () => {
  const suggestionService = createCircleSuggestionService();
  let createdCount = 0;
  const failingSuggestionService = {
    ...suggestionService,
    generateForCaregiver(...args) {
      createdCount += 1;
      if (createdCount === 2) {
        throw new Error('Fallo de prueba al crear invitación');
      }
      return suggestionService.generateForCaregiver(...args);
    },
    deleteSuggestion: (id) => suggestionService.deleteSuggestion(id),
  };
  const { workflow, circleService, memberService } = createHarness({
    suggestionService: failingSuggestionService,
  });

  assert.throws(
    () => workflow.createCirclesFromMatching(createCandidates()),
    /Fallo de prueba al crear invitación/
  );
  assert.equal(circleService.listCircles().length, 0);
  assert.equal(memberService.listMembers().length, 0);
  assert.equal(suggestionService.listSuggestions().length, 0);
});
