import { Chess, Move, Square } from "chess.js";

export type MoveBasic = { from: Square; to: Square; promotion?: "q" | "r" | "b" | "n" };

export type GameState = {
	fen: string;
	turn: "w" | "b";
	status: "playing" | "check" | "checkmate" | "stalemate" | "draw";
	version: number; // ply index
	moves?: MoveBasic[];
};

export class ChessService {
	private chess: Chess;
	private version: number;
	private moves: MoveBasic[];

	constructor(fen?: string, version: number = 0, moves?: MoveBasic[]) {
		this.chess = new Chess(fen ?? undefined);
		this.version = version;
		this.moves = moves ? [...moves] : [];
	}

	static fromState(state: GameState): ChessService {
		// Prefer reconstructing from moves if present
		if (state.moves && state.moves.length > 0) {
			const svc = new ChessService();
			for (const m of state.moves) {
				try { svc.chess.move({ from: m.from, to: m.to, promotion: m.promotion }); } catch {}
			}
			svc.version = state.moves.length;
			svc.moves = [...state.moves];
			return svc;
		}
		return new ChessService(state.fen, state.version, state.moves);
	}

	getState(): GameState {
		return {
			fen: this.chess.fen(),
			turn: this.chess.turn(),
			status: this.computeStatus(),
			version: this.version,
			moves: [...this.moves],
		};
	}

	makeMove(from: Square, to: Square, promotion?: "q" | "r" | "b" | "n"): Move | null {
		try {
			const res = this.chess.move({ from, to, promotion }) as Move | null;
			if (res) {
				this.version += 1;
				this.moves.push({ from, to, promotion });
			}
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
