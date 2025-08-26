import type { GameStore, StoredGame } from "./GameStore";
import type { GameState } from "@/lib/ChessService";

async function upstashPath(path: string, url: string, token: string, method: "GET" | "POST" = "POST"): Promise<unknown> {
	const res = await fetch(`${url.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	if (!res.ok) {
		let detail = "";
		try { detail = await res.text(); } catch {}
		throw new Error(`Upstash error: ${res.status}${detail ? ` - ${detail}` : ""}`);
	}
	return res.json() as Promise<unknown>;
}

function gameKey(id: string) { return `game:${id}`; }

export class RedisGameStore implements GameStore {
	constructor(private readonly url: string, private readonly token: string, private readonly ttlSeconds: number = 60 * 60 * 24) {}

	async createGame(id: string, initial: GameState): Promise<StoredGame> {
		const key = gameKey(id);
		const exists = await this.getGame(id);
		if (exists) return exists;
		const stored: StoredGame = { id, ...initial, updatedAt: Date.now() };
		const value = encodeURIComponent(JSON.stringify(stored));
		await upstashPath(`set/${key}/${value}?EX=${this.ttlSeconds}`, this.url, this.token, "POST");
		return stored;
	}

	async getGame(id: string): Promise<StoredGame | null> {
		const key = gameKey(id);
		const json = await upstashPath(`get/${key}`, this.url, this.token, "POST");
		const value = (json as { result?: string | null })?.result ?? null;
		if (!value) return null;
		try {
			const parsed = JSON.parse(value) as StoredGame;
			if (!parsed.id) parsed.id = id;
			return parsed;
		} catch {
			return null;
		}
	}

	async saveGame(id: string, state: GameState): Promise<StoredGame> {
		const key = gameKey(id);
		const stored: StoredGame = { id, ...state, updatedAt: Date.now() };
		const value = encodeURIComponent(JSON.stringify(stored));
		await upstashPath(`set/${key}/${value}?EX=${this.ttlSeconds}`, this.url, this.token, "POST");
		return stored;
	}
}
