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
			// If a piece is already selected and we clicked a legal target, try the move
			if (selectedSquare && legalTargets.includes(square)) {
				const moved = onDrop(selectedSquare, square);
				if (!moved) {
					// If illegal (race condition), just clear selection
					setSelectedSquare(null);
					setLegalTargets([]);
				}
				return;
			}

			// Select only if it's the current player's piece
			const piece = chess.get(square);
			if (piece && piece.color === chess.turn()) {
				setSelectedSquare(square);
				const moves = chess.moves({ square, verbose: true }) as unknown as Array<{ to: Square }>; // chess.js typing
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

	const verboseMoves = chess.history({ verbose: true });
	const movePairs = [] as { index: number; white?: string; black?: string }[];
	for (let i = 0; i < verboseMoves.length; i += 2) {
		movePairs.push({
			index: Math.floor(i / 2) + 1,
			white: verboseMoves[i]?.san,
			black: verboseMoves[i + 1]?.san,
		});
	}

	// Styles: last move + selection + legal targets
	const squareStyles: Record<string, React.CSSProperties> = {};
	if (lastMove) {
		squareStyles[lastMove.from] = { outline: "3px solid #f59e0b", outlineOffset: -3 };
		squareStyles[lastMove.to] = { outline: "3px solid #f59e0b", outlineOffset: -3 };
	}
	if (selectedSquare) {
		squareStyles[selectedSquare] = { outline: "3px solid #3b82f6", outlineOffset: -3 };
		for (const t of legalTargets) {
			// Add a soft dot indicator via radial gradient
			squareStyles[t] = {
				...(squareStyles[t] || {}),
				backgroundImage: "radial-gradient(circle at center, rgba(59,130,246,0.45) 0%, rgba(59,130,246,0.45) 18%, rgba(0,0,0,0) 19%)",
				backgroundRepeat: "no-repeat",
				backgroundPosition: "center",
				backgroundSize: "22% 22%",
			};
		}
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
						<div className="flex flex-wrap items-center gap-3 text-sm">
							<span className={`px-2 py-1 rounded ${statusClass}`}>{status.label}</span>
							<span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">Turn: {chess.turn() === "w" ? "White" : "Black"}</span>
							<label className="inline-flex items-center gap-2 select-none">
								<input type="checkbox" className="accent-black" checked={autoFlip} onChange={() => setAutoFlip((v) => !v)} />
								<span>Auto flip</span>
							</label>
							<button onClick={flipBoard} className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Flip</button>
							<button onClick={resetGame} className="px-3 py-1 rounded bg-black text-white hover:opacity-90">Reset</button>
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