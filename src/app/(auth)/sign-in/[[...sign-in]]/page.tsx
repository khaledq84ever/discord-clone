"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const submit = async () => {
		if (!name.trim()) {
			setError("Enter a name");
			return;
		}
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/local-auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data?.error || "Sign in failed");
			}
			router.push("/");
			router.refresh();
		} catch (e: any) {
			setError(e.message || "Sign in failed");
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-4 w-full max-w-sm">
			<div className="text-2xl font-bold">Welcome to Discord Clone</div>
			<p className="text-zinc-500 dark:text-zinc-400 text-center">
				Pick a username — your identity on this server. Each device/browser is its own user.
			</p>
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && submit()}
				placeholder="Username"
				maxLength={40}
				className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 outline-none focus:border-indigo-500"
			/>
			{error && <span className="text-rose-500 text-sm">{error}</span>}
			<button
				onClick={submit}
				disabled={loading}
				className="w-full bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-600 transition disabled:opacity-50"
			>
				{loading ? "Signing in…" : "Continue"}
			</button>
		</div>
	);
}