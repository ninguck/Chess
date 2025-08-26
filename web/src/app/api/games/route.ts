import { NextResponse } from "next/server";
import { handleCreate } from "@/server/api/handlers";

export const runtime = 'nodejs';

export async function POST() {
	try {
		const result = await handleCreate();
		return NextResponse.json(result.body, { status: result.status });
	} catch (e: unknown) {
		console.error("/api/games create error", e);
		const message = e instanceof Error ? e.message : "Unknown error";
		return NextResponse.json({ error: "internal_error", message }, { status: 500 });
	}
}
