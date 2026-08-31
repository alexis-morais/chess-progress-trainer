import { createUciEngine } from './stockfish-node.mjs';

const { command } = await createUciEngine((line) => process.send(line));
process.on('message', (line) => command(line));
