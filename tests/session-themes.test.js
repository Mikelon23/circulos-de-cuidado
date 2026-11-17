const test = require('node:test');
const assert = require('node:assert/strict');

const { createSessionThemeService } = require('../apps/api/src/session-themes.cjs');

test('createSessionThemeService ofrece la biblioteca base y soporta CRUD básico', () => {
  const service = createSessionThemeService();

  const themes = service.listThemes();
  assert.ok(themes.length >= 3);
  assert.ok(themes.some((theme) => theme.titulo === 'Manejo de la culpa'));

  const created = service.createTheme({
    titulo: 'Fuerza para pedir ayuda',
    descripcion: 'Hablar de la ayuda que sí necesitamos.',
    categoria: 'apoyo',
    tags: ['apoyo', 'redes', 'confianza'],
  });

  assert.equal(created.titulo, 'Fuerza para pedir ayuda');
  assert.equal(created.activo, true);

  const updated = service.updateTheme(created.id, {
    titulo: 'Pedir ayuda sin culpa',
    activo: false,
  });

  assert.equal(updated.titulo, 'Pedir ayuda sin culpa');
  assert.equal(updated.activo, false);

  const deleted = service.deleteTheme(created.id);
  assert.equal(deleted.id, created.id);
  assert.throws(() => service.getTheme(created.id), /Tema no encontrado/);
});
