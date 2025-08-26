import { NextRequest, NextResponse } from "next/server";
import { handleMove } from "@/server/api/handlers";

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const body = await req.json().catch(() => ({}));
		const result = await handleMove(id, body);
		if (result.status === 404) return NextResponse.json({ error: "not_found" }, { status: 404 });
		return NextResponse.json(result.body, { status: result.status });
	} catch (e: unknown) {
		console.error(`/api/games/[id]/move error`, e);
		const message = e instanceof Error ? e.message : "Unknown error";
		return NextResponse.json({ error: "internal_error", message }, { status: 500 });
	}
}
