import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('--- Root Loader Starting (ESM) ---');
console.log('Redirecting to chat-server/index.js...');

// Start the actual chat server from the subdirectory
const child = spawn('node', ['index.js'], {
  cwd: join(__dirname, 'chat-server'),
  stdio: 'inherit'
});

child.on('exit', (code) => {
  console.log(`Chat server exited with code ${code}`);
  process.exit(code || 0);
});
