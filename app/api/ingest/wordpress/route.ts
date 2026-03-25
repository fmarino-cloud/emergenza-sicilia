import { NextRequest, NextResponse } from "next/server";
import { syncWordPressPosts } from "@/lib/ingestion/wordpress";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (secret !== process.env.INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncWordPressPosts();
  return NextResponse.json(result);
}
