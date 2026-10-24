import { io } from "socket.io-client";
const a = io("http://localhost:3000", { path: "/api/socket/io", transports: ["polling"] });
const b = io("http://localhost:3000", { path: "/api/socket/io", transports: ["polling"] });
b.on("typing:start", (p) => { console.log("B received typing:start:", JSON.stringify(p)); process.exit(0); });
setTimeout(() => {
  a.emit("typing:start", { chatId: "cmta8hhzw0001vcp67nbsltc1", name: "Local Tester" });
}, 1500);
setTimeout(() => process.exit(1), 6000);
