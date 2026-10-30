'use strict';

const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');

const ASIDE_CLI = process.env.MOASIS_ASIDE_CLI || path.join(os.homedir(), '.aside', 'starnet-bin', 'aside');
const MAX_PROMPT = 6000;
const MAX_RESULT = 12000;
const MCP_TIMEOUT_MS = 105000;
const MCP_VERSION = '2025-03-26';

function textOf(result) {
  const blocks = result && Array.isArray(result.content) ? result.content : [];
  const text = blocks.filter(x => x && x.type === 'text').map(x => String(x.text || '')).join('\n').trim();
  return text.slice(0, MAX_RESULT);
}

function normalizeTask(args) {
  const prompt = String(args && args.prompt || '').trim();
  if (!prompt) throw new Error('Give Aside a concrete browser task.');
  if (prompt.length > MAX_PROMPT) throw new Error('The browser task is too long (maximum ' + MAX_PROMPT + ' characters).');
  const sessionId = String(args && args.session_id || '').trim();
  if (sessionId && !/^[A-Za-z0-9_-]{4,128}$/.test(sessionId)) throw new Error('Invalid Aside session ID.');
  return { prompt, sessionId };
}

function guardedPrompt(prompt) {
  return [
    'StarNet handoff: carry out only the browser task below in the existing Aside session.',
    'Use the currently signed-in account and any saved passkey only through Aside’s own browser/password-manager flow.',
    'Never reveal, copy, or return a password, passkey, OTP, cookie, token, or recovery code.',
    'If a system prompt, device approval, Touch ID, QR scan, security challenge, or other human action appears, stop and report the exact visible step.',
    'Use Guard/ask permissions. Do not change account, accept new terms, spend money, or perform unrelated actions.',
    'Task: ' + prompt
  ].join('\n');
}

function withAsideMcp(call, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const child = spawn(ASIDE_CLI, ['mcp'], { shell: false, stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
    let buffer = '';
    let sequence = 0;
    const pending = new Map();
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      pending.clear();
      try { child.kill('SIGTERM'); } catch (_) {}
      error ? reject(error) : resolve(value);
    };
    const timer = setTimeout(() => finish(new Error('Aside MCP did not answer before the time limit.')), timeoutMs);
    if (timer.unref) timer.unref();

    child.on('error', () => finish(new Error('Aside CLI could not start. Check the Aside CLI installation.')));
    child.on('exit', code => {
      if (!settled) finish(new Error('Aside MCP exited before the request completed (code ' + code + ').'));
    });
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line) continue;
        let message;
        try { message = JSON.parse(line); } catch (_) { continue; }
        if (message.id != null && pending.has(message.id)) {
          const waiter = pending.get(message.id);
          pending.delete(message.id);
          message.error ? waiter.reject(new Error('Aside MCP request failed (' + (message.error.code || 'unknown') + ').')) : waiter.resolve(message.result);
        }
      }
    });

    function send(method, params, id) {
      const message = { jsonrpc: '2.0', method, params: params || {} };
      if (id != null) message.id = id;
      child.stdin.write(JSON.stringify(message) + '\n');
    }
    function request(method, params) {
      const id = ++sequence;
      return new Promise((res, rej) => {
        pending.set(id, { resolve: res, reject: rej });
        send(method, params, id);
      });
    }

    (async () => {
      try {
        const initialized = await request('initialize', {
          protocolVersion: MCP_VERSION,
          capabilities: {},
          clientInfo: { name: 'starnet-aside-bridge', version: '1.0.0' }
        });
        if (!initialized || !initialized.serverInfo || initialized.serverInfo.name !== 'aside') {
          throw new Error('The connected MCP server did not identify itself as Aside.');
        }
        send('notifications/initialized', {});
        const tools = await request('tools/list', {});
        const available = new Set((tools && Array.isArray(tools.tools) ? tools.tools : []).map(x => x && x.name));
        if (!available.has('exec')) throw new Error('Aside MCP is connected, but its browser task tool is unavailable.');
        const result = await call(request, initialized.serverInfo);
        finish(null, result);
      } catch (error) {
        finish(error instanceof Error ? error : new Error(String(error)));
      }
    })();
  });
}

async function status() {
  const result = await withAsideMcp(async (_, serverInfo) => ({
    ok: true,
    provider: 'Aside',
    version: String(serverInfo.version || 'unknown'),
    browserTaskTool: 'available',
    auth: 'Handled by the existing Aside session; credentials are not read by this plugin.'
  }), 15000);
  return result;
}

async function delegate(args) {
  const { prompt, sessionId } = normalizeTask(args);
  const result = await withAsideMcp(async request => {
    const toolResult = await request('tools/call', {
      name: 'exec',
      arguments: { prompt: guardedPrompt(prompt), ...(sessionId ? { session_id: sessionId } : {}) }
    });
    if (toolResult && toolResult.isError) throw new Error('Aside could not complete the browser task. Check the task in Aside.');
    const output = textOf(toolResult);
    if (!output) throw new Error('Aside returned no task result.');
    const structured = toolResult && toolResult.structuredContent || {};
    const returnedSession = String(structured.session_id || structured.sessionId || toolResult.session_id || '');
    return { ok: true, provider: 'Aside', session_id: /^[A-Za-z0-9_-]{4,128}$/.test(returnedSession) ? returnedSession : '', result: output };
  }, MCP_TIMEOUT_MS);
  return result;
}

async function register(api) {
  const liveJobs = new Map();
  let activeJob = '';

  function jobSummary(job) {
    return { id: job.id, state: job.state, submittedAt: job.submittedAt, finishedAt: job.finishedAt || '', session_id: job.session_id || '', result: job.result || '', error: job.error || '' };
  }

  async function saveJobIndex() {
    const rows = Array.from(liveJobs.values()).sort((a, b) => b.submittedAt - a.submittedAt).slice(0, 8);
    // Persist only job state and timestamps; task text and browser results remain in this process's memory.
    await api.store.set('jobs', rows.map(j => ({ id: j.id, state: j.state, submittedAt: j.submittedAt, finishedAt: j.finishedAt || '' })));
    const keep = new Set(rows.map(j => j.id));
    for (const id of liveJobs.keys()) if (!keep.has(id) && id !== activeJob) liveJobs.delete(id);
  }

  async function submit(args) {
    const { prompt, sessionId } = normalizeTask(args);
    if (activeJob) throw new Error('Another Aside task is already running in this StarNet workspace.');
    const job = { id: crypto.randomUUID(), state: 'queued', submittedAt: Date.now(), session_id: sessionId, prompt, result: '', error: '' };
    liveJobs.set(job.id, job);
    activeJob = job.id;
    await saveJobIndex();
    setImmediate(async () => {
      job.state = 'running';
      await saveJobIndex().catch(() => {});
      try {
        const result = await delegate({ prompt: job.prompt, session_id: job.session_id });
        job.state = 'done';
        job.result = result.result;
        job.session_id = result.session_id || job.session_id;
      } catch (error) {
        job.state = 'error';
        job.error = String(error && error.message || error).slice(0, 500);
      } finally {
        job.finishedAt = Date.now();
        job.prompt = '';
        activeJob = '';
        await saveJobIndex().catch(() => {});
      }
    });
    return { id: job.id, state: job.state };
  }

  async function getJob(args) {
    const id = String(args && args.id || '');
    const job = liveJobs.get(id);
    if (job) return jobSummary(job);
    const persisted = (await api.store.get('jobs')) || [];
    const old = persisted.find(x => x && x.id === id);
    return old ? { id: old.id, state: old.state, submittedAt: old.submittedAt, finishedAt: old.finishedAt || '', error: 'The task details are no longer in memory. Check the Aside session before retrying.' } : { id, state: 'unknown' };
  }

  async function listJobs() {
    const persisted = (await api.store.get('jobs')) || [];
    return (Array.isArray(persisted) ? persisted : []).slice(0, 8).map(row => liveJobs.has(row.id) ? jobSummary(liveJobs.get(row.id)) : {
      id: row.id, state: row.state, submittedAt: row.submittedAt, finishedAt: row.finishedAt || '',
      error: row.state === 'interrupted' || row.state === 'done' || row.state === 'error'
        ? 'Task text and results are kept in memory only. Check Aside before retrying.' : ''
    });
  }

  const savedJobs = await api.store.get('jobs').catch(() => []);
  let recovered = false;
  for (const row of Array.isArray(savedJobs) ? savedJobs : []) {
    if (!row || !row.id || !['queued', 'running'].includes(row.state)) continue;
    row.state = 'interrupted';
    row.finishedAt = Date.now();
    recovered = true;
  }
  if (recovered) await api.store.set('jobs', savedJobs);

  api.handle('status', status);
  api.handle('submit', submit);
  api.handle('job', getJob);
  api.handle('jobs', listJobs);
  api.tool({
    name: 'status',
    description: 'Check whether the official Aside MCP browser task interface is available. Does not read account names or credentials.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    readOnly: true,
    run: status
  });
  api.tool({
    name: 'delegate',
    description: 'Send one concrete browser task to the user’s existing Aside session. Aside handles its own saved sign-in and passkey flow. Human security prompts stop for the Commander.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', minLength: 1, maxLength: MAX_PROMPT, description: 'The precise browser task for Aside.' },
        session_id: { type: 'string', minLength: 4, maxLength: 128, description: 'Optional Aside session ID for continuing a prior handoff.' }
      },
      required: ['prompt'],
      additionalProperties: false
    },
    readOnly: false,
    run: delegate
  });
}

module.exports = { register, _internals: { status, delegate, withAsideMcp, textOf } };
