import { GameState } from "@/lib/ChessService";

export type StoredGame = GameState & {
	id: string;
	updatedAt: number;
};

export interface GameStore {
	createGame(id: string, initial: GameState): Promise<StoredGame>;
	getGame(id: string): Promise<StoredGame | null>;
	saveGame(id: string, state: GameState): Promise<StoredGame>;
}

export class InMemoryGameStore implements GameStore {
	private games = new Map<string, StoredGame>();

	async createGame(id: string, initial: GameState): Promise<StoredGame> {
		const stored: StoredGame = { id, ...initial, updatedAt: Date.now() };
		this.games.set(id, stored);
		return stored;
	}

	async getGame(id: string): Promise<StoredGame | null> {
		return this.games.get(id) ?? null;
	}

	async saveGame(id: string, state: GameState): Promise<StoredGame> {
		const stored: StoredGame = { id, ...state, updatedAt: Date.now() };
		this.games.set(id, stored);
		return stored;
	}
}
