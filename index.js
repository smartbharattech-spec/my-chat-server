const { spawn } = require('child_process');
const path = require('path');

console.log('--- Root Loader Starting ---');
console.log('Redirecting to chat-server/index.js...');

// Start the actual chat server from the subdirectory
const child = spawn('node', ['index.js'], {
  cwd: path.join(__dirname, 'chat-server'),
  stdio: 'inherit'
});

child.on('exit', (code) => {
  console.log(`Chat server exited with code ${code}`);
  process.exit(code);
});
