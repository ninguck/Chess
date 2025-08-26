"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function getDisplayName(): string | null {
	try { return localStorage.getItem("chess.displayName"); } catch { return null; }
}

export default function StartOnlineButton() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onClick() {
		const name = getDisplayName();
		if (!name || name.trim().length < 2) {
			setError("Please enter your name above first.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/games", { method: "POST" });
			if (!res.ok) throw new Error("Failed to create game");
			const data = (await res.json()) as { gameId: string };
			router.push(`/online/${data.gameId}?displayName=${encodeURIComponent(name.trim())}`);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : "Failed to create game";
			setError(msg);
			setLoading(false);
		}
	}

	return (
		<div className="flex items-center gap-3">
			<button onClick={onClick} disabled={loading} className="px-4 py-2 rounded bg-black text-white hover:opacity-90 disabled:opacity-60">
				{loading ? "Creating…" : "Create online game"}
			</button>
			{error ? <span className="text-sm text-red-500">{error}</span> : null}
		</div>
	);
}
