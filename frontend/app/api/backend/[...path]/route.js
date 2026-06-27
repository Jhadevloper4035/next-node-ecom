import { NextResponse } from "next/server";

const normalizeApiBaseUrl = (url) => {
  const fallback = "http://backend:5000/api";
  const raw = (url || fallback).replace(/\/+$/, "");
  const dockerSafeRaw = raw.replace("http://localhost:5000", "http://backend:5000");
  return dockerSafeRaw.endsWith("/v1") ? dockerSafeRaw.slice(0, -3) : dockerSafeRaw;
};

const backendBaseUrl = normalizeApiBaseUrl(
  process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL,
);

async function proxyRequest(request, context) {
  const { path = [] } = await context.params;
  const target = new URL(`${backendBaseUrl}/${path.join("/")}`);
  target.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

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
