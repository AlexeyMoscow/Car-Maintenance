import { NextResponse } from "next/server";

const rawTarget =
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

const normalizedTarget = rawTarget.startsWith("http")
  ? rawTarget.replace(/\/$/, "")
  : "http://localhost:8080";

const proxyTarget = normalizedTarget.endsWith("/api")
  ? normalizedTarget
  : `${normalizedTarget}/api`;

async function handler(request: Request, params: { path: string[] }) {
  const url = new URL(request.url);
  const targetUrl = `${proxyTarget}/${params.path.join("/")}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : Buffer.from(await request.arrayBuffer());

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET(
  request: Request,
  context: { params: { path: string[] } }
) {
  return handler(request, context.params);
}

export async function POST(
  request: Request,
  context: { params: { path: string[] } }
) {
  return handler(request, context.params);
}

export async function PUT(
  request: Request,
  context: { params: { path: string[] } }
) {
  return handler(request, context.params);
}

export async function PATCH(
  request: Request,
  context: { params: { path: string[] } }
) {
  return handler(request, context.params);
}

export async function DELETE(
  request: Request,
  context: { params: { path: string[] } }
) {
  return handler(request, context.params);
}
