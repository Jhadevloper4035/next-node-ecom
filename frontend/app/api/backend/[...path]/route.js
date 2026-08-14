import { NextResponse } from "next/server";

const normalizeApiBaseUrl = (url) => {
  const fallback = "http://localhost:5000/api";
  const raw = (url || fallback).replace(/\/+$/, "");
  return raw.endsWith("/v1") ? raw.slice(0, -3) : raw;
};

const backendBaseUrl = normalizeApiBaseUrl(
  process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL,
);

const accessCookieName = process.env.ACCESS_COOKIE_NAME || "accessToken";
const refreshCookieName = process.env.COOKIE_NAME || "refreshToken";
const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function publicOrigin(request) {
  const url = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0] || url.protocol.slice(0, -1);
  const host = request.headers.get("x-forwarded-host")?.split(",")[0] || request.headers.get("host") || url.host;
  return `${protocol}://${host}`;
}

function rewriteCookiePath(cookie) {
  const name = cookie.slice(0, cookie.indexOf("="));
  if (name !== accessCookieName && name !== refreshCookieName) return cookie;
  const path = name === accessCookieName ? "/api/backend/v1" : "/api/backend/v1/auth";
  return cookie.replace(/;\s*Path=[^;]*/i, `; Path=${path}`);
}

async function proxyRequest(request, context) {
  if (unsafeMethods.has(request.method) && request.headers.get("origin") !== publicOrigin(request)) {
    return NextResponse.json({ success: false, message: "Cross-origin request blocked" }, { status: 403 });
  }

  const { path = [] } = await context.params;
  const target = new URL(`${backendBaseUrl}/${path.join("/")}`);
  target.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  const clientIp = headers.get("x-real-ip");
  headers.delete("host");
  headers.delete("connection");
  ["forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-real-ip"].forEach((name) => headers.delete(name));
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  const method = request.method;
  const hasBody = !["GET", "HEAD"].includes(method);
  const response = await fetch(target, {
    method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  const setCookies = response.headers.getSetCookie?.() || response.headers.get("set-cookie")?.split(/,(?=\s*[^;\s,]+=)/) || [];
  if (setCookies.length) {
    responseHeaders.delete("set-cookie");
    setCookies.forEach((cookie) => responseHeaders.append("set-cookie", rewriteCookiePath(cookie)));
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
