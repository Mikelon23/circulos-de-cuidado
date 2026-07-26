const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

test('the repository exposes lint, test and build scripts for CI', () => {
  const packageJson = readJson('package.json');
  const scripts = packageJson.scripts || {};

  assert.ok(scripts.lint, 'Expected a lint script');
  assert.ok(scripts.test, 'Expected a test script');
  assert.ok(scripts.build, 'Expected a build script');
});

test('the CI workflow exists and targets pull requests and main pushes', () => {
  const workflowPath = path.join(repoRoot, '.github', 'workflows', 'ci.yml');
  const workflowContent = readFileSync(workflowPath, 'utf8');

  assert.match(workflowContent, /pull_request/i);
  assert.match(workflowContent, /push:\s*\n\s*branches:\s*\n\s*- main/i);
});
