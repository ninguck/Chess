"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import type { Square } from "chess.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ServerState = {
	gameId: string;
	fen: string;
	turn: "w" | "b";
	status: string;
	version: number;
	updatedAt?: number;
	seat?: 'w' | 'b';
	seatsAssigned?: boolean;
};

async function fetchState(id: string, token: string | null, etagRef?: React.MutableRefObject<string | null>): Promise<{ state: ServerState | null; etag: string | null; status: number }> {
	const headers: Record<string, string> = {};
	if (etagRef?.current) headers["If-None-Match"] = etagRef.current;
	const qs = token ? `?playerToken=${encodeURIComponent(token)}` : "";
	const res = await fetch(`/api/games/${id}${qs}`, { headers });
	if (res.status === 304) return { state: null, etag: etagRef?.current ?? null, status: 304 };
	if (!res.ok) return { state: null, etag: null, status: res.status };
	const etag = res.headers.get("ETag");
	const data = (await res.json()) as ServerState;
	return { state: data, etag, status: res.status };
}

async function postMove(id: string, body: any) {
	const res = await fetch(`/api/games/${id}/move`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
	return res;
}

function getPlayerToken(): string {
	try {
		const key = `chess.playerToken`;
		const existing = localStorage.getItem(key);
		if (existing) return existing;
		const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
		localStorage.setItem(key, token);
		return token;
	} catch {
		return Math.random().toString(36).slice(2);
	}
}

export default function OnlineGamePage({ params }: { params: Promise<{ id: string }> }) {
	const { id: gameId } = use(params);
	const [state, setState] = useState<ServerState | null>(null);
	const [error, setError] = useState<string | null>(null);
	const playerTokenRef = useRef<string>(getPlayerToken());
	const [orientation] = useState<"white" | "black">("white");
	const etagRef = useRef<string | null>(null);
	const pollingRef = useRef<number | null>(null);

	const canDrag = useMemo(() => {
		if (!state) return false;
		// Before any seat is assigned, allow dragging so players can take seats; server will bind on first move
		if (state.seatsAssigned === false) return true;
		// After seats are assigned, only the caller's seat can move on their turn
		if (!state.seat) return false;
		return state.turn === state.seat;
	}, [state]);

	const load = useCallback(async () => {
		const { state: s, etag, status } = await fetchState(gameId, playerTokenRef.current, etagRef);
		if (status === 404) { setError("Game not found"); return; }
		if (status === 200 && s) { setState(s); if (etag) etagRef.current = etag; }
	}, [gameId]);

	useEffect(() => {
		load();
		const id = window.setInterval(() => load(), 1500);
		pollingRef.current = id;
		return () => { if (pollingRef.current) window.clearInterval(pollingRef.current); };
	}, [load]);

	const onDrop = useCallback(async (from: Square, to: Square) => {
		if (!state) return false;
		const res = await postMove(gameId, { expectedVersion: state.version, from, to, playerToken: playerTokenRef.current });
		if (res.status === 200) { await load(); return true; }
		if (res.status === 409) { await load(); }
		return false;
	}, [gameId, state, load]);

	const isSpectator = Boolean(state && state.seatsAssigned !== false && !state.seat);

	return (
		<div className="min-h-screen p-6 sm:p-10">
			<div className="max-w-7xl mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>Online game</CardTitle>
						<CardDescription>Share this link with your opponent to play.</CardDescription>
					</CardHeader>
					<CardContent>
						{error ? <div className="text-red-500">{error}</div> : null}
						{isSpectator ? <div className="mb-3 text-amber-500 text-sm">You are a spectator. You can watch but not interact.</div> : null}
						{state && state.seatsAssigned === false ? <div className="mb-3 text-slate-500 text-sm">Waiting for players to take seats… Make the first move to claim White; the next unique player claims Black.</div> : null}
						{state ? (
							<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
								<div className="w-full max-w-[min(92vw,720px)] mx-auto">
									<Chessboard
										options={{
											id: "online-board",
											position: state.fen,
											boardOrientation: orientation,
											allowDragging: canDrag,
											onPieceDrop: ({ sourceSquare, targetSquare }) => onDrop(sourceSquare as Square, targetSquare as Square),
										}}
									/>
								</div>
								<aside className="flex flex-col gap-3">
									<div className="text-sm">You are: {state.seat ?? 'Spectator'}</div>
									<div className="text-sm">Turn: {state.turn === "w" ? "White" : "Black"} • Version: {state.version}</div>
									<div className="text-sm">Game ID: {state.gameId}</div>
								</aside>
							</div>
						) : (
							<div>Loading…</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
