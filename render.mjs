import sharp from "/home/dev/discord-clone/node_modules/.pnpm/sharp@0.35.3_@types+node@26.2.0/node_modules/sharp/lib/index.js";
import { readFileSync } from "node:fs";
const svg = readFileSync("/tmp/opencode/icons/mark.svg");
for (const [name, size] of [["icon.png",512],["apple-icon.png",180],["android-icon.png",192]]) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile("/tmp/opencode/icons/" + name);
  console.log("made", name, size);
}
await sharp(svg, { density: 384 }).resize(64, 64).png().toFile("/tmp/opencode/icons/favicon-64.png");
console.log("done");
