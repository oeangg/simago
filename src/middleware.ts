import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// const JWTSECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("__AingMaung")?.value;

  //protected jika user sudah login & ingin masuk ke halaman login/register

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/auth/register", req.url));
  }

  if (
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register")
  ) {
    if (token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  //protected jika user sudah login & ingin masuk ke halaman login/register
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*", "/login", "/register"],
};
