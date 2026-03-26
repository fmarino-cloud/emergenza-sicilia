import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { featured } = await req.json();

  const post = await prisma.editorialPost.update({
    where: { id: params.id },
    data: { featured: Boolean(featured) },
    select: { id: true, featured: true },
  });

  return NextResponse.json(post);
}
