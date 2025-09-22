import { NextResponse } from "next/server";

export async function GET() {
  const metrics = `
  # HELP my_app_requests_total Total requests
  # TYPE my_app_requests_total counter
  my_app_requests_total{method="GET"} 1
  `;
  return new NextResponse(metrics, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
