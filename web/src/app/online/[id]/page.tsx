"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
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
	seats?: { w?: { name: string }, b?: { name: string } };
	spectators?: { name: string }[];
	moves?: { from: Square; to: Square }[];
};

// Helpers for square arithmetic & path highlights (matching local)
const files = ["a","b","c","d","e","f","g","h"] as const;
function toSquare(file: number, rank: number): Square | null {
	if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
	return `${files[file]}${rank + 1}` as Square;
}
function sign(n: number) { return n === 0 ? 0 : n > 0 ? 1 : -1; }
function computePathSquares(piece: string, from: Square, to: Square): Square[] {
	const aFile = files.indexOf(from[0] as typeof files[number]);
	const aRank = Number(from[1]) - 1;
	const bFile = files.indexOf(to[0] as typeof files[number]);
	const bRank = Number(to[1]) - 1;
	const dx = bFile - aFile; const dy = bRank - aRank; const path: Square[] = [];
	switch (piece) {
		case "n": {
			if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
				const v = sign(dy), h = sign(dx);
				const s1 = toSquare(aFile, aRank + v); if (s1) path.push(s1);
				const s2 = toSquare(aFile, aRank + 2*v); if (s2) path.push(s2);
				const s3 = toSquare(aFile + h, aRank + 2*v); if (s3) path.push(s3);
			} else if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
				const h = sign(dx), v = sign(dy);
				const s1 = toSquare(aFile + h, aRank); if (s1) path.push(s1);
				const s2 = toSquare(aFile + 2*h, aRank); if (s2) path.push(s2);
				const s3 = toSquare(aFile + 2*h, aRank + v); if (s3) path.push(s3);
			}
			break;
		}
		case "b": {
			const ux = sign(dx), uy = sign(dy); let f = aFile + ux, r = aRank + uy;
			while (f !== bFile && r !== bRank) { const s = toSquare(f, r); if (s) path.push(s); f += ux; r += uy; }
			const t = toSquare(bFile, bRank); if (t) path.push(t); break;
		}
		case "r": {
			const ux = sign(dx), uy = sign(dy); let f = aFile + ux, r = aRank + uy;
			while (f !== bFile || r !== bRank) { const s = toSquare(f, r); if (s) path.push(s); f += ux; r += uy; if (ux !== 0 && uy !== 0) break; }
			const t = toSquare(bFile, bRank); if (t) path.push(t); break;
		}
		case "q": {
			const ux = sign(dx), uy = sign(dy); let f = aFile + ux, r = aRank + uy;
			while (f !== bFile || r !== bRank) { const s = toSquare(f, r); if (s) path.push(s); f += ux; r += uy; }
			const t = toSquare(bFile, bRank); if (t) path.push(t); break;
		}
		case "p": {
			const ux = sign(dx), uy = sign(dy);
			if (ux === 0) { let r = aRank + uy; while (r !== bRank + uy) { const s = toSquare(aFile, r); if (s) path.push(s); r += uy; } }
			else { const t = toSquare(bFile, bRank); if (t) path.push(t); }
			break;
		}
		case "k": { const t = toSquare(bFile, bRank); if (t) path.push(t); break; }
	}
	return path;
}

function parseFenBoard(fen: string) {
	const board = fen.split(" ")[0];
	const rows = board.split("/");
	const map = new Map<string, string>(); // square -> piece (like 'wP','bq')
	for (let r = 0; r < 8; r++) {
		let file = 0;
		for (const ch of rows[7 - r]) { // fen starts rank 8; we want a1 at bottom
			if (/[1-8]/.test(ch)) { file += Number(ch); }
			else {
				const square = `${files[file]}${r+1}`;
				const color = ch === ch.toLowerCase() ? 'b' : 'w';
				map.set(square, color + ch.toLowerCase());
				file += 1;
			}
		}
	}
	return map;
}

function diffLastMove(prevFen: string, nextFen: string, moverColor: 'w' | 'b'): { from?: Square; to?: Square } {
	try {
		const a = parseFenBoard(prevFen); const b = parseFenBoard(nextFen);
		let from: Square | undefined; let to: Square | undefined;
		for (const sq of a.keys()) { if (!b.has(sq) && (a.get(sq)?.startsWith(moverColor))) { from = sq as Square; break; } }
		if (!from) {
			// fallback: find any square that changed from moverColor piece
			for (const [sq, piece] of a) { if (piece.startsWith(moverColor) && a.get(sq) !== b.get(sq)) { from = sq as Square; break; } }
		}
		for (const [sq, piece] of b) { if (piece.startsWith(moverColor) && a.get(sq) !== b.get(sq)) { to = sq as Square; break; } }
		return { from, to };
	} catch { return {}; }
}

async function fetchState(id: string, token: string | null, name: string | null, etagRef?: React.MutableRefObject<string | null>): Promise<{ state: ServerState | null; etag: string | null; status: number }> {
	const headers: Record<string, string> = {};
	if (etagRef?.current) headers["If-None-Match"] = etagRef.current;
	const params = new URLSearchParams();
	if (token) params.set("playerToken", token);
	if (name) params.set("displayName", name);
	const qs = params.toString() ? `?${params.toString()}` : "";
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

function getDisplayName(): string {
	try {
		const key = `chess.displayName`;
		const existing = localStorage.getItem(key);
		if (existing) return existing;
		const generated = `Player-${Math.random().toString(36).slice(2,6)}`;
		localStorage.setItem(key, generated);
		return generated;
	} catch { return `Player-${Math.random().toString(36).slice(2,6)}`; }
}

export default function OnlineGamePage({ params }: { params: Promise<{ id: string }> }) {
	const { id: gameId } = use(params);
	const [state, setState] = useState<ServerState | null>(null);
	const [error, setError] = useState<string | null>(null);
	const playerTokenRef = useRef<string>(getPlayerToken());
	const displayName = getDisplayName();
	const [orientation] = useState<"white" | "black">("white");
	const etagRef = useRef<string | null>(null);
	const pollingRef = useRef<number | null>(null);
	const prevFenRef = useRef<string | null>(null);
	const prevVersionRef = useRef<number | null>(null);

	// Selection + highlights
	const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
	const [legalTargets, setLegalTargets] = useState<Square[]>([]);
	const [lastMove, setLastMove] = useState<{ from?: Square; to?: Square } | null>(null);
	const [moves, setMoves] = useState<string[]>([]);

	const canDrag = useMemo(() => {
		if (!state) return false;
		if (state.seatsAssigned === false) return true;
		if (!state.seat) return false;
		return state.turn === state.seat;
	}, [state]);

	const load = useCallback(async () => {
		const { state: s, etag, status } = await fetchState(gameId, playerTokenRef.current, displayName, etagRef);
		if (status === 404) { setError("Game not found"); return; }
		if (status === 200 && s) {
			if (prevFenRef.current && prevVersionRef.current !== null && prevVersionRef.current < s.version) {
				const mover: 'w' | 'b' = s.turn === 'w' ? 'b' : 'w';
				const diff = diffLastMove(prevFenRef.current, s.fen, mover);
				setLastMove(diff);
			}
			// Reconstruct a Chess instance to derive PGN/move list
			try {
				const ch = new Chess();
				// naive reconstruction: if from start position, derive from SAN list via difference
				// As we only have FEN snapshots, we will track lastMove and append to moves list for now
				if (lastMove?.from && lastMove?.to) {
					setMoves((prev) => [...prev, `${lastMove.from}-${lastMove.to}`]);
				}
			} catch {}
			prevFenRef.current = s.fen; prevVersionRef.current = s.version;
			setState(s); if (etag) etagRef.current = etag;
		}
	}, [gameId, displayName, lastMove]);

	useEffect(() => {
		load();
		const id = window.setInterval(() => load(), 1500);
		pollingRef.current = id;
		return () => { if (pollingRef.current) window.clearInterval(pollingRef.current); };
	}, [load]);

	const onDrop = useCallback(async (from: Square, to: Square) => {
		if (!state) return false;
		const res = await postMove(gameId, { expectedVersion: state.version, from, to, playerToken: playerTokenRef.current, displayName });
		if (res.status === 200) { await load(); return true; }
		if (res.status === 409) { await load(); }
		return false;
	}, [gameId, state, load, displayName]);

	// Selection on click to show legal targets
	const onSquareClick = useCallback((square: Square) => {
		if (!state) return;
		// Build legal moves from current FEN using chess.js
		try {
			const ch = new Chess(state.fen);
			if (selectedSquare && selectedSquare === square) { setSelectedSquare(null); setLegalTargets([]); return; }
			setSelectedSquare(square);
			const ms = ch.moves({ square, verbose: true }) as unknown as Array<{ to: Square }>;
			setLegalTargets(ms.map((m) => m.to));
		} catch { setSelectedSquare(null); setLegalTargets([]); }
	}, [state, selectedSquare]);

	// Build square styles: last move + selection path
	const squareStyles: Record<string, React.CSSProperties> = useMemo(() => {
		const styles: Record<string, React.CSSProperties> = {};
		if (lastMove?.from) { styles[lastMove.from] = { outline: "3px solid #f59e0b", outlineOffset: -3 }; }
		if (lastMove?.to) { styles[lastMove.to] = { outline: "3px solid #f59e0b", outlineOffset: -3 }; }
		if (selectedSquare) {
			styles[selectedSquare] = { outline: "3px solid #3b82f6", outlineOffset: -3 };
			for (const t of legalTargets) {
				styles[t] = { ...(styles[t] || {}), backgroundImage: "radial-gradient(circle at center, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0.45) 18%, rgba(0,0,0,0) 19%)", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "22% 22%" };
			}
		}
		return styles;
	}, [lastMove, selectedSquare, legalTargets]);

	const isSpectator = state && state.seatsAssigned !== false && !state.seat;

	const statusClass = useMemo(() => {
		const st = state?.status ?? "playing";
		return st === "checkmate"
			? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
			: st === "check"
			? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
			: st === "stalemate" || st === "draw"
			? "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200"
			: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
	}, [state?.status]);

	function copyLink() { try { navigator.clipboard.writeText(window.location.href); } catch {} }

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
						<div className="mb-3 text-sm">Hi {displayName}!</div>
						{isSpectator ? <div className="mb-3 text-amber-500 text-sm">You are a spectator. You can watch but not interact.</div> : null}
						{state && state.seatsAssigned === false ? <div className="mb-3 text-slate-500 text-sm">Waiting for players… First two unique names/tokens take seats when they join.</div> : null}
						{state ? (
							<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
								<div className="w-full max-w-[min(92vw,720px)] mx-auto">
									<Chessboard
										options={{
											id: "online-board",
											position: state.fen,
											boardOrientation: orientation,
											allowDragging: canDrag,
											onSquareClick: ({ square }) => onSquareClick(square as Square),
											onPieceDrop: ({ sourceSquare, targetSquare }) => { void onDrop(sourceSquare as Square, targetSquare as Square); return true; },
											boardStyle: { borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.08)", width: "100%", aspectRatio: "1 / 1" },
											darkSquareStyle: { backgroundColor: "#769656" },
											lightSquareStyle: { backgroundColor: "#eeeed2" },
											squareStyles,
										}}
									/>
								</div>
								<aside className="flex flex-col gap-3">
									<div className="flex items-center gap-2 text-sm">
										<span className={`px-2 py-1 rounded ${statusClass}`}>{state.status}</span>
										<span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">Turn: {state.turn === "w" ? "White" : "Black"}</span>
										<button onClick={copyLink} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Copy link</button>
									</div>
									<div className="text-sm">You are: {state.seat ?? 'Spectator'}</div>
									<div className="text-sm">White: {state.seats?.w?.name ?? '—'}</div>
									<div className="text-sm">Black: {state.seats?.b?.name ?? '—'}</div>
									{state.spectators && state.spectators.length ? (
										<div className="text-sm">Spectators: {state.spectators.map((s) => s.name).join(', ')}</div>
									) : null}
									<div className="text-sm">Version: {state.version}</div>
									<div className="text-sm">Game ID: {state.gameId}</div>
									{/* Move list */}
									<div className="text-sm">
										<h3 className="font-medium mb-1">Moves</h3>
										<ol className="space-y-1 max-h-[280px] overflow-auto pr-1 font-mono">
											{(state.moves ?? []).map((m, idx) => (
												<li key={idx}>{Math.floor(idx/2)+1}. {m.from}-{m.to}</li>
											))}
										</ol>
									</div>
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
