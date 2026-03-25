import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Mock upload — real Vercel Blob will be wired at deploy time
    return NextResponse.json({ url: "/placeholder-upload.jpg" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
