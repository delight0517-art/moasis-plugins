'use strict';
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

function plan(args) {
  if (!args || !/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(args.bundleId || '')) throw new Error('An exact bundleId is required.');
  if (!/^\d+(?:\.\d+){0,2}$/.test(args.version || '')) throw new Error('An exact numeric version is required.');
  if (!/^\d+(?:\.\d+){0,2}$/.test(args.build || '')) throw new Error('An exact numeric build is required.');
  return {
    bundleId: args.bundleId, version: args.version, build: args.build,
    stages: ['verify signed artifact identity', 'verify target account, app, version and permissions', 'upload through the selected supported Apple tool', 'read back processing and exact build', 'verify metadata and compliance', 'submit only when the owner requests submission', 'read back review state'],
    uploadPerformed: false, submissionPerformed: false,
    reference: 'https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds'
  };
}

async function fingerprint(args) {
  const release = plan(args);
  if (typeof args.artifactPath !== 'string' || !path.isAbsolute(args.artifactPath)) throw new Error('artifactPath must be an absolute path.');
  const name = await fsp.realpath(args.artifactPath);
  if (!['.ipa', '.pkg'].includes(path.extname(name).toLowerCase())) throw new Error('Select a distribution .ipa or .pkg file.');
  const file = await fsp.open(name, 'r');
  try {
    const before = await file.stat();
    if (!before.isFile() || before.size === 0 || before.size > 20 * 1024 ** 3) throw new Error('Select a nonempty package of at most 20 GiB.');
    const hash = crypto.createHash('sha256');
    for await (const chunk of file.createReadStream({ autoClose: false })) hash.update(chunk);
    const after = await file.stat();
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) throw new Error('Package changed while reading; retry after its writer finishes.');
    return { ...release, package: { name: path.basename(name), bytes: before.size, sha256: hash.digest('hex') }, identityVerified: false, signatureVerified: false, archiveValidated: false };
  } finally { await file.close(); }
}

function register(api) {
  const common = { bundleId: { type: 'string' }, version: { type: 'string' }, build: { type: 'string' } };
  api.tool({ name: 'release_plan', description: 'Plan the exact ASC release; performs no upload or submission.', readOnly: true,
    parameters: { type: 'object', properties: common, required: ['bundleId', 'version', 'build'], additionalProperties: false }, run: plan });
  api.tool({ name: 'fingerprint_package', description: 'Read an explicitly selected .ipa/.pkg file and compute its SHA-256. This does not validate signing or app identity.', readOnly: true,
    parameters: { type: 'object', properties: { ...common, artifactPath: { type: 'string' } }, required: ['bundleId', 'version', 'build', 'artifactPath'], additionalProperties: false }, run: fingerprint });
}

module.exports = { register, plan, fingerprint };
