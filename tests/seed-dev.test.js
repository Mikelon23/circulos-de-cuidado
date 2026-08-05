const test = require('node:test');
const assert = require('node:assert/strict');

const { seedDevelopmentData } = require('../scripts/seed-dev.cjs');

test('seedDevelopmentData creates the expected development dataset', () => {
  const result = seedDevelopmentData();

  assert.equal(result.users, 20);
  assert.equal(result.facilitators, 3);
  assert.equal(result.circles, 5);
  assert.equal(result.checkIns, 50);
  assert.ok(result.usersCreated.length >= 20);
  assert.ok(result.facilitatorsCreated.length >= 3);
  assert.ok(result.circlesCreated.length >= 5);
  assert.ok(result.checkInsCreated.length >= 50);
});
