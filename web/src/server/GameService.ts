import { ChessService, GameState } from "@/lib/ChessService";
import type { GameStore, StoredGame } from "./GameStore";
import type { Square } from "chess.js";

export class GameService {
	constructor(private readonly store: GameStore) {}

	async create(id: string): Promise<StoredGame> {
		const svc = new ChessService();
		return this.store.createGame(id, svc.getState());
	}

	async get(id: string): Promise<StoredGame | null> { return this.store.getGame(id); }

	async makeMove(id: string, expectedVersion: number, from: string, to: string, promotion?: "q" | "r" | "b" | "n"): Promise<StoredGame | null> {
		const current = await this.store.getGame(id);
		if (!current) return null;
		if (current.version !== expectedVersion) return current;
		const svc = ChessService.fromState(current);
		const moved = svc.makeMove(from as Square, to as Square, promotion);
		if (!moved) return current;
		const newState: GameState = svc.getState();
		return this.store.saveGame(id, newState);
	}
}
