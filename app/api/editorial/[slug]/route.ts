import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const post = await prisma.editorialPost.findUnique({
    where: { slug: params.slug },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.paywall === "PREMIUM") {
    const session = await auth();
    if (!(session?.user as any)?.isPremium) {
      // Truncate to first paragraph for paywall
      const truncated = post.content.split("</p>")[0] + "</p>";
      return NextResponse.json({ ...post, content: truncated, isPaywalled: true });
    }
  }

  return NextResponse.json({ ...post, isPaywalled: false });
}
