import { NextResponse } from "next/server";

const BACKEND_URL = "http://127.0.0.1:8001/agent";

/**
 * Proxies the request to the backend and streams the response to the client.
 * Client can read response.body as a ReadableStream and show chunks as they arrive.
 */
export async function POST(req: Request) {
  try {
    const { message } = (await req.json()) as { message?: string };
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid message" },
        { status: 400 }
      );
    }

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message.trim() }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        { error: text || `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No response body" },
        { status: 502 }
      );
    }

    // Forward the backend stream to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Agent stream error:", error);
    return NextResponse.json(
      { error: "Agent request failed" },
      { status: 500 }
    );
  }
}
