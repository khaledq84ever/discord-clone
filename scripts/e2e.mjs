// End-to-end smoke test against a running server (default http://localhost:3010).
// Drives the real HTTP API + Socket.io as two users: sign-in, profile photo/name,
// server creation, chat send/receive/reply/persist, uploads, and mobile page markup.
// Cleans up the server it creates and the files it uploads.
//
//   pnpm test:e2e                       # against localhost:3010
//   E2E_URL=https://host pnpm test:e2e  # against another deployment (no file cleanup)

import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { io } from "socket.io-client";

const BASE = (process.env.E2E_URL || "http://localhost:3010").replace(/\/$/, "");
const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "uploads");
const MOBILE_UA =
	"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const RUN = Date.now().toString(36);

// 1x1 PNG
const PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
	"base64"
);

let passed = 0;
const failures = [];
const uploaded = [];

async function step(name, fn) {
	try {
		await fn();
		passed++;
		console.log(`  ✓ ${name}`);
	} catch (error) {
		failures.push(name);
		console.log(`  ✗ ${name}\n      ${error.message}`);
	}
}

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

class Client {
	constructor(label) {
		this.label = label;
		this.cookies = new Map();
	}

	async request(url, { method = "GET", json, body, headers = {}, redirect = "manual" } = {}) {
		const res = await fetch(BASE + url, {
			method,
			redirect,
			headers: {
				...(json ? { "Content-Type": "application/json" } : {}),
				Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
				...headers,
			},
			body: json ? JSON.stringify(json) : body,
		});
		for (const cookie of res.headers.getSetCookie()) {
			const [pair] = cookie.split(";");
			const i = pair.indexOf("=");
			this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
		}
		return res;
	}

	// Follow redirects by hand so cookies are kept; returns the final response + path.
	async page(url, headers) {
		let current = url;
		for (let i = 0; i < 5; i++) {
			const res = await this.request(current, { headers });
			const location = res.headers.get("location");
			if (res.status >= 300 && res.status < 400 && location) {
				current = new URL(location, BASE).pathname;
				continue;
			}
			return { res, path: current, html: await res.text() };
		}
		throw new Error(`too many redirects from ${url}`);
	}

	async upload(endpoint, name, type, data) {
		const form = new FormData();
		form.append("file", new Blob([data], { type }), name);
		form.append("endpoint", endpoint);
		const res = await this.request("/api/upload", { method: "POST", body: form });
		const json = await res.json().catch(() => null);
		if (res.ok) uploaded.push(json[0].key);
		return { res, json };
	}

	connectSocket() {
		return new Promise((resolve, reject) => {
			const socket = io(BASE, {
				path: "/api/socket/io",
				addTrailingSlash: false,
				transports: ["websocket"],
				extraHeaders: { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ") },
			});
			const timer = setTimeout(() => reject(new Error("socket connect timeout")), 5000);
			socket.on("connect", () => {
				clearTimeout(timer);
				resolve(socket);
			});
			socket.on("connect_error", (err) => {
				clearTimeout(timer);
				reject(err);
			});
		});
	}
}

function waitForEvent(socket, event, predicate, ms = 5000) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			socket.off(event, handler);
			reject(new Error(`no "${event}" event within ${ms}ms`));
		}, ms);
		function handler(payload) {
			if (predicate(payload)) {
				clearTimeout(timer);
				socket.off(event, handler);
				resolve(payload);
			}
		}
		socket.on(event, handler);
	});
}

const alice = new Client("alice");
const bob = new Client("bob");
const state = {};

console.log(`E2E against ${BASE} (run ${RUN})\n`);

console.log("Pages & mobile");
await step("sign-in page renders with mobile viewport meta", async () => {
	const { res, html } = await alice.page("/sign-in", { "User-Agent": MOBILE_UA });
	assert(res.status === 200, `status ${res.status}`);
	const meta = html.match(/<meta name="viewport" content="([^"]+)"/)?.[1] ?? "";
	for (const part of ["width=device-width", "initial-scale=1", "viewport-fit=cover", "interactive-widget=resizes-content"]) {
		assert(meta.includes(part), `viewport meta missing ${part}: "${meta}"`);
	}
	assert(/<meta name="theme-color"/.test(html), "theme-color meta missing");
});

await step("logged-out user is redirected to sign-in", async () => {
	const { path: landed } = await new Client("anon").page("/");
	assert(landed === "/sign-in", `landed on ${landed}`);
});

console.log("\nSign-in & profile");
await step("alice and bob sign in", async () => {
	for (const [client, name] of [
		[alice, `Alice ${RUN}`],
		[bob, `Bob ${RUN}`],
	]) {
		const res = await client.request("/api/local-auth", { method: "POST", json: { name } });
		assert(res.ok, `${client.label} sign-in ${res.status}`);
		assert(client.cookies.has("local_user"), `${client.label} got no cookie`);
	}
});

await step("home page after sign-in shows welcome + create-server dialog (no debug panel)", async () => {
	const { res, html } = await alice.page("/", { "User-Agent": MOBILE_UA });
	assert(res.status === 200, `status ${res.status}`);
	assert(/<h1[^>]*>Welcome, (<!-- -->)?Alice /.test(html), "welcome heading missing");
	// The create-server dialog itself renders client-side in a portal, so check the page copy.
	assert(html.includes("Create your first server"), "create-server prompt missing");
	assert(!html.includes("sess_local_tester") && !html.includes("user.imageUrl"), "debug panel still rendered");
});

await step("upload rejects non-image for avatar/server photo", async () => {
	const { res } = await alice.upload("serverImage", "notes.txt", "text/plain", Buffer.from("hello"));
	assert(res.status === 415, `expected 415, got ${res.status}`);
});

await step("upload rejects files over 8MB", async () => {
	const { res } = await alice.upload("messageFile", "big.png", "image/png", Buffer.alloc(8 * 1024 * 1024 + 1));
	assert(res.status === 413, `expected 413, got ${res.status}`);
});

await step("photo upload is served immediately (no restart needed)", async () => {
	const { res, json } = await alice.upload("serverImage", "me.png", "image/png", PNG);
	assert(res.ok, `upload ${res.status}`);
	state.avatarUrl = json[0].url;
	const img = await fetch(BASE + state.avatarUrl);
	assert(img.status === 200, `GET ${state.avatarUrl} → ${img.status}`);
	assert(img.headers.get("content-type") === "image/png", `content-type ${img.headers.get("content-type")}`);
	assert(img.headers.get("x-content-type-options") === "nosniff", "missing nosniff");
});

await step("alice sets her own profile photo and display name", async () => {
	const res = await alice.request("/api/profile", {
		method: "PATCH",
		json: { name: `Alice R ${RUN}`, imageUrl: state.avatarUrl },
	});
	assert(res.ok, `PATCH ${res.status}`);
	const profile = await res.json();
	assert(profile.name === `Alice R ${RUN}` && profile.imageUrl === state.avatarUrl, "profile not updated");
	// The cookie value is URI-encoded twice (route + cookie serializer).
	const cookie = decodeURIComponent(decodeURIComponent(alice.cookies.get("local_user")));
	assert(cookie.includes(`Alice R ${RUN}`), "cookie name not updated");
});

await step("profile rejects foreign image URLs and empty names", async () => {
	const bad = await alice.request("/api/profile", { method: "PATCH", json: { imageUrl: "https://evil.example/x.png" } });
	assert(bad.status === 400, `foreign url → ${bad.status}`);
	const empty = await alice.request("/api/profile", { method: "PATCH", json: { name: "  " } });
	assert(empty.status === 400, `empty name → ${empty.status}`);
});

console.log("\nServer");
await step("alice creates a server without a photo", async () => {
	const res = await alice.request("/api/servers", { method: "POST", json: { name: `E2E ${RUN}`, imageUrl: "" } });
	assert(res.ok, `create ${res.status}`);
	state.server = await res.json();
	assert(state.server.imageUrl === null, `imageUrl should be null, got ${JSON.stringify(state.server.imageUrl)}`);
});

await step("server page redirects to #general and renders on mobile", async () => {
	const { res, path: landed, html } = await alice.page(`/servers/${state.server.id}`, { "User-Agent": MOBILE_UA });
	assert(res.status === 200, `status ${res.status}`);
	const match = landed.match(/\/channels\/([^/]+)$/);
	assert(match, `landed on ${landed}`);
	state.channelId = match[1];
	assert(html.includes('aria-label="Open navigation"'), "mobile nav toggle missing");
	assert(html.includes('aria-label="Show members"'), "mobile members toggle missing");
	assert(html.includes('aria-label="User settings"'), "user settings button missing");
	assert(html.includes(`Alice R ${RUN}`) || html.includes(state.avatarUrl), "alice's profile not shown");
});

await step("logged-out invite link goes to sign-in and keeps the invite", async () => {
	const res = await new Client("anon").request(`/invite/${state.server.inviteCode}`);
	const location = res.headers.get("location") ?? "";
	assert(res.status >= 300 && res.status < 400, `status ${res.status}`);
	assert(
		decodeURIComponent(location).includes(`/sign-in?redirect=/invite/${state.server.inviteCode}`),
		`location ${location}`
	);
});

await step("bob joins through the invite link", async () => {
	const { path: landed } = await bob.page(`/invite/${state.server.inviteCode}`);
	assert(landed.startsWith(`/servers/${state.server.id}`), `landed on ${landed}`);
});

console.log("\nChat");
const query = () => `channelId=${state.channelId}&serverId=${state.server.id}`;

await step("bob receives alice's message live over the socket", async () => {
	const socket = await bob.connectSocket();
	try {
		const content = `hello from alice ${RUN}`;
		const live = waitForEvent(socket, `chat:${state.channelId}:messages`, (m) => m.content === content);
		const res = await alice.request(`/api/socket/messages?${query()}`, { method: "POST", json: { content } });
		assert(res.status === 201, `send ${res.status}`);
		state.message = await res.json();
		const received = await live;
		assert(received.member.profile.name === `Alice R ${RUN}`, `sender name ${received.member.profile.name}`);
		assert(received.member.profile.imageUrl === state.avatarUrl, "sender photo missing on message");
	} finally {
		socket.close();
	}
});

await step("bob replies; reply is linked to alice's message", async () => {
	const res = await bob.request(`/api/socket/messages?${query()}`, {
		method: "POST",
		json: { content: `**reply** from bob ${RUN}`, replyToId: state.message.id },
	});
	assert(res.status === 201, `send ${res.status}`);
	const reply = await res.json();
	assert(reply.replyToId === state.message.id, "replyToId not saved");
	assert(reply.member.profile.name === `Bob ${RUN}`, "bob's own name not on his message");
	state.bobMemberId = reply.member.id;
});

await step("messages are saved on the server (fresh fetch, newest first)", async () => {
	const res = await bob.request(`/api/messages?channelId=${state.channelId}`);
	assert(res.ok, `GET ${res.status}`);
	const { items } = await res.json();
	assert(items.length >= 2, `expected ≥2 messages, got ${items.length}`);
	assert(items[0].content === `**reply** from bob ${RUN}`, `newest first expected, got "${items[0].content}"`);
	assert(items[1].content === `hello from alice ${RUN}`, `second item "${items[1].content}"`);
});

await step("edit is broadcast as an update event", async () => {
	const socket = await bob.connectSocket();
	try {
		const live = waitForEvent(socket, `chat:${state.channelId}:messages:update`, (m) => m.id === state.message.id);
		const res = await alice.request(`/api/socket/messages/${state.message.id}?${query()}`, {
			method: "PATCH",
			json: { content: `edited ${RUN}` },
		});
		assert(res.ok, `PATCH ${res.status}`);
		const updated = await live;
		assert(updated.content === `edited ${RUN}`, `content "${updated.content}"`);
	} finally {
		socket.close();
	}
});

await step("outsider cannot read the channel's messages", async () => {
	const eve = new Client("eve");
	await eve.request("/api/local-auth", { method: "POST", json: { name: `Eve ${RUN}` } });
	await eve.page("/"); // creates eve's profile
	const res = await eve.request(`/api/socket/messages?${query()}`, { method: "POST", json: { content: "intrude" } });
	assert(res.status === 404, `outsider send → ${res.status}`);
});

console.log("\nVoice / video");
await step("voice token requires sign-in", async () => {
	const res = await new Client("anon").request(`/api/get-participant-token?room=${state.channelId}`);
	assert(res.status === 401, `expected 401, got ${res.status}`);
});

await step("voice token is refused for rooms you're not in", async () => {
	const eve = new Client("eve2");
	await eve.request("/api/local-auth", { method: "POST", json: { name: `Eve2 ${RUN}` } });
	const res = await eve.request(`/api/get-participant-token?room=${state.channelId}`);
	assert(res.status === 404, `expected 404, got ${res.status}`);
});

await step("member gets a voice token bound to their own profile", async () => {
	const res = await bob.request(`/api/get-participant-token?room=${state.channelId}`);
	assert(res.ok, `status ${res.status}`);
	const { token } = await res.json();
	const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
	assert(claims.name === `Bob ${RUN}`, `name claim ${claims.name}`);
	assert(claims.sub && !claims.sub.includes(" "), `identity should be the profile id, got ${claims.sub}`);
	assert(claims.video?.room === state.channelId && claims.video?.roomJoin, "room grant missing");
});

await step("LiveKit signaling is reachable through the app at /livekit", async () => {
	const res = await fetch(`${BASE}/livekit/`);
	assert(res.ok && (await res.text()).trim() === "OK", `status ${res.status}`);
});

console.log("\nBan enforcement");
await step("admin bans a member", async () => {
	assert(state.bobMemberId, "bob's member id was not captured");
	const res = await alice.request(`/api/members/${state.bobMemberId}?serverId=${state.server.id}`, {
		method: "PATCH",
		json: { banned: true },
	});
	assert(res.ok, `ban PATCH ${res.status}`);
	const server = await res.json();
	const bobMember = server.members.find((m) => m.id === state.bobMemberId);
	assert(bobMember?.banned === true, "member not marked banned in response");
});

await step("banned member cannot send messages", async () => {
	const res = await bob.request(`/api/socket/messages?${query()}`, { method: "POST", json: { content: `banned ${RUN}` } });
	assert(res.status === 403, `banned send → ${res.status}`);
});

await step("banned member cannot read the channel's messages", async () => {
	const res = await bob.request(`/api/messages?channelId=${state.channelId}`);
	assert(res.status === 403, `banned read → ${res.status}`);
});

await step("banned member is denied a voice token", async () => {
	const res = await bob.request(`/api/get-participant-token?room=${state.channelId}`);
	assert(res.status === 404, `banned voice → ${res.status}`);
});

await step("banned member cannot open the server page", async () => {
	const { path: landed } = await bob.page(`/servers/${state.server.id}`);
	assert(!landed.startsWith(`/servers/${state.server.id}`), `banned member landed on ${landed}`);
});

await step("banned member cannot rejoin via the invite link", async () => {
	const { path: landed } = await bob.page(`/invite/${state.server.inviteCode}`);
	assert(!landed.startsWith("/servers/"), `banned rejoin landed on ${landed}`);
	// Confirm the invite didn't silently re-add bob as a fresh, unbanned member.
	const res = await bob.request(`/api/socket/messages?${query()}`, { method: "POST", json: { content: `rejoin ${RUN}` } });
	assert(res.status === 403, `still-banned send → ${res.status}`);
});

await step("unban restores access", async () => {
	const res = await alice.request(`/api/members/${state.bobMemberId}?serverId=${state.server.id}`, {
		method: "PATCH",
		json: { banned: false },
	});
	assert(res.ok, `unban PATCH ${res.status}`);
	const send = await bob.request(`/api/socket/messages?${query()}`, { method: "POST", json: { content: `unbanned ${RUN}` } });
	assert(send.status === 201, `unbanned send → ${send.status}`);
});

console.log("\nDirect message reactions");
await step("a member can react to a direct message (was 405)", async () => {
	assert(state.bobMemberId, "bob's member id was not captured");
	// Open the DM with bob as alice so the conversation is created, and lift its id.
	const { html } = await alice.page(`/servers/${state.server.id}/conversations/${state.bobMemberId}`);
	const cid = html.match(/conversationId[\\":\s]+?(c[a-z0-9]{20,})/i)?.[1];
	assert(cid, "could not find conversationId on the conversation page");
	state.conversationId = cid;

	const sent = await alice.request(`/api/socket/direct-messages?conversationId=${cid}`, {
		method: "POST",
		json: { content: `dm hello ${RUN}` },
	});
	assert(sent.status === 201, `DM send → ${sent.status}`);
	const dm = await sent.json();

	// Bob is the OTHER member, not the message owner — this path used to 405.
	const react = await bob.request(`/api/socket/direct-messages/${dm.id}?conversationId=${cid}`, {
		method: "PUT",
		json: { emoji: "🔥" },
	});
	assert(react.status === 200, `DM react → ${react.status}`);
	const reacted = await react.json();
	assert(
		reacted.reactions?.some((r) => r.emoji === "🔥" && r.member?.profile?.name === `Bob ${RUN}`),
		"bob's DM reaction missing from response"
	);
});

await step("direct message reaction persists and toggles off", async () => {
	const cid = state.conversationId;
	const list = await bob.request(`/api/direct-messages?conversationId=${cid}`);
	assert(list.ok, `DM list → ${list.status}`);
	const { items } = await list.json();
	const dm = items.find((m) => m.content === `dm hello ${RUN}`);
	assert(dm?.reactions?.some((r) => r.emoji === "🔥"), "DM reaction not persisted on fresh fetch");

	const off = await bob.request(`/api/socket/direct-messages/${dm.id}?conversationId=${cid}`, {
		method: "PUT",
		json: { emoji: "🔥" },
	});
	assert(off.status === 200, `DM unreact → ${off.status}`);
	const after = await off.json();
	assert(!after.reactions?.some((r) => r.emoji === "🔥"), "DM reaction not removed on toggle");
});

console.log("\nCleanup");
await step("delete the test server", async () => {
	if (!state.server) return;
	const res = await alice.request(`/api/servers/${state.server.id}`, { method: "DELETE" });
	assert(res.ok, `DELETE ${res.status}`);
});
if (BASE.includes("localhost") || BASE.includes("127.0.0.1")) {
	const existing = new Set(await readdir(UPLOAD_DIR).catch(() => []));
	for (const key of uploaded) if (existing.has(key)) await unlink(path.join(UPLOAD_DIR, key));
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
	console.log(`Failed: ${failures.join("; ")}`);
	process.exit(1);
}
process.exit(0);
