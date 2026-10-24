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

export function UploadDropzone({
	endpoint,
	onClientUploadComplete,
	onUploadError,
	onUploadBegin,
	className,
}: UploadDropzoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);

	const handleFiles = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const file = files[0];
		onUploadBegin?.(file.name);
		setUploading(true);
		try {
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
				accept={endpoint === "serverImage" ? "image/*" : "image/*,.pdf"}
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
					<span className="mt-2 text-sm font-semibold">Click to upload</span>
					<span className="text-xs text-zinc-500 dark:text-zinc-400">
						{endpoint === "serverImage" ? "Images up to 4MB" : "Images or PDF"}
					</span>
				</>
			)}
		</div>
	);
}

export function UploadButton(props: UploadDropzoneProps) {
	return <UploadDropzone {...props} />;
}