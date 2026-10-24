import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file");

		if (!(file instanceof File)) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const ext = path.extname(file.name) || "";
		const id = crypto.randomUUID();
		const storedName = `${id}${ext}`;

		await mkdir(UPLOAD_DIR, { recursive: true });
		await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

		const url = `/uploads/${storedName}`;

		return NextResponse.json([
			{
				name: file.name,
				size: file.size,
				key: storedName,
				url,
			},
		]);
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json({ error: "Upload failed" }, { status: 500 });
	}
}
