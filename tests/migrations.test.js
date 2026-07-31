const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const apiRoot = path.join(repoRoot, 'apps', 'api');
const prismaRoot = path.join(apiRoot, 'prisma');
const migrationFile = path.join(prismaRoot, 'migrations', '20260730_init', 'migration.sql');
const schemaFile = path.join(prismaRoot, 'schema.prisma');
const packageJsonPath = path.join(apiRoot, 'package.json');

test('la API expone un esquema Prisma y una migración inicial ejecutable', () => {
  assert.ok(fs.existsSync(schemaFile), 'debe existir schema.prisma');
  assert.ok(fs.existsSync(migrationFile), 'debe existir la migración inicial');

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  assert.ok(pkg.scripts?.['db:migrate'], 'debe existir un script para ejecutar migraciones');
  assert.ok(pkg.scripts?.['db:generate'], 'debe existir un script para generar el cliente Prisma');
});
