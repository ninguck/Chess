import { NextRequest, NextResponse } from "next/server";
import { handleGet } from "@/server/api/handlers";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id } = await context.params;
	const ifNoneMatch = _req.headers.get("if-none-match") ?? undefined;
	const result = await handleGet(id, ifNoneMatch);
	if (result.status === 304) {
		return new NextResponse(null, { status: 304 });
	}
	if (result.status === 404) {
		return NextResponse.json({ error: "not_found" }, { status: 404 });
	}
	return new NextResponse(JSON.stringify(result.body), {
		status: 200,
		headers: result.etag ? { ETag: result.etag, "Content-Type": "application/json" } : { "Content-Type": "application/json" },
	});
}
