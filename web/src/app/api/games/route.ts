import { NextResponse } from "next/server";
import { handleCreate } from "@/server/api/handlers";

export async function POST() {
	const result = await handleCreate();
	return NextResponse.json(result.body, { status: result.status });
}
