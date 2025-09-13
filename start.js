import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Discord Bot Dashboard...');

// Start the Discord bot
console.log('📡 Starting Discord bot...');
const botProcess = spawn('node', ['Bot/src/bot.js'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: __dirname
});

botProcess.stdout.on('data', (data) => {
    console.log(`[BOT] ${data.toString().trim()}`);
});

botProcess.stderr.on('data', (data) => {
    console.error(`[BOT ERROR] ${data.toString().trim()}`);
});

// Start the web dashboard
console.log('🌐 Starting web dashboard...');
const dashboardProcess = spawn('node', ['dashboard/backend/server.js'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: __dirname
});

dashboardProcess.stdout.on('data', (data) => {
    console.log(`[DASHBOARD] ${data.toString().trim()}`);
});

dashboardProcess.stderr.on('data', (data) => {
    console.error(`[DASHBOARD ERROR] ${data.toString().trim()}`);
});

// Handle process termination
const cleanup = () => {
    console.log('🛑 Shutting down...');
    botProcess.kill();
    dashboardProcess.kill();
    process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Handle child process exits
botProcess.on('exit', (code) => {
    console.log(`❌ Discord bot exited with code ${code}`);
    if (code !== 0) {
        cleanup();
    }
});

dashboardProcess.on('exit', (code) => {
    console.log(`❌ Dashboard exited with code ${code}`);
    if (code !== 0) {
        cleanup();
    }
});

console.log('✅ Discord Bot Dashboard started successfully!');