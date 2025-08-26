import { z } from "zod";
import { InMemoryGameStore, type GameStore } from "../GameStore";
import { GameService } from "../GameService";
import { sharedStore } from "./store";

export type CreateResult = { status: 201; body: any };
export type GetResult = { status: 200; body: any; etag: string } | { status: 304 } | { status: 404 };
export type MoveResult = { status: 200; body: any } | { status: 400; body: any } | { status: 404 } | { status: 409; body: any };

export const MoveSchema = z.object({
	from: z.string().min(2).max(2),
	to: z.string().min(2).max(2),
	promotion: z.enum(["q", "r", "b", "n"]).optional(),
	expectedVersion: z.number().int().nonnegative(),
});

export function generateId(length = 8): string {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let id = "";
	for (let i = 0; i < length; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
	return id;
}

export function makeServices(store?: GameStore) {
	const s = store ?? sharedStore; // use shared store by default
	const service = new GameService(s);
	return { store: s, service };
}

function makeEtag(version: number): string {
	return `W/"v-${version}"`;
}

export async function handleCreate(store?: GameStore) {
	const { service } = makeServices(store);
	const gameId = generateId(8);
	const created = await service.create(gameId);
	return { status: 201, body: { gameId, ...created } } as const;
}

export async function handleGet(gameId: string, ifNoneMatch?: string, store?: GameStore) {
	const { service } = makeServices(store);
	const current = await service.get(gameId);
	if (!current) return { status: 404 } as const;
	const etag = makeEtag(current.version);
	if (ifNoneMatch && ifNoneMatch === etag) {
		return { status: 304 } as const;
	}
	return { status: 200, body: { gameId, ...current }, etag } as const;
}

export async function handleMove(gameId: string, body: unknown, store?: GameStore) {
	const parse = MoveSchema.safeParse(body);
	if (!parse.success) return { status: 400, body: { error: "invalid_payload" } } as const;
	const { expectedVersion, from, to, promotion } = parse.data;
	const { service } = makeServices(store);
	const before = await service.get(gameId);
	if (!before) return { status: 404 } as const;
	const after = await service.makeMove(gameId, expectedVersion, from, to, promotion);
	if (!after) return { status: 404 } as const;
	if (after.version === before.version) {
		if (before.version !== expectedVersion) return { status: 409, body: { gameId, ...before } } as const;
		return { status: 400, body: { error: "illegal_move", gameId, ...before } } as const;
	}
	if (after.version === before.version + 1) return { status: 200, body: { gameId, ...after } } as const;
	return { status: 409, body: { gameId, ...after } } as const;
}
