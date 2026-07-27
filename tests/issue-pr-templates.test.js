const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('las plantillas de issues y pull requests existen y son accesibles', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const issueTemplates = [
    path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'bug_report.md'),
    path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'feature_request.md'),
  ];
  const prTemplate = path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE', 'pull_request_template.md');

  issueTemplates.forEach((filePath) => {
    assert.ok(fs.existsSync(filePath), `debe existir ${path.relative(repoRoot, filePath)}`);
  });

  assert.ok(fs.existsSync(prTemplate), 'debe existir .github/PULL_REQUEST_TEMPLATE/pull_request_template.md');
});
