"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInForm() {
		const router = useRouter();
	const searchParams = useSearchParams();
	// Only same-site paths, so the redirect can't send users to another origin.
	const redirectTo = searchParams?.get("redirect");
	const next = redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";

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
			router.push(next);
			router.refresh();
		} catch (e: any) {
			setError(e.message || "Sign in failed");
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-4 w-full max-w-sm">
			<h1 className="text-2xl font-bold text-center">Welcome to Discord Clone</h1>
			<p className="text-zinc-500 dark:text-zinc-400 text-center">
				Pick a username — your identity on this server. Each device/browser is its own user.
			</p>
			<input
				value={name}
				onChange={(e) => setName(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && submit()}
				placeholder="Username"
				maxLength={40}
				autoFocus
				autoComplete="nickname"
				autoCapitalize="none"
				enterKeyHint="go"
				className="w-full px-4 py-3 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 outline-none focus:border-indigo-500"
			/>
			{error && <span className="text-rose-500 text-sm">{error}</span>}
			<button
				onClick={submit}
				disabled={loading}
				className="w-full bg-indigo-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-600 transition disabled:opacity-50"
			>
				{loading ? "Signing in…" : "Continue"}
			</button>
		</div>
	);
}

export default function Page() {
	return (
		<Suspense>
			<SignInForm />
		</Suspense>
	);
}
