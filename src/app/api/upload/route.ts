import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024;

// Keep in sync with UPLOAD_TYPES in server.mjs, which serves these files.
const IMAGE_TYPES: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/gif": ".gif",
	"image/webp": ".webp",
	"image/avif": ".avif",
};
const FILE_TYPES: Record<string, string> = { ...IMAGE_TYPES, "application/pdf": ".pdf" };

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file");
		const endpoint = formData.get("endpoint");

		if (!(file instanceof File)) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}
		if (file.size > MAX_BYTES) {
			return NextResponse.json({ error: "File is larger than 8MB" }, { status: 413 });
		}

		const allowed = endpoint === "serverImage" ? IMAGE_TYPES : FILE_TYPES;
		const ext = allowed[file.type];
		if (!ext) {
			return NextResponse.json(
				{ error: endpoint === "serverImage" ? "Please choose a JPG, PNG, GIF or WebP image" : "Unsupported file type" },
				{ status: 415 }
			);
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const storedName = `${crypto.randomUUID()}${ext}`;

		await mkdir(UPLOAD_DIR, { recursive: true });
		await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

		return NextResponse.json([
			{
				name: file.name,
				size: file.size,
				key: storedName,
				url: `/uploads/${storedName}`,
			},
		]);
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json({ error: "Upload failed" }, { status: 500 });
	}
}
