import { z } from "zod";
import type { GameStore } from "../GameStore";
import { GameService } from "../GameService";
import { sharedStore } from "./store";
import { RedisGameStore } from "../RedisGameStore";
import { InMemorySeatStore, RedisSeatStore, type SeatStore, type Seats } from "../SeatStore";

export type CreateResult = { status: 201; body: any };
export type GetResult = { status: 200; body: any; etag: string } | { status: 304 } | { status: 404 };
export type MoveResult = { status: 200; body: any } | { status: 400; body: any } | { status: 404 } | { status: 409; body: any };

const NameSchema = z.string().trim().min(2).max(20).regex(/^[\w \-]+$/);

export const MoveSchema = z.object({
	from: z.string().min(2).max(2),
	to: z.string().min(2).max(2),
	promotion: z.enum(["q", "r", "b", "n"]).optional(),
	expectedVersion: z.number().int().nonnegative(),
	playerToken: z.string().min(8),
	displayName: NameSchema.optional(),
});

export function generateId(length = 8): string {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let id = "";
	for (let i = 0; i < length; i++) id += alphabet[Math.floor(Math.random() * alphabet.length)];
	return id;
}

function resolveGameStore(): GameStore {
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (url && token) return new RedisGameStore(url, token);
	return sharedStore;
}

function resolveSeatStore(): SeatStore {
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (url && token) return new RedisSeatStore(url, token);
	return new InMemorySeatStore();
}

export function makeServices(store?: GameStore) {
	const s = store ?? resolveGameStore();
	const service = new GameService(s);
	return { store: s, service };
}

function makeEtag(version: number, seatHash: string = ""): string {
	return `W/"v-${version}-s-${seatHash}"`;
}

export async function handleCreate(store?: GameStore) {
	const { service } = makeServices(store);
	const gameId = generateId(8);
	const created = await service.create(gameId);
	return { status: 201, body: { gameId, ...created } } as const;
}

export async function handleGet(gameId: string, ifNoneMatch?: string, playerToken?: string, store?: GameStore, displayName?: string) {
	const { service } = makeServices(store);
	const current = await service.get(gameId);
	if (!current) return { status: 404 } as const;
	const seatStore = resolveSeatStore();
	const seats = await seatStore.getSeats(gameId);
	let seat: 'w' | 'b' | undefined = undefined;
	if (playerToken) {
		const name = displayName && NameSchema.safeParse(displayName).success ? displayName : `Player-${playerToken.slice(0,4)}`;
		if (!seats.w) { await seatStore.setSeat(gameId, 'w', { token: playerToken, name }); seats.w = { token: playerToken, name }; seat = 'w'; }
		else if (seats.w.token !== playerToken && !seats.b) { await seatStore.setSeat(gameId, 'b', { token: playerToken, name }); seats.b = { token: playerToken, name }; seat = 'b'; }
		else if (seats.w.token === playerToken) { seat = 'w'; }
		else if (seats.b && seats.b.token === playerToken) { seat = 'b'; }
		else { await seatStore.addSpectator(gameId, { token: playerToken, name }); (seats.spectators ??= []).push({ token: playerToken, name }); }
	}
	const seatsAssigned = Boolean(seats.w || seats.b);
	const seatHash = `${seats.w?.token ?? ''}:${seats.b?.token ?? ''}:${(seats.spectators ?? []).length}`;
	const etag = makeEtag(current.version, seatHash);
	if (ifNoneMatch && ifNoneMatch === etag) {
		return { status: 304 } as const;
	}
	const publicSeats = { w: seats.w ? { name: seats.w.name } : undefined, b: seats.b ? { name: seats.b.name } : undefined } as { w?: { name: string }, b?: { name: string } };
	const spectators = (seats.spectators ?? []).map((s) => ({ name: s.name })).slice(0, 20);
	return { status: 200, body: { gameId, ...current, seat, seatsAssigned, seats: publicSeats, spectators }, etag } as const;
}

export async function handleMove(gameId: string, body: unknown, store?: GameStore) {
	const parse = MoveSchema.safeParse(body);
	if (!parse.success) return { status: 400, body: { error: "invalid_payload" } } as const;
	const { expectedVersion, from, to, promotion, playerToken } = parse.data;
	const { service } = makeServices(store);
	const game = await service.get(gameId);
	if (!game) return { status: 404 } as const;
	const seatStore = resolveSeatStore();
	const seats = await seatStore.getSeats(gameId);
	if (!seats.w || (seats.w && seats.w.token !== playerToken && !seats.b)) {
		if (!seats.w) { await seatStore.setSeat(gameId, 'w', { token: playerToken, name: `Player-${playerToken.slice(0,4)}` }); seats.w = { token: playerToken, name: `Player-${playerToken.slice(0,4)}` }; }
		else if (seats.w.token !== playerToken && !seats.b) { await seatStore.setSeat(gameId, 'b', { token: playerToken, name: `Player-${playerToken.slice(0,4)}` }); seats.b = { token: playerToken, name: `Player-${playerToken.slice(0,4)}` }; }
	}
	const required = game.turn === 'w' ? seats.w?.token : seats.b?.token;
	if (required && required !== playerToken) {
		return { status: 400, body: { error: "wrong_seat", gameId, ...game } } as const;
	}
	const before = game;
	const after = await service.makeMove(gameId, expectedVersion, from, to, promotion);
	if (!after) return { status: 404 } as const;
	if (after.version === before.version) {
		if (before.version !== expectedVersion) return { status: 409, body: { gameId, ...before } } as const;
		return { status: 400, body: { error: "illegal_move", gameId, ...before } } as const;
	}
	if (after.version === before.version + 1) return { status: 200, body: { gameId, ...after } } as const;
	return { status: 409, body: { gameId, ...after } } as const;
}
