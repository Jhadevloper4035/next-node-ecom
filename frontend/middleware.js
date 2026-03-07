import { NextResponse } from "next/server";

// Define public routes that should NOT be accessible when logged in
const authRoutes = [
    "/login",
    "/register",
    "/forget-password",
    "/reset-password",
    "/otp-verification",
];

// Define protected routes that REQUIRE authentication
const protectedRoutes = [
    "/my-account",
    "/my-account-address",
    "/my-account-orders",
    "/my-account-orders-details",
    "/wish-list",
    "/checkout",
    "/view-cart", // Some themes use this
    "/shopping-cart", // If you want to protect the cart (optional)
];

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Get token from cookies
    const token = request.cookies.get("authToken")?.value;

    // 1. If user is on an auth route and ALREADY HAS A TOKEN, 
    // redirect them to the home page.
    if (authRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
        if (token) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // 2. If user is on a protected route and HAS NO TOKEN,
    // redirect them to the login page.
    if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))) {
        if (!token) {
            const loginUrl = new URL("/login", request.url);
            // loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Config for matching paths
export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - robots.txt, sitemap.xml
         */
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
    ],
};
