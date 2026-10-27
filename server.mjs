import { EventEmitter } from "node:events";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);

const SOCKET_PATH = "/api/socket/io";

// Next lazily attaches its own "upgrade" listener to whatever server handles the
// first request, and that listener kills socket.io's WebSocket connections. Hand it
// a dummy emitter instead and route upgrades ourselves (see below).
const app = next({
	dev: process.env.NODE_ENV !== "production",
	dir: __dirname,
	port,
	hostname: "0.0.0.0",
	httpServer: new EventEmitter(),
});
const handle = app.getRequestHandler();

await app.prepare();

// Next only serves files that were in public/ at startup, so anything uploaded while
// the server is running 404s until a restart. Serve uploads straight from disk instead.
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");
const UPLOAD_TYPES = {
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".webp": "image/webp",
	".avif": "image/avif",
	".pdf": "application/pdf",
};

async function serveUpload(req, res) {
	const name = decodeURIComponent(req.url.slice("/uploads/".length).split("?")[0]);
	const type = UPLOAD_TYPES[path.extname(name).toLowerCase()];
	if (!type || name.includes("/") || name.includes("\\") || name.startsWith(".")) return false;
	const file = path.join(UPLOAD_DIR, name);
	try {
		const info = await stat(file);
		if (!info.isFile()) return false;
		res.writeHead(200, {
			"Content-Type": type,
			"Content-Length": info.size,
			"Cache-Control": "public, max-age=31536000, immutable",
			"X-Content-Type-Options": "nosniff",
		});
		if (req.method === "HEAD") return res.end(), true;
		createReadStream(file).pipe(res);
		return true;
	} catch {
		return false;
	}
}

const server = createServer(async (req, res) => {
	if ((req.method === "GET" || req.method === "HEAD") && req.url?.startsWith("/uploads/")) {
		if (await serveUpload(req, res)) return;
	}
	handle(req, res);
});

const io = new SocketIOServer(server, {
	path: SOCKET_PATH,
	addTrailingSlash: false,
});

const nextUpgrade = app.getUpgradeHandler();
server.on("upgrade", (req, socket, head) => {
	if (!req.url?.startsWith(SOCKET_PATH)) nextUpgrade(req, socket, head);
});

const presence = new Map();

function broadcastPresence(profileId, online) {
	io.emit("presence:update", { profileId, online });
}

io.on("connection", (socket) => {
	socket.on("typing:start", (payload) => {
		socket.broadcast.emit("typing:start", payload);
	});
	socket.on("typing:stop", (payload) => {
		socket.broadcast.emit("typing:stop", payload);
	});
	socket.on("presence:join", (payload) => {
		const profileId = payload?.profileId;
		if (!profileId) return;
		socket.data.profileId = profileId;
		const count = presence.get(profileId) ?? 0;
		presence.set(profileId, count + 1);
		if (count === 0) broadcastPresence(profileId, true);
	});
	const leave = (profileId) => {
		if (!profileId) return;
		const count = presence.get(profileId);
		if (count === undefined) return;
		if (count <= 1) {
			presence.delete(profileId);
			broadcastPresence(profileId, false);
		} else {
			presence.set(profileId, count - 1);
		}
	};
	socket.on("presence:leave", (payload) => leave(payload?.profileId));
	socket.on("disconnect", () => leave(socket.data.profileId));
});

server.io = io;

server.listen(port, "0.0.0.0", () => {
	console.log(`> Discord clone ready on http://0.0.0.0:${port}`);
});