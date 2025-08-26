import { Chess, Move, Square } from "chess.js";

export type GameState = {
	fen: string;
	turn: "w" | "b";
	status: "playing" | "check" | "checkmate" | "stalemate" | "draw";
	version: number; // ply index
};

export class ChessService {
	private chess: Chess;
	private version: number;

	constructor(fen?: string, version: number = 0) {
		this.chess = new Chess(fen ?? undefined);
		this.version = version;
	}

	static fromState(state: GameState): ChessService {
		return new ChessService(state.fen, state.version);
	}

	getState(): GameState {
		return {
			fen: this.chess.fen(),
			turn: this.chess.turn(),
			status: this.computeStatus(),
			version: this.version,
		};
	}

	makeMove(from: Square, to: Square, promotion?: "q" | "r" | "b" | "n"): Move | null {
		try {
			const res = this.chess.move({ from, to, promotion }) as Move | null;
			if (res) this.version += 1;
			return res;
		} catch {
			return null;
		}
	}

	private computeStatus(): GameState["status"] {
		if (this.chess.isGameOver()) {
			if (this.chess.isCheckmate()) return "checkmate";
			if (this.chess.isStalemate()) return "stalemate";
			if (this.chess.isDraw()) return "draw";
			return "draw";
		}
		return this.chess.isCheck() ? "check" : "playing";
	}
}
