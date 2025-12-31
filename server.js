const express = require('express');
const open = require('open');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the current directory
// Serve static files from the current directory
app.use(express.static(__dirname));
app.use(express.json());

// API Endpoints
const fs = require('fs');
const CONFIG_DIR = path.join(__dirname, 'config');
const DEFAULT_CONFIG = path.join(CONFIG_DIR, 'default.json');

// Ensure config dir exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR);
}

// Get Config
app.get('/api/config/default', (req, res) => {
    if (fs.existsSync(DEFAULT_CONFIG)) {
        res.sendFile(DEFAULT_CONFIG);
    } else {
        res.status(404).json({ error: "No default config found" });
    }
});

// Save Config
app.post('/api/config/default', (req, res) => {
    try {
        fs.writeFileSync(DEFAULT_CONFIG, JSON.stringify(req.body, null, 2));
        console.log("💾 Configuration saved to config/default.json");
        res.json({ success: true });
    } catch (err) {
        console.error("Error saving config:", err);
        res.status(500).json({ error: "Failed to save config" });
    }
});

// --- Upload Handling ---
const multer = require('multer');
const uploadStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);
        cb(null, CONFIG_DIR);
    },
    filename: (req, file, cb) => {
        // Save as a standard name to allow easy reloading, but preserve extension
        const ext = path.extname(file.originalname);
        cb(null, 'user_background' + ext);
    }
});
const upload = multer({ storage: uploadStorage });

app.post('/api/upload-background', upload.single('background'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("📂 Background uploaded:", req.file.filename);

    // Return the path relative to the server root
    res.json({
        success: true,
        path: `config/${req.file.filename}`,
        type: req.file.mimetype.startsWith('image') ? 'image' : 'video'
    });
});

// --- Channels API ---
app.get('/api/channels', (req, res) => {
    const channelsDir = path.join(__dirname, 'channels');
    if (!fs.existsSync(channelsDir)) return res.json([]);

    try {
        const channels = fs.readdirSync(channelsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const dirPath = path.join(channelsDir, dirent.name);
                const jsonPath = path.join(dirPath, 'channel.json');

                if (fs.existsSync(jsonPath)) {
                    try {
                        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                        // Ensure image path is relative to root
                        if (data.img) {
                            data.img = `channels/${dirent.name}/${data.img}`;
                        }
                        return data;
                    } catch (err) {
                        console.error(`Error parsing ${jsonPath}:`, err);
                        return null;
                    }
                }
                return null;
            })
            .filter(c => c !== null);

        res.json(channels);
    } catch (err) {
        console.error("Error reading channels:", err);
        res.status(500).json({ error: "Channels error" });
    }
});

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- Socket.IO / Watch Party Logic ---
const rooms = {}; // { roomId: { host: socketId, viewers: [socketId], state: {} } }

io.on('connection', (socket) => {
    // Join a party
    socket.on('join-room', (roomId, isHost) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = { host: null, viewers: [], state: {} };
        }

        if (isHost) {
            rooms[roomId].host = socket.id;
            console.log(`🏠 Room ${roomId} created by host ${socket.id}`);
        } else {
            rooms[roomId].viewers.push(socket.id);
            console.log(`👤 User ${socket.id} joined room ${roomId}`);

            // If room has state, send it to new user
            if (rooms[roomId].state) {
                socket.emit('sync-state', rooms[roomId].state);
            }

            // Notify host a new user joined (for PeerJS calls if needed)
            if (rooms[roomId].host) {
                io.to(rooms[roomId].host).emit('user-joined', socket.id);
            }
        }
    });

    // Sync State (Host -> Room)
    socket.on('sync-state', (data) => {
        const { roomId, state } = data;
        if (rooms[roomId] && rooms[roomId].host === socket.id) {
            rooms[roomId].state = state; // Cache state
            socket.to(roomId).emit('sync-state', state); // Broadcast to viewers
        }
    });

    // Signaling for WebRTC (PeerJS handling is mostly client-side but simple signaling helps)
    socket.on('signal', (data) => {
        io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
    });

    // Peer ID exchange
    socket.on('peer-id', (data) => {
        const { roomId, peerId } = data;
        socket.to(roomId).emit('peer-id', { from: socket.id, peerId });
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        // Cleanup rooms if host leaves? Or keep it?
        // simple cleanup:
        for (const roomId in rooms) {
            if (rooms[roomId].host === socket.id) {
                // Host left
                io.to(roomId).emit('host-left');
                delete rooms[roomId];
            } else {
                rooms[roomId].viewers = rooms[roomId].viewers.filter(id => id !== socket.id);
            }
        }
    });
});

server.listen(PORT, async () => {
    const url = `http://localhost:${PORT}/index.html`;

    console.log(`\n📺 Retro Room Simulator is running!`);
    console.log(`📡 Serving at: ${url}`);
    console.log("❌ Press Ctrl+C to stop the server.\n");

    // Open the browser automatically
    try {
        await open(url);
    } catch (err) {
        console.log("Could not open browser automatically. Please open the URL manually.");
    }
});