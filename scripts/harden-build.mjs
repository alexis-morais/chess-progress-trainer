import { readFileSync, writeFileSync } from 'node:fs';

// Production only: the development server needs its own HMR scripts and websocket.
// A meta CSP cannot enforce frame-ancestors or govern an external Worker's context.
const policy = [
  "default-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');
for (const file of ['dist/index.html', 'dist/licences.html']) {
  const html = readFileSync(file, 'utf8');
  if (!html.includes('<head>')) throw Error(`En-tête HTML absent : ${file}`);
  writeFileSync(
    file,
    html.replace(
      '<head>',
      `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />\n    <meta name="referrer" content="no-referrer" />`,
    ),
  );
}
console.log('Politique de sécurité et de confidentialité ajoutée aux deux pages de production.');
