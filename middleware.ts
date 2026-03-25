import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: ["it", "en"],
  defaultLocale: "it",
  localePrefix: "always",
});

export default auth(function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl;

  // Protect /admin/* (except /admin/login) using req.auth from NextAuth v5 wrapper
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const session = req.auth;
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // i18n routing for public routes
  if (!pathname.startsWith("/api") && !pathname.startsWith("/admin")) {
    return intlMiddleware(req);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
