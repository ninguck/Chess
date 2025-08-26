export type Seats = { w?: string; b?: string };

export interface SeatStore {
	getSeats(gameId: string): Promise<Seats>;
	setSeat(gameId: string, color: 'w' | 'b', token: string): Promise<void>;
}

export class InMemorySeatStore implements SeatStore {
	private map = new Map<string, Seats>();
	async getSeats(gameId: string): Promise<Seats> {
		return this.map.get(gameId) ?? {};
	}
	async setSeat(gameId: string, color: 'w' | 'b', token: string): Promise<void> {
		const cur = this.map.get(gameId) ?? {};
		cur[color] = token;
		this.map.set(gameId, cur);
	}
}

// Reuse the path-based Upstash helper by local import to avoid cycles
async function upstashPath(path: string, url: string, token: string, method: "GET" | "POST" = "POST"): Promise<any> {
	const res = await fetch(`${url.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, {
		method,
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!res.ok) {
		let detail = ""; try { detail = await res.text(); } catch {}
		throw new Error(`Upstash error: ${res.status}${detail ? ` - ${detail}` : ""}`);
	}
	return res.json();
}

export class RedisSeatStore implements SeatStore {
	constructor(private readonly url: string, private readonly token: string, private readonly ttlSeconds: number = 60 * 60 * 24) {}
	private key(gameId: string) { return `seats:${gameId}`; }
	async getSeats(gameId: string): Promise<Seats> {
		const json = await upstashPath(`get/${this.key(gameId)}`, this.url, this.token, "POST");
		const value = json?.result as string | null;
		if (!value) return {};
		try { return JSON.parse(value) as Seats; } catch { return {}; }
	}
	async setSeat(gameId: string, color: 'w' | 'b', token: string): Promise<void> {
		const seats = await this.getSeats(gameId);
		seats[color] = token;
		const val = encodeURIComponent(JSON.stringify(seats));
		await upstashPath(`set/${this.key(gameId)}/${val}?EX=${this.ttlSeconds}`, this.url, this.token, "POST");
	}
}
