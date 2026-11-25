const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const {
  createProfessionalResourcesService,
  DEFAULT_RESOURCES,
} = require('../apps/api/src/professional-resources.cjs');

test('el directorio ofrece recursos curados por región y modalidad', () => {
  const service = createProfessionalResourcesService();

  assert.equal(service.listResources().length, DEFAULT_RESOURCES.length);
  assert.equal(service.listResources({ region: 'Madrid' }).length, 3);
  assert.equal(
    service.listResources({ region: 'Barcelona', modalidad: 'telefono' }).length,
    1
  );
  assert.equal(service.getResource('madrid-salud-mental-comunitaria').region, 'Madrid');
  assert.ok(service.listRegions().includes('Madrid'));
});

test('filtra recursos gratuitos y rechaza consultas inválidas', () => {
  const service = createProfessionalResourcesService();
  const freeResources = service.listResources({ coste: 'gratuito' });

  assert.ok(freeResources.length >= 2);
  assert.ok(freeResources.every((resource) => resource.coste.includes('Gratuito')));
  assert.throws(
    () => service.getResource('desconocido'),
    /Recurso profesional no encontrado/
  );
});

test('las utilidades web filtran por región, modalidad y costo', async () => {
  const helperUrl = pathToFileURL(
    path.resolve(__dirname, '../apps/web/src/professional-resources-utils.js')
  ).href;
  const {
    PROFESSIONAL_RESOURCE_REGIONS,
    normalizeProfessionalResourceFilters,
    filterProfessionalResources,
  } = await import(helperUrl);

  assert.equal(PROFESSIONAL_RESOURCE_REGIONS.includes('Madrid'), true);
  assert.deepEqual(normalizeProfessionalResourceFilters(), {
    region: 'Todas',
    modality: 'todas',
    cost: '',
  });
  assert.equal(
    filterProfessionalResources(DEFAULT_RESOURCES, {
      region: 'Barcelona',
      modality: 'telefono',
      cost: 'gratuito',
    }).length,
    1
  );
});
