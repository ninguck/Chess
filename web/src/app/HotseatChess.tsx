"use client";

import { useCallback, useState } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";

function getStatus(chess: Chess) {
	if (chess.isGameOver()) {
		if (chess.isCheckmate()) return { label: "Checkmate", type: "checkmate" as const };
		if (chess.isStalemate()) return { label: "Stalemate", type: "stalemate" as const };
		if (chess.isDraw()) return { label: "Draw", type: "draw" as const };
		return { label: "Game over", type: "over" as const };
	}
	if (chess.isCheck()) return { label: "Check", type: "check" as const };
	return { label: "Playing", type: "playing" as const };
}

// Helpers for square arithmetic
const files = ["a","b","c","d","e","f","g","h"] as const;
function toCoord(sq: Square) {
	const file = files.indexOf(sq[0] as typeof files[number]);
	const rank = Number(sq[1]) - 1; // 0..7
	return { file, rank };
}
function toSquare(file: number, rank: number): Square | null {
	if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
	return `${files[file]}${rank + 1}` as Square;
}
function sign(n: number) {
	return n === 0 ? 0 : n > 0 ? 1 : -1;
}

// Compute path squares between from and to depending on piece type
function computePathSquares(piece: string, from: Square, to: Square): Square[] {
	const a = toCoord(from);
	const b = toCoord(to);
	const dx = b.file - a.file;
	const dy = b.rank - a.rank;
	const path: Square[] = [];

	switch (piece) {
		case "n": { // knight
			// Highlight the "L": two in primary axis then one perpendicular
			if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
				const v = sign(dy);
				const h = sign(dx);
				const s1 = toSquare(a.file, a.rank + v);
				const s2 = toSquare(a.file, a.rank + 2 * v);
				if (s1) path.push(s1);
				if (s2) path.push(s2);
				const s3 = toSquare(a.file + h, a.rank + 2 * v);
				if (s3) path.push(s3);
			} else if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
				const h = sign(dx);
				const v = sign(dy);
				const s1 = toSquare(a.file + h, a.rank);
				const s2 = toSquare(a.file + 2 * h, a.rank);
				if (s1) path.push(s1);
				if (s2) path.push(s2);
				const s3 = toSquare(a.file + 2 * h, a.rank + v);
				if (s3) path.push(s3);
			}
			break;
		}
		case "b": {
			const ux = sign(dx);
			const uy = sign(dy);
			let f = a.file + ux, r = a.rank + uy;
			while (f !== b.file && r !== b.rank) {
				const s = toSquare(f, r);
				if (s) path.push(s);
				f += ux; r += uy;
			}
			const target = toSquare(b.file, b.rank); if (target) path.push(target);
			break;
		}
		case "r": {
			const ux = sign(dx);
			const uy = sign(dy);
			let f = a.file + ux, r = a.rank + uy;
			while (f !== b.file || r !== b.rank) {
				const s = toSquare(f, r);
				if (s) path.push(s);
				f += ux; r += uy;
				if ((ux !== 0 && uy !== 0)) break; // safety
			}
			const target = toSquare(b.file, b.rank); if (target) path.push(target);
			break;
		}
		case "q": {
			const ux = sign(dx);
			const uy = sign(dy);
			let f = a.file + ux, r = a.rank + uy;
			while (f !== b.file || r !== b.rank) {
				const s = toSquare(f, r);
				if (s) path.push(s);
				f += ux; r += uy;
			}
			const target = toSquare(b.file, b.rank); if (target) path.push(target);
			break;
		}
		case "p": {
			// forward 1/2 or capture 1 diagonal: highlight target and any intermediate forward
			const ux = sign(dx); // -1,0,1
			const uy = sign(dy);
			if (ux === 0) {
				let r = a.rank + uy;
				while (r !== b.rank + uy) {
					const s = toSquare(a.file, r);
					if (s) path.push(s);
					r += uy;
				}
			} else {
				const target = toSquare(b.file, b.rank); if (target) path.push(target);
			}
			break;
		}
		case "k": {
			const target = toSquare(b.file, b.rank); if (target) path.push(target);
			break;
		}
	}
	return path;
}

function formatMove(m: any) {
	const map: Record<string, string> = { p: "P", n: "N", b: "B", r: "R", q: "Q", k: "K" };
	const piece = map[m.piece] ?? m.piece.toUpperCase();
	const arrow = m.captured ? " x " : " → ";
	const promo = m.promotion ? `=${m.promotion.toUpperCase()}` : "";
	const check = m.san?.includes("#") ? " #" : m.san?.includes("+") ? " +" : "";
	return `${piece} ${m.from}${arrow}${m.to}${promo}${check}`;
}

export default function HotseatChess() {
	const [chess] = useState(() => new Chess());
	const [fen, setFen] = useState<string>(chess.fen());
	const [orientation, setOrientation] = useState<"white" | "black">("white");
	const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
	const [autoFlip, setAutoFlip] = useState<boolean>(true);
	const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
	const [legalTargets, setLegalTargets] = useState<Square[]>([]);
	const status = getStatus(chess);

	const applyPostMoveUI = useCallback(() => {
		setFen(chess.fen());
		if (autoFlip) setOrientation(chess.turn() === "w" ? "white" : "black");
		setSelectedSquare(null);
		setLegalTargets([]);
	}, [chess, autoFlip]);

	const onDrop = useCallback(
		(from: Square, to: Square) => {
			const move: Move | null = chess.move({ from, to, promotion: "q" });
			if (move) {
				setLastMove({ from, to });
				applyPostMoveUI();
				return true;
			}
			return false;
		},
		[chess, applyPostMoveUI]
	);

	const onSquareClick = useCallback(
		(square: Square) => {
			if (selectedSquare && legalTargets.includes(square)) {
				const moved = onDrop(selectedSquare, square);
				if (!moved) {
					setSelectedSquare(null);
					setLegalTargets([]);
				}
				return;
			}
			const piece = chess.get(square);
			if (piece && piece.color === chess.turn()) {
				setSelectedSquare(square);
				const moves = chess.moves({ square, verbose: true }) as unknown as Array<{ to: Square; piece: string }>;
				setLegalTargets(moves.map((m) => m.to));
			} else {
				setSelectedSquare(null);
				setLegalTargets([]);
			}
		},
		[chess, selectedSquare, legalTargets, onDrop]
	);

	const resetGame = useCallback(() => {
		chess.reset();
		setFen(chess.fen());
		setOrientation("white");
		setLastMove(null);
		setSelectedSquare(null);
		setLegalTargets([]);
	}, [chess]);

	const flipBoard = useCallback(() => {
		setOrientation((o) => (o === "white" ? "black" : "white"));
	}, []);

	const statusClass =
		status.type === "checkmate"
			? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
			: status.type === "check"
			? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
			: status.type === "stalemate" || status.type === "draw"
			? "bg-slate-100 text-slate-800 dark:bg-slate-900/40 dark:text-slate-200"
			: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";

	const verboseMoves = chess.history({ verbose: true }) as any[];
	const movePairs = [] as { index: number; white?: string; black?: string }[];
	for (let i = 0; i < verboseMoves.length; i += 2) {
		movePairs.push({
			index: Math.floor(i / 2) + 1,
			white: verboseMoves[i] ? formatMove(verboseMoves[i]) : undefined,
			black: verboseMoves[i + 1] ? formatMove(verboseMoves[i + 1]) : undefined,
		});
	}

	// Build path highlight squares from selected piece across all legal targets
	const pathHighlightSquares: Set<string> = new Set();
	if (selectedSquare) {
		const moves = chess.moves({ square: selectedSquare, verbose: true }) as unknown as Array<{ to: Square; piece: string }>;
		for (const m of moves) {
			const path = computePathSquares(m.piece, selectedSquare, m.to);
			for (const s of path) pathHighlightSquares.add(s);
		}
	}

	// Styles: path highlights + selection + last move
	const squareStyles: Record<string, React.CSSProperties> = {};
	if (pathHighlightSquares.size > 0) {
		for (const s of pathHighlightSquares) {
			squareStyles[s] = {
				boxShadow: "inset 0 0 0 9999px rgba(59,130,246,0.42), 0 0 0 3px rgba(59,130,246,0.55)",
				animation: "pulse 1.2s ease-in-out infinite",
			};
		}
	}
	if (selectedSquare) {
		squareStyles[selectedSquare] = {
			...(squareStyles[selectedSquare] || {}),
			outline: "3px solid #3b82f6",
			outlineOffset: -3,
		};
	}
	if (lastMove) {
		squareStyles[lastMove.from] = {
			...(squareStyles[lastMove.from] || {}),
			outline: "3px solid #f59e0b",
			outlineOffset: -3,
		};
		squareStyles[lastMove.to] = {
			...(squareStyles[lastMove.to] || {}),
			outline: "3px solid #f59e0b",
			outlineOffset: -3,
		};
	}

	return (
		<div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
			<header className="flex items-center justify-between">
				<div className="flex flex-col">
					<h1 className="text-2xl font-semibold tracking-tight">Local Chess (Hotseat)</h1>
					<p className="text-slate-600 dark:text-slate-300 text-sm">Two players take turns on the same device. Auto-queen promotion.</p>
				</div>
			</header>

			<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
				<div className="w-full">
					<div className="w-full max-w-[min(92vw,720px)] mx-auto">
						<Chessboard
							options={{
								id: "hotseat-board",
								position: fen,
								boardOrientation: orientation,
								allowDragging: status.type === "playing" || status.type === "check",
								canDragPiece: ({ square }) => {
									const p = chess.get(square as Square);
									return Boolean(p && p.color === chess.turn() && (status.type === "playing" || status.type === "check"));
								},
								boardStyle: {
									borderRadius: 8,
									boxShadow: "0 2px 8px rgba(0,0,0,.08)",
									width: "100%",
									aspectRatio: "1 / 1",
								},
								darkSquareStyle: { backgroundColor: "#769656" },
								lightSquareStyle: { backgroundColor: "#eeeed2" },
								squareStyles,
								onPieceDrop: ({ sourceSquare, targetSquare }) => onDrop(sourceSquare as Square, targetSquare as Square),
								onSquareClick: ({ square }) => onSquareClick(square as Square),
							}}
						/>
					</div>
				</div>

				<aside className="flex flex-col gap-6">
					<section className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/50 dark:bg-white/5">
						<h2 className="font-medium mb-3">Game controls</h2>
						<div className="flex flex-col gap-3 text-sm">
							{/* Row 1: status + current turn chip */}
							<div className="flex flex-wrap items-center gap-2">
								<span className={`px-2 py-1 rounded ${statusClass}`}>{status.label}</span>
								{(() => {
									const isWhite = chess.turn() === "w";
									return (
										<span className="px-2 py-1 rounded border border-gray-300 bg-gray-100 dark:bg-gray-800">
											{isWhite ? "♔ White to move" : "♚ Black to move"}
										</span>
									);
								})()}
							</div>
							{/* Row 2: flip + auto flip */}
							<div className="flex flex-wrap items-center gap-2 pt-1">
								<button onClick={flipBoard} className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 w-full sm:w-auto">Flip board</button>
								<label className="inline-flex items-center gap-2 select-none w-full sm:w-auto">
									<input type="checkbox" className="accent-black" checked={autoFlip} onChange={() => setAutoFlip((v) => !v)} />
									<span>Auto flip</span>
								</label>
							</div>
							{/* Row 3: reset */}
							<div className="pt-1">
								<button onClick={resetGame} className="px-4 py-2 rounded bg-black text-white hover:opacity-90 w-full">Reset game</button>
							</div>
						</div>
					</section>

					<section className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-white/50 dark:bg-white/5">
						<h2 className="font-medium mb-3">Move list</h2>
						<div className="overflow-auto max-h-[560px] pr-1">
							<table className="w-full text-sm">
								<thead className="text-slate-500">
									<tr>
										<th className="text-left w-12">#</th>
										<th className="text-left">White</th>
										<th className="text-left">Black</th>
									</tr>
								</thead>
								<tbody>
									{movePairs.map((p) => (
										<tr key={p.index} className="border-t border-gray-100 dark:border-gray-800">
											<td className="py-1 pr-2 font-mono text-slate-600 dark:text-slate-300">{p.index}.</td>
											<td className="py-1 pr-2 font-mono">{p.white ?? ""}</td>
											<td className="py-1 pr-2 font-mono">{p.black ?? ""}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>
				</aside>
			</div>
		</div>
	);
} 