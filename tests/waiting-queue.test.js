const test = require('node:test');
const assert = require('node:assert/strict');
const { createWaitingQueueService } = require('../apps/api/src/waiting-queue.cjs');

test('createWaitingQueueService retorna un servicio válido', () => {
  const service = createWaitingQueueService();
  
  assert.ok(service.addToQueue);
  assert.ok(service.getQueueEntry);
  assert.ok(service.listQueue);
  assert.ok(service.updateQueueEntry);
  assert.ok(service.removeFromQueue);
  assert.ok(service.getQueueStats);
  assert.ok(service.getNextCandidatesForMatching);
  assert.ok(service.markAsOffered);
  assert.ok(service.clearQueue);
});

test('addToQueue agrega un cuidador a la cola', () => {
  const service = createWaitingQueueService();
  
  const entry = service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {
      enfermedadPrincipal: 'Alzheimer',
      faseCuidado: 'avanzado',
      edad: 45,
      ubicacion: 'Madrid',
      disponibilidadHoraria: { monday: ['18:00-20:00'] },
      idioma: 'es',
    },
    urgencia: 8,
  });

  assert.ok(entry.id);
  assert.equal(entry.cuidadorId, 'user_1');
  assert.equal(entry.urgencia, 8);
  assert.equal(entry.estado, 'waiting');
  assert.ok(entry.fechaAgregado);
});

test('addToQueue lanza error si falta cuidadorId', () => {
  const service = createWaitingQueueService();
  
  assert.throws(() => {
    service.addToQueue({
      perfilCuidador: {},
      urgencia: 5,
    });
  }, Error);
});

test('addToQueue lanza error si urgencia no está entre 1-10', () => {
  const service = createWaitingQueueService();
  
  assert.throws(() => {
    service.addToQueue({
      cuidadorId: 'user_1',
      perfilCuidador: {},
      urgencia: 15,
    });
  }, Error);
});

test('addToQueue lanza error si el cuidador ya está en la cola', () => {
  const service = createWaitingQueueService();
  
  service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  assert.throws(() => {
    service.addToQueue({
      cuidadorId: 'user_1',
      perfilCuidador: {},
      urgencia: 7,
    });
  }, Error);
});

test('getQueueEntry retorna una entrada de cola', () => {
  const service = createWaitingQueueService();
  
  const created = service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  const retrieved = service.getQueueEntry(created.id);
  assert.equal(retrieved.id, created.id);
  assert.equal(retrieved.cuidadorId, 'user_1');
});

test('getQueueEntry lanza error si no existe', () => {
  const service = createWaitingQueueService();
  
  assert.throws(() => {
    service.getQueueEntry('nonexistent');
  }, Error);
});

test('listQueue retorna todas las entradas', () => {
  const service = createWaitingQueueService();
  
  service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  service.addToQueue({
    cuidadorId: 'user_2',
    perfilCuidador: {},
    urgencia: 8,
  });

  const entries = service.listQueue();
  assert.equal(entries.length, 2);
});

test('listQueue ordena por urgencia (descendente por defecto)', () => {
  const service = createWaitingQueueService();
  
  service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 3,
  });

  service.addToQueue({
    cuidadorId: 'user_2',
    perfilCuidador: {},
    urgencia: 9,
  });

  service.addToQueue({
    cuidadorId: 'user_3',
    perfilCuidador: {},
    urgencia: 5,
  });

  const entries = service.listQueue({ sortBy: 'urgencia', order: 'desc' });
  assert.equal(entries[0].urgencia, 9);
  assert.equal(entries[1].urgencia, 5);
  assert.equal(entries[2].urgencia, 3);
});

test('listQueue filtra por status', () => {
  const service = createWaitingQueueService();
  
  const entry1 = service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
    estado: 'waiting',
  });

  service.addToQueue({
    cuidadorId: 'user_2',
    perfilCuidador: {},
    urgencia: 8,
    estado: 'waiting',
  });

  service.updateQueueEntry(entry1.id, { estado: 'offered' });

  const waitingEntries = service.listQueue({ status: 'waiting' });
  assert.equal(waitingEntries.length, 1);
  assert.equal(waitingEntries[0].cuidadorId, 'user_2');
});

test('updateQueueEntry actualiza el estado', () => {
  const service = createWaitingQueueService();
  
  const created = service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  const updated = service.updateQueueEntry(created.id, { estado: 'offered' });
  assert.equal(updated.estado, 'offered');
  assert.ok(updated.fechaOfrecido);
});

test('updateQueueEntry actualiza urgencia', () => {
  const service = createWaitingQueueService();
  
  const created = service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  const updated = service.updateQueueEntry(created.id, { urgencia: 9 });
  assert.equal(updated.urgencia, 9);
});

test('updateQueueEntry lanza error si urgencia no es válida', () => {
  const service = createWaitingQueueService();
  
  const created = service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  assert.throws(() => {
    service.updateQueueEntry(created.id, { urgencia: 15 });
  }, Error);
});

test('removeFromQueue elimina una entrada', () => {
  const service = createWaitingQueueService();
  
  const created = service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  const removed = service.removeFromQueue(created.id);
  assert.equal(removed.id, created.id);

  const entries = service.listQueue();
  assert.equal(entries.length, 0);
});

test('removeFromQueue lanza error si no existe', () => {
  const service = createWaitingQueueService();
  
  assert.throws(() => {
    service.removeFromQueue('nonexistent');
  }, Error);
});

test('getQueueStats retorna estadísticas correctas', () => {
  const service = createWaitingQueueService();
  
  service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  service.addToQueue({
    cuidadorId: 'user_2',
    perfilCuidador: {},
    urgencia: 8,
  });

  service.addToQueue({
    cuidadorId: 'user_3',
    perfilCuidador: {},
    urgencia: 3,
  });

  const stats = service.getQueueStats();
  
  assert.equal(stats.total, 3);
  assert.equal(stats.waiting, 3);
  assert.equal(stats.offered, 0);
  assert.equal(stats.urgentCount, 1); // Solo user_2 con urgencia 8
  assert.ok(stats.averageUrgency);
});

test('getNextCandidatesForMatching retorna candidatos ordenados por urgencia', () => {
  const service = createWaitingQueueService();
  
  service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: { edad: 45 },
    urgencia: 3,
  });

  service.addToQueue({
    cuidadorId: 'user_2',
    perfilCuidador: { edad: 50 },
    urgencia: 9,
  });

  service.addToQueue({
    cuidadorId: 'user_3',
    perfilCuidador: { edad: 55 },
    urgencia: 7,
  });

  const candidates = service.getNextCandidatesForMatching(10);
  
  assert.equal(candidates.length, 3);
  assert.equal(candidates[0].urgencia, 9);
  assert.equal(candidates[1].urgencia, 7);
  assert.equal(candidates[2].urgencia, 3);
});

test('getNextCandidatesForMatching respeta el límite', () => {
  const service = createWaitingQueueService();
  
  for (let i = 1; i <= 10; i++) {
    service.addToQueue({
      cuidadorId: `user_${i}`,
      perfilCuidador: {},
      urgencia: i <= 10 ? i : 10,
    });
  }

  const candidates = service.getNextCandidatesForMatching(8);
  assert.equal(candidates.length, 8);
});

test('markAsOffered marca múltiples candidatos como offered', () => {
  const service = createWaitingQueueService();
  
  const entry1 = service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  const entry2 = service.addToQueue({
    cuidadorId: 'user_2',
    perfilCuidador: {},
    urgencia: 8,
  });

  const updated = service.markAsOffered([entry1.id, entry2.id]);
  
  assert.equal(updated.length, 2);
  assert.ok(updated.every((u) => u.estado === 'offered'));
  assert.ok(updated.every((u) => u.fechaOfrecido));
});

test('markAsOffered lanza error si array vacío', () => {
  const service = createWaitingQueueService();
  
  assert.throws(() => {
    service.markAsOffered([]);
  }, Error);
});

test('clearQueue limpia la cola', () => {
  const service = createWaitingQueueService();
  
  service.addToQueue({
    cuidadorId: 'user_1',
    perfilCuidador: {},
    urgencia: 5,
  });

  service.addToQueue({
    cuidadorId: 'user_2',
    perfilCuidador: {},
    urgencia: 8,
  });

  const count = service.clearQueue();
  assert.equal(count, 2);

  const entries = service.listQueue();
  assert.equal(entries.length, 0);
});

test('Cola funciona correctamente con múltiples operaciones', () => {
  const service = createWaitingQueueService();
  
  // Agregar varios cuidadores
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const entry = service.addToQueue({
      cuidadorId: `user_${i}`,
      perfilCuidador: { edad: 40 + i },
      urgencia: i,
    });
    users.push(entry);
  }

  // Verificar conteo
  assert.equal(service.listQueue().length, 5);

  // Actualizar estado de algunos
  service.updateQueueEntry(users[0].id, { estado: 'offered' });
  service.updateQueueEntry(users[1].id, { estado: 'offered' });

  // Verificar filtrado
  const waiting = service.listQueue({ status: 'waiting' });
  assert.equal(waiting.length, 3);

  // Remover uno
  service.removeFromQueue(users[4].id);
  assert.equal(service.listQueue().length, 4);

  // Verificar estadísticas
  const stats = service.getQueueStats();
  assert.equal(stats.total, 4);
  assert.equal(stats.offered, 2);
  assert.equal(stats.waiting, 2);
});
