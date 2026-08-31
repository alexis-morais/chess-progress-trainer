// Local, read-only heuristic audit. Never prints matched values or source lines.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const rules = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['openai-key', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{30,}\b/g],
  ['aws-access-key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['google-api-key', /\bAIza[A-Za-z0-9_-]{35}\b/g],
  ['bearer-value', /\bBearer\s+[A-Za-z0-9._~+/-]{24,}/g],
  [
    'credential-assignment',
    /\b[A-Za-z0-9_]*(?:api[_-]?key|secret[_-]?(?:access[_-]?)?key|access[_-]?token|auth[_-]?token|password|_authToken)["']?\s*[=:]\s*["']?[A-Za-z0-9_+./=-]{24,}/gi,
  ],
  ['quoted-password', /\b[A-Za-z0-9_]*password["']?\s*[:=]\s*["'][^"'\r\n]{8,}["']/gi],
  ['credential-url', /https?:\/\/[^\s/"']{2,}:[^\s/@"']{4,}@/g],
];
const excluded = new Set(['.git', 'node_modules', '.pnpm-store', 'coverage', 'test-results']);
const binary = /\.(?:wasm|png|jpe?g|webp|ico|pdf|zip|gz|br|woff2?|tsbuildinfo)$/i;
const findings = [];
let files = 0,
  historyBlobs = 0,
  commits = 0;
function scan(content, location) {
  if (content.includes('\0')) return;
  for (const [type, pattern] of rules) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern))
      findings.push({
        type,
        ...location,
        line: content.slice(0, match.index).split('\n').length,
        value: '[MASQUÉE — vérifier et révoquer si réelle]',
      });
  }
}
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name) || entry.isSymbolicLink()) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (!binary.test(entry.name)) {
      files++;
      scan(readFileSync(path, 'utf8'), { file: path });
    }
  }
}
walk('.');
const git = (args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
try {
  commits = Number(git(['rev-list', '--all', '--count']).trim());
  const objects = git(['rev-list', '--objects', '--all']).trim().split('\n');
  for (const row of objects) {
    const split = row.indexOf(' ');
    if (split < 0) continue;
    const hash = row.slice(0, split),
      file = row.slice(split + 1);
    if (binary.test(file)) continue;
    if (git(['cat-file', '-t', hash]).trim() !== 'blob') continue;
    historyBlobs++;
    scan(git(['cat-file', 'blob', hash]), { file, gitBlob: hash });
  }
} catch {
  console.error(
    'Historique Git indisponible ou incomplet : audit limité aux fichiers accessibles.',
  );
  process.exitCode = 2;
}
console.log(JSON.stringify({ files, commits, historyBlobs, findings }, null, 2));
if (findings.length) process.exitCode = 1;
