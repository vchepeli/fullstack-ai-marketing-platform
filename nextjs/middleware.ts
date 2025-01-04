import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/pricing", "/api/upload"]);

const isSecureRoute = createRouteMatcher([
  "/api/asset-processing-job",
  "/api/asset",
]);

const SERVER_API_KEY = process.env.SERVER_API_KEY;

if (!SERVER_API_KEY) {
  throw new Error("SERVER_API_KEY is not set in the environment variables");
}

export default clerkMiddleware((auth, request) => {
  // Check for secure API routes (service worker only)
  if (isSecureRoute(request)) {
    return checkServiceWorkerAuth(request);
  }

  // if a user is not authenticated and they are trying to
  // access a private route, redirect them to the clerk login page
  if (!auth().userId && !isPublicRoute(request)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

function checkServiceWorkerAuth(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new NextResponse(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];
  if (token !== SERVER_API_KEY) {
    return new NextResponse(JSON.stringify({ error: "Invalid API key" }), {
      status: 403,
    });
  }

  return NextResponse.next();
}
