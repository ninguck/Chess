"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinByCode() {
	const router = useRouter();
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = code.trim();
		if (!trimmed) {
			setError("Enter a game code");
			return;
		}
		router.push(`/online/${trimmed}`);
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
			<input
				type="text"
				value={code}
				onChange={(e) => { setCode(e.target.value); setError(null); }}
				placeholder="Enter game code"
				className="px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-transparent"
			/>
			<button type="submit" className="px-4 py-2 rounded bg-black text-white hover:opacity-90">Join</button>
			{error ? <span className="text-sm text-red-500">{error}</span> : null}
		</form>
	);
}
