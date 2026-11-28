const test = require('node:test');
const assert = require('node:assert/strict');

const { createAchievementsService } = require('../apps/api/src/achievements.cjs');
const { createCircleMemberService } = require('../apps/api/src/circle-members.cjs');
const { createCheckInEmotionalService } = require('../apps/api/src/check-ins.cjs');
const { createSessionService } = require('../apps/api/src/sessions.cjs');
const { createAttendanceService } = require('../apps/api/src/attendance.cjs');
const { createWellbeingDashboardService } = require('../apps/api/src/wellbeing-dashboard.cjs');

function createUserService(createdAt) {
  return {
    getUserById(id) {
      return id === 'user-1' ? { id, createdAt } : null;
    },
  };
}

test('calcula primer mes, apoyo a cinco cuidadores y respiro semanal', () => {
  const reference = new Date('2026-11-24T12:00:00.000Z');
  const memberService = createCircleMemberService();
  memberService.createMember({
    circleId: 'circle-1',
    usuarioId: 'user-1',
    estado: 'activo',
    fechaIngreso: '2026-09-01T12:00:00.000Z',
  });
  for (let index = 2; index <= 6; index += 1) {
    memberService.createMember({
      circleId: 'circle-1',
      usuarioId: `user-${index}`,
      estado: 'activo',
    });
  }

  const checkInService = createCheckInEmotionalService();
  const sessionService = createSessionService();
  const attendanceService = createAttendanceService({
    getSession: (id) => sessionService.getSession(id),
  });
  const wellbeing = createWellbeingDashboardService({
    checkInService,
    sessionService,
    attendanceService,
    memberService,
  });
  const achievements = createAchievementsService({
    userService: createUserService('2026-09-01T12:00:00.000Z'),
    memberService,
    wellbeingDashboardService: wellbeing,
    now: () => reference.getTime(),
  });

  achievements.recordRitualCompletion('user-1', {
    ritualId: 'respiracion',
    completedAt: '2026-11-24T10:00:00.000Z',
  });
  const result = achievements.getAchievements('user-1', {
    now: reference.toISOString(),
  });

  assert.equal(result.earnedCount, 3);
  assert.ok(result.badges.every((badge) => badge.earned));
});

test('devuelve progreso parcial y rechaza datos incompletos', () => {
  const memberService = createCircleMemberService();
  const achievements = createAchievementsService({
    userService: createUserService('2026-11-20T12:00:00.000Z'),
    memberService,
    wellbeingDashboardService: {
      getDashboard: () => ({ connections: { total: 2 } }),
    },
  });

  const result = achievements.getAchievements('user-1', {
    now: '2026-11-24T12:00:00.000Z',
  });
  const firstMonth = result.badges.find((badge) => badge.id === 'primer-mes-conectado');
  const support = result.badges.find((badge) => badge.id === 'apoyo-a-cinco-cuidadores');
  assert.equal(firstMonth.earned, false);
  assert.equal(support.progress, 2);

  assert.throws(
    () => achievements.recordRitualCompletion('user-1', {}),
    /identificador del ritual/
  );
});
