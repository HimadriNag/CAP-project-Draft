// --- Imports ---
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws'); // Using 'ws' for ESP32

// --- Setup ---
const app = express();
const httpServer = http.createServer(app);
const PORT = 3000;
// Line 11: initialize Socket.IO with simple CORS so browser clients can connect
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

// --- WebSocket Server for ESP32 (Raw WS) ---
// Note: We use the '/ws/esp32' path for the raw hardware connection
const wss = new WebSocket.Server({ server: httpServer, path: '/ws/esp32' }); 

app.use(express.static('public'));

// --- Socket.IO for Browser Clients (Browser clients connect to the root path) ---
io.on('connection', (socket) => {
    console.log('[Socket.IO] Browser connected:', socket.id);

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Browser disconnected: ${socket.id}`);
    });
});

// --- Raw WS for ESP32 Client ---
wss.on('connection', (ws, req) => {
    // Log ESP32 IP address
    console.log(`[WS] ESP32 client connected from IP: ${req.socket.remoteAddress}`);

    ws.on('message', (message) => {
        const messageString = message.toString();
        console.log(`[WS] Received from ESP32: ${messageString}`);
        
        try {
            const data = JSON.parse(messageString);
            
            // This is the core logic that triggers the game jump
            if (data.event === 'game_jump') {
                console.log('JUMP signal received. Broadcasting to browser clients.');
                // send a small payload so clients can validate origin
                io.emit('game_jump', { from: 'esp32', ts: Date.now() });
                console.log('BROADCAST SUCCESSFUL to browser clients.');
            }
        } catch (error) {
            console.error('[WS] Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('[WS] ESP32 client disconnected.');
    });

    ws.on('error', (error) => {
        console.error('[WS] ESP32 WebSocket Error:', error);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Standard WS (ESP32) endpoint: ws://[IP]:${PORT}/ws/esp32`);
});
