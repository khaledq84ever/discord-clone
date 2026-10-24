import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);

const app = next({ dev: process.env.NODE_ENV !== "production", dir: __dirname, port, hostname: "0.0.0.0" });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((req, res) => {
	handle(req, res);
});

const io = new SocketIOServer(server, {
	path: "/api/socket/io",
	addTrailingSlash: false,
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