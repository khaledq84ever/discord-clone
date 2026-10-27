"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";

export interface UploadFileResponse {
	name: string;
	size: number;
	key: string;
	url: string;
}

interface UploadDropzoneProps {
	endpoint: "serverImage" | "messageFile";
	onClientUploadComplete: (res: UploadFileResponse[]) => void;
	onUploadError?: (error: Error) => void;
	onUploadBegin?: (name: string) => void;
	className?: string;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const RESIZABLE = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// Phone photos are often 3–12MB and 4000px+; scale them down before upload so they
// stay under the limit and load fast. GIFs (animation) and PDFs are sent as-is, and
// if the browser can't decode the image (e.g. HEIC outside Safari) the original is sent.
async function shrinkImage(file: File, maxSide: number): Promise<File> {
	if (!RESIZABLE.includes(file.type)) return file;
	try {
		const bitmap = await createImageBitmap(file);
		const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
		if (scale === 1 && file.size < 1024 * 1024 && file.type !== "image/heic" && file.type !== "image/heif") {
			bitmap.close();
			return file;
		}
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		const type = file.type === "image/png" ? "image/png" : "image/jpeg";
		const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
		if (!blob || blob.size >= file.size) return file;
		const name = file.name.replace(/\.[^.]+$/, "") + (type === "image/png" ? ".png" : ".jpg");
		return new File([blob], name, { type });
	} catch {
		return file;
	}
}

export function UploadDropzone({
	endpoint,
	onClientUploadComplete,
	onUploadError,
	onUploadBegin,
	className,
}: UploadDropzoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");

	const handleFiles = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		onUploadBegin?.(files[0].name);
		setUploading(true);
		setError("");
		try {
			const file = await shrinkImage(files[0], endpoint === "serverImage" ? 512 : 1600);
			if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is larger than 8MB");
			const formData = new FormData();
			formData.append("file", file);
			formData.append("endpoint", endpoint);
			const resp = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});
			if (!resp.ok) {
				const data = await resp.json().catch(() => ({}));
				throw new Error(data?.error || `Upload failed (${resp.status})`);
			}
			const data = (await resp.json()) as UploadFileResponse[];
			onClientUploadComplete(data);
		} catch (error) {
			setError((error as Error).message || "Upload failed");
			onUploadError?.(error as Error);
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	return (
		<div
			onClick={() => !uploading && inputRef.current?.click()}
			className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 p-6 text-center transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${className ?? ""}`}
		>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				accept={endpoint === "serverImage" ? "image/*" : "image/*,application/pdf"}
				onChange={(e) => handleFiles(e.target.files)}
			/>
			{uploading ? (
				<>
					<Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
					<span className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Uploading...</span>
				</>
			) : (
				<>
					<UploadCloud className="h-8 w-8 text-zinc-500" />
					<span className="mt-2 text-sm font-semibold">Tap to choose a photo</span>
					<span className="text-xs text-zinc-500 dark:text-zinc-400">
						{endpoint === "serverImage" ? "JPG, PNG, GIF or WebP" : "Images or PDF, up to 8MB"}
					</span>
					{error && <span className="mt-2 text-xs font-medium text-rose-500">{error}</span>}
				</>
			)}
		</div>
	);
}

export function UploadButton(props: UploadDropzoneProps) {
	return <UploadDropzone {...props} />;
}