const crypto = require('node:crypto');

const BADGE_DEFINITIONS = [
  {
    id: 'primer-mes-conectado',
    title: 'Primer mes conectado',
    description: 'Has mantenido tu participación durante al menos un mes.',
    target: 30,
  },
  {
    id: 'apoyo-a-cinco-cuidadores',
    title: 'Apoyo a 5 cuidadores',
    description: 'Has formado conexiones con al menos cinco cuidadores.',
    target: 5,
  },
  {
    id: 'respiro-semanal',
    title: 'Respiro semanal',
    description: 'Has completado un ritual de respiro en la ultima semana.',
    target: 1,
  },
];

function createAchievementsService({
  userService,
  memberService,
  wellbeingDashboardService,
  now = () => Date.now(),
} = {}) {
  if (!userService || typeof userService.getUserById !== 'function') {
    throw new Error('Se requiere un servicio de usuarios valido');
  }
  if (!memberService || typeof memberService.listMembers !== 'function') {
    throw new Error('Se requiere un servicio de miembros valido');
  }
  if (!wellbeingDashboardService || typeof wellbeingDashboardService.getDashboard !== 'function') {
    throw new Error('Se requiere un servicio de bienestar valido');
  }

  const ritualCompletions = new Map();

  function recordRitualCompletion(userId, payload = {}) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) {
      throw new Error('El identificador del usuario es obligatorio');
    }
    const ritualId = String(payload.ritualId || '').trim();
    if (!ritualId) {
      throw new Error('El identificador del ritual es obligatorio');
    }
    const completion = {
      id: crypto.randomUUID(),
      userId: normalizedUserId,
      ritualId,
      completedAt: payload.completedAt
        ? new Date(payload.completedAt)
        : new Date(now()),
    };
    if (Number.isNaN(completion.completedAt.getTime())) {
      throw new Error('La fecha de finalizacion no es valida');
    }
    completion.completedAt = completion.completedAt.toISOString();
    const completions = ritualCompletions.get(normalizedUserId) || [];
    completions.push(completion);
    ritualCompletions.set(normalizedUserId, completions);
    return { ...completion };
  }

  function getAchievements(userId, options = {}) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) {
      throw new Error('El identificador del usuario es obligatorio');
    }

    const reference = new Date(options.now ? options.now : now());
    if (Number.isNaN(reference.getTime())) {
      throw new Error('La fecha de referencia no es valida');
    }

    const user = userService.getUserById(normalizedUserId);
    const memberships = memberService
      .listMembers()
      .filter((member) => member.usuarioId === normalizedUserId);
    const oldestMembership = memberships
      .map((member) => new Date(member.fechaIngreso || member.createdAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b)[0];
    const accountDate = user?.createdAt ? new Date(user.createdAt) : null;
    const startDate =
      oldestMembership ||
      (accountDate && !Number.isNaN(accountDate.getTime()) ? accountDate : null);
    const connectedDays = startDate
      ? Math.max(0, Math.floor((reference - startDate) / 86400000))
      : 0;

    const wellbeing = wellbeingDashboardService.getDashboard(normalizedUserId, {
      period: 'all',
      now: reference.toISOString(),
    });
    const connectionCount = wellbeing.connections.total;

    const weekStart = new Date(reference);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weeklyCompletions = (ritualCompletions.get(normalizedUserId) || []).filter(
      (completion) => {
        const date = new Date(completion.completedAt);
        return date >= weekStart && date <= reference;
      }
    );

    const progress = {
      'primer-mes-conectado': connectedDays,
      'apoyo-a-cinco-cuidadores': connectionCount,
      'respiro-semanal': weeklyCompletions.length,
    };

    const badges = BADGE_DEFINITIONS.map((badge) => {
      const current = Math.min(progress[badge.id], badge.target);
      return {
        id: badge.id,
        title: badge.title,
        description: badge.description,
        target: badge.target,
        progress: current,
        percentage: Math.round((current / badge.target) * 100),
        earned: current >= badge.target,
      };
    });

    return {
      badges,
      earnedCount: badges.filter((badge) => badge.earned).length,
    };
  }

  return {
    recordRitualCompletion,
    getAchievements,
  };
}

module.exports = {
  createAchievementsService,
  BADGE_DEFINITIONS,
};
