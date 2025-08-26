import { InMemoryGameStore } from "./GameStore";
import { GameService } from "./GameService";

function makeId() {
	return Math.random().toString(36).slice(2, 8);
}

describe("GameService", () => {
	it("creates and fetches a new game", async () => {
		const store = new InMemoryGameStore();
		const svc = new GameService(store);
		const id = makeId();
		const created = await svc.create(id);
		expect(created.id).toBe(id);
		expect(created.version).toBe(0);
		const fetched = await svc.get(id);
		expect(fetched?.fen).toBe(created.fen);
	});

	it("applies a move when version matches and increments version", async () => {
		const store = new InMemoryGameStore();
		const svc = new GameService(store);
		const id = makeId();
		const created = await svc.create(id);
		const after = await svc.makeMove(id, created.version, "e2", "e4");
		expect(after).not.toBeNull();
		expect(after!.version).toBe(1);
		const again = await svc.makeMove(id, after!.version, "e7", "e5");
		expect(again!.version).toBe(2);
	});

	it("returns current state without applying when version mismatches (simulate 409)", async () => {
		const store = new InMemoryGameStore();
		const svc = new GameService(store);
		const id = makeId();
		const created = await svc.create(id);
		// client thinks version 0, but we'll manually update once
		await svc.makeMove(id, created.version, "e2", "e4");
		const stale = await svc.makeMove(id, 0, "e7", "e5");
		expect(stale!.version).toBe(1); // unchanged because stale
	});
});
