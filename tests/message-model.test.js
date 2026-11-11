const test = require('node:test');
const assert = require('node:assert/strict');
const { createMessageService } = require('../apps/api/src/messages.cjs');

test('createMessageService implementa CRUD completo para mensajes del círculo', () => {
  const service = createMessageService();

  const created = service.createMessage({
    circleId: 'circle-001',
    usuarioId: 'user-001',
    contenido: 'Hola equipo, ¿podemos revisar la sesión de esta semana?',
    tipo: 'texto',
  });

  assert.equal(created.circleId, 'circle-001');
  assert.equal(created.usuarioId, 'user-001');
  assert.equal(created.tipo, 'texto');
  assert.equal(created.contenido, 'Hola equipo, ¿podemos revisar la sesión de esta semana?');
  assert.ok(created.id);

  const reply = service.createMessage({
    circleId: 'circle-001',
    usuarioId: 'user-002',
    contenido: 'Sí, me parece bien.',
    tipo: 'texto',
    replyToId: created.id,
  });

  assert.equal(reply.replyToId, created.id);

  const listed = service.listMessages({ circleId: 'circle-001' });
  assert.equal(listed.length, 2);

  const found = service.getMessage(created.id);
  assert.equal(found.id, created.id);

  const updated = service.updateMessage(created.id, {
    contenido: 'He cambiado el texto inicial para clarificar el punto.',
    tipo: 'archivo',
    metadata: { filename: 'resumen.pdf' },
  });

  assert.equal(updated.contenido, 'He cambiado el texto inicial para clarificar el punto.');
  assert.equal(updated.tipo, 'archivo');
  assert.equal(updated.metadata.filename, 'resumen.pdf');

  const deleted = service.deleteMessage(reply.id);
  assert.equal(deleted.id, reply.id);
  assert.equal(service.listMessages({ circleId: 'circle-001' }).length, 1);
});

test('createMessageService valida contenido vacío y tipos no permitidos', () => {
  const service = createMessageService();

  assert.throws(
    () => service.createMessage({ circleId: 'circle-001', usuarioId: 'user-001' }),
    /contenido/i
  );

  assert.throws(
    () => service.createMessage({
      circleId: 'circle-001',
      usuarioId: 'user-001',
      contenido: 'Hola',
      tipo: 'pdf',
    }),
    /tipo/i
  );

  const created = service.createMessage({
    circleId: 'circle-001',
    usuarioId: 'user-001',
    contenido: 'Esto es un archivo adjunto',
    tipo: 'archivo',
  });

  const updated = service.updateMessage(created.id, { tipo: 'image' });
  assert.equal(updated.tipo, 'imagen');
});
