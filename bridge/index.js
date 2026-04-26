/**
 * iPod CarThing — Mac Bridge
 * 
 * Runs on Mac. CarThing connects via USB → local network.
 * Start: node index.js
 * 
 * WebSocket messages (server → client):
 *   { type: "now_playing", track: {...}, artwork: "url" }
 *   { type: "library", tracks: [...], albums: [...] }
 *   { type: "state", state: "playing"|"paused"|"stopped" }
 *
 * WebSocket messages (client → server):
 *   { type: "play" }
 *   { type: "pause" }
 *   { type: "next" }
 *   { type: "prev" }
 *   { type: "play_track", persistentId: "..." }
 *   { type: "seek", position: 30.5 }
 *   { type: "get_artwork", artist: "...", album: "..." }
 */

const express = require("express");
const { WebSocketServer } = require("ws");
const cors = require("cors");
const http = require("http");
const AS = require("./applescript");
const { fetchFromItunesApi, preloadArtwork } = require("./artwork");

const PORT = 8765;
const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clients = new Set();
let library = [];
let lastTrackId = null;
let pollInterval = null;

// ── Broadcast to all connected clients ──────────────────────────────────────
function broadcast(msg) {
  const str = JSON.stringify(msg);
  clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(str);
  });
}

// ── Now playing poller ───────────────────────────────────────────────────────
async function pollNowPlaying() {
  const track = AS.getCurrentTrack();
  if (!track) {
    if (lastTrackId !== "STOPPED") {
      lastTrackId = "STOPPED";
      broadcast({ type: "state", state: "stopped" });
    }
    return;
  }

  broadcast({ type: "state", state: track.state === "playing" ? "playing" : "paused" });
  broadcast({ type: "position", position: track.position, duration: track.duration });

  if (track.persistentId !== lastTrackId) {
    lastTrackId = track.persistentId;
    const artwork = await fetchFromItunesApi(track.artist, track.album);
    broadcast({ type: "now_playing", track, artwork });
  }
}

// ── WebSocket handler ────────────────────────────────────────────────────────
wss.on("connection", async (ws) => {
  console.log("[ws] Client connected");
  clients.add(ws);

  // Send library on connect
  if (library.length > 0) {
    ws.send(JSON.stringify({ type: "library", tracks: library }));
  }

  // Send current track
  const track = AS.getCurrentTrack();
  if (track) {
    const artwork = await fetchFromItunesApi(track.artist, track.album);
    ws.send(JSON.stringify({ type: "now_playing", track, artwork }));
  }

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case "play": AS.play(); break;
      case "pause": AS.pause(); break;
      case "next": AS.nextTrack(); break;
      case "prev": AS.prevTrack(); break;
      case "seek": AS.setPosition(msg.position); break;
      case "play_track": AS.playTrackById(msg.persistentId); break;
      case "get_artwork": {
        const url = await fetchFromItunesApi(msg.artist, msg.album);
        ws.send(JSON.stringify({ type: "artwork", artist: msg.artist, album: msg.album, url }));
        break;
      }
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("[ws] Client disconnected");
  });
});

// ── HTTP endpoints ───────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ ok: true, library: library.length }));

// ── Startup ──────────────────────────────────────────────────────────────────
async function start() {
  console.log("[bridge] Loading Apple Music library...");
  library = AS.getLibrary();
  console.log(`[bridge] ${library.length} tracks loaded`);

  // Preload first 50 album covers
  await preloadArtwork(library, 50);

  // Start polling now playing every 2s
  pollInterval = setInterval(pollNowPlaying, 2000);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\n[bridge] Running on ws://localhost:${PORT}`);
    console.log("[bridge] Connect CarThing to: ws://<your-mac-ip>:8765");
    console.log("[bridge] Find your IP: ifconfig | grep 'inet ' | grep -v 127");
    console.log("\nReady. Waiting for CarThing connection...\n");
  });
}

start().catch(console.error);
