import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const scenarios = [
  ['baseline-template', false],
  ['control', false],
  ['template', true],
];
let failures = 0;
for (const [mode, expectMissingExport] of scenarios) {
  const result = spawnSync('pnpm', ['exec', 'vite', 'build', '--mode', mode], {
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  const output = ((result.stdout ?? '') + (result.stderr ?? '')).replace(/\u001b\[[0-9;]*m/g, '');
  const missingExport = /MISSING_EXPORT/.test(output) && /"answer" is not exported/.test(output)
    && /virtual:mf:/.test(output);
  try {
    assert.ifError(result.error);
    assert.notEqual(result.status, null, `build terminated by ${result.signal}`);
    if (expectMissingExport) {
      assert.notEqual(result.status, 0, 'expected the reported bug, but the build succeeded');
      assert.ok(missingExport, 'build failed for a different reason');
      console.log(`${mode}: reproduced MISSING_EXPORT for answer`);
      console.log(output.split('\n').find(line => line.includes('[MISSING_EXPORT]'))?.trim());
    } else {
      assert.equal(result.status, 0, 'expected a successful build');
      console.log(`${mode}: build passed`);
    }
  } catch (error) {
    failures++;
    console.error(`${mode}: ${error.message}\n${output}`);
  }
}
if (failures) process.exitCode = 1;
else console.log('Bug reproduced; the same source without MF and the MF control both passed.');
