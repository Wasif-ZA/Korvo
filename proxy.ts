import { NextRequest, NextResponse } from "next/server";

// Auth guard logic will be added in Plan 03

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // Pass through all requests - auth checking added in Plan 03
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
