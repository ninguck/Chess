import { NextRequest, NextResponse } from "next/server";
import { handleMove } from "@/server/api/handlers";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id } = await context.params;
	const body = await req.json().catch(() => ({}));
	const result = await handleMove(id, body);
	if (result.status === 404) return NextResponse.json({ error: "not_found" }, { status: 404 });
	return NextResponse.json(result.body, { status: result.status });
}
