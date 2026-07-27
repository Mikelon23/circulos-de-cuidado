const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('la guía de estilo y las herramientas de formato quedan documentadas y configuradas', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const styleGuidePath = path.join(repoRoot, 'docs', 'ESTILO.md');
  const prettierConfigPath = path.join(repoRoot, '.prettierrc.json');
  const packageJsonPath = path.join(repoRoot, 'package.json');

  assert.ok(fs.existsSync(styleGuidePath), 'debe existir docs/ESTILO.md');
  assert.ok(fs.existsSync(prettierConfigPath), 'debe existir .prettierrc.json');

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  assert.ok(
    pkg.devDependencies?.prettier,
    'debe declararse prettier como dependencia de desarrollo'
  );
  assert.ok(
    pkg.scripts?.format?.includes('prettier'),
    'debe existir un script de formato con prettier'
  );
});
