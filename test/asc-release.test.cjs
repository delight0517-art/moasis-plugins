const assert = require('node:assert/strict');
const { mkdtemp, writeFile, rm, mkdir } = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { test } = require('node:test');
const { register, plan, fingerprint } = require('../plugins/asc-release');
const release = { bundleId: 'com.example.app', version: '1.0.0', build: '10' };

test('ASC tools preserve release boundaries and reject incomplete identity', async () => {
  assert.throws(() => plan({ ...release, build: '' }), /build/);
  assert.throws(() => plan({ ...release, bundleId: 'missing' }), /bundleId/);
  const tools = []; register({ tool: x => tools.push(x) });
  assert.equal(tools.length, 2); assert.ok(tools.every(x => x.readOnly));
  const dir = await mkdtemp(path.join(os.tmpdir(), 'moasis-asc-test-'));
  try {
    const artifactPath = path.join(dir, 'fixture.ipa'); await writeFile(artifactPath, 'abc');
    const result = await fingerprint({ ...release, artifactPath });
    assert.equal(result.package.sha256, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(result.signatureVerified, false); assert.equal(result.archiveValidated, false);
    assert.equal(result.uploadPerformed, false); assert.equal(result.submissionPerformed, false);
    await assert.rejects(fingerprint({ ...release, artifactPath: 'relative.ipa' }), /absolute/);
    const directory = path.join(dir, 'directory.ipa'); await mkdir(directory);
    await assert.rejects(fingerprint({ ...release, artifactPath: directory }), /nonempty package/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
