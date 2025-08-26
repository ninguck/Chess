import { InMemoryGameStore } from "../GameStore";
import { handleCreate, handleGet, handleMove } from "./handlers";

function id() { return Math.random().toString(36).slice(2, 8); }

describe("API handlers (pure)", () => {
	it("create returns 201 with gameId and initial state", async () => {
		const store = new InMemoryGameStore();
		const res = await handleCreate(store);
		expect(res.status).toBe(201);
		expect(res.body.gameId).toBeDefined();
		expect(res.body.version).toBe(0);
	});

	it("get returns 200 with etag and 304 when unchanged", async () => {
		const store = new InMemoryGameStore();
		const created = await handleCreate(store);
		const gameId = created.body.gameId as string;
		const g1 = await handleGet(gameId, undefined, store);
		if (g1.status !== 200) throw new Error("expected 200");
		expect(g1.body.gameId).toBe(gameId);
		expect(g1.etag).toMatch(/W\/"v-0"/);
		const g304 = await handleGet(gameId, g1.etag, store);
		expect(g304.status).toBe(304);
	});

	it("move applies on matching version, 409 on stale, 400 on illegal", async () => {
		const store = new InMemoryGameStore();
		const created = await handleCreate(store);
		const gameId = created.body.gameId as string;
		// legal move
		const m1 = await handleMove(gameId, { expectedVersion: 0, from: "e2", to: "e4" }, store);
		if (m1.status !== 200) throw new Error("expected 200");
		expect(m1.body.version).toBe(1);
		// stale version should 409
		const stale = await handleMove(gameId, { expectedVersion: 0, from: "e7", to: "e5" }, store);
		expect(stale.status).toBe(409);
		// illegal move (out of turn) should 400
		const illegal = await handleMove(gameId, { expectedVersion: 1, from: "e2", to: "e3" }, store);
		expect(illegal.status).toBe(400);
	});

	it("move 400 on invalid payload", async () => {
		const store = new InMemoryGameStore();
		const created = await handleCreate(store);
		const gameId = created.body.gameId as string;
		const bad = await handleMove(gameId, { expectedVersion: 0, from: "e2" }, store);
		expect(bad.status).toBe(400);
	});
});
