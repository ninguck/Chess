import { ChessService } from "@/lib/ChessService";

describe("ChessService", () => {
	it("applies a legal move and flips turn, increments version", () => {
		const svc = new ChessService();
		const s1 = svc.getState();
		expect(s1.turn).toBe("w");
		expect(s1.version).toBe(0);
		const moved = svc.makeMove("e2", "e4");
		expect(moved).not.toBeNull();
		const s2 = svc.getState();
		expect(s2.turn).toBe("b");
		expect(s2.version).toBe(1);
	});

	it("rejects out-of-turn move", () => {
		const svc = new ChessService();
		svc.makeMove("e2", "e4");
		const moved = svc.makeMove("d2", "d4");
		expect(moved).toBeNull();
	});

	it("recognizes checkmate (Scholar's Mate)", () => {
		const svc = new ChessService();
		svc.makeMove("e2", "e4");
		svc.makeMove("e7", "e5");
		svc.makeMove("f1", "c4");
		svc.makeMove("b8", "c6");
		svc.makeMove("d1", "h5");
		svc.makeMove("g8", "f6");
		svc.makeMove("h5", "f7");
		expect(svc.getState().status).toBe("checkmate");
	});
});
