"use client";

import { useCallback, useMemo, useState } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";

// Simple status helper
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
	const status = useMemo(() => getStatus(chess), [fen, chess]);

	const onDrop = useCallback(
		(from: Square, to: Square) => {
			// Attempt move with promotion to queen by default if applicable
			const move: Move | null = chess.move({ from, to, promotion: "q" });
			if (move) {
				setFen(chess.fen());
				// Switch turn indicator/board orientation for hotseat feel
				setOrientation(chess.turn() === "w" ? "white" : "black");
				return true;
			}
			return false;
		},
		[chess]
	);

	const resetGame = useCallback(() => {
		chess.reset();
		setFen(chess.fen());
		setOrientation("white");
	}, [chess]);

	return (
		<div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h1 className="text-xl font-semibold">Local Chess (Hotseat)</h1>
				<div className="flex items-center gap-2 text-sm">
					<span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">Turn: {chess.turn() === "w" ? "White" : "Black"}</span>
					<span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{status.label}</span>
					<button onClick={resetGame} className="px-3 py-1 rounded bg-black text-white hover:opacity-90">Reset</button>
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] gap-6">
				<div className="w-full">
					<Chessboard
						options={{
							id: "hotseat-board",
							position: fen,
							boardOrientation: orientation,
							allowDragging: status.type === "playing" || status.type === "check",
							boardStyle: { borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,.08)" },
							darkSquareStyle: { backgroundColor: "#769656" },
							lightSquareStyle: { backgroundColor: "#eeeed2" },
							onPieceDrop: ({ sourceSquare, targetSquare }) => onDrop(sourceSquare as Square, targetSquare as Square),
						}}
					/>
				</div>
				<div className="flex flex-col gap-3">
					<h2 className="font-medium">Moves</h2>
					<ol className="text-sm space-y-1 max-h-[480px] overflow-auto pr-2">
						{chess
							.history({ verbose: true })
							.map((m, idx) => (
								<li key={idx} className="font-mono">
									{Math.floor(idx / 2) + 1}. {m.color === "w" ? `${m.from}-${m.to}` : ""}
									{m.color === "b" ? `  ${m.from}-${m.to}` : ""}
								</li>
							))}
					</ol>
				</div>
			</div>
		</div>
	);
} 