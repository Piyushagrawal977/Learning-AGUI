import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const lastMessage = payload.body.messages?.[payload.body.messages.length - 1];
    // console.log("size of body messages",body.body.messages)
//     for (const element of body.messages ?? []) {
//   console.log("element", element);
// }

    // console.log("body message",body.messages)
    // console.log("last Message",lastMessage)
    let userMessage = "";

    if (typeof lastMessage?.content === "string") {
      userMessage = lastMessage.content;
    } else if (Array.isArray(lastMessage?.content)) {
      userMessage = lastMessage.content
        .map((c: any) => c.text || "")
        .join("");
    }

    const response = await fetch("http://127.0.0.1:8001/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    // Backend streams text/event-stream; read and concatenate the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      content += decoder.decode(value, { stream: true });
    }

    return NextResponse.json({
      agent: "default",
      messages: [
        {
          role: "assistant",
          content: content.trimEnd(),
        },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Agent request failed" },
      { status: 500 }
    );
  }
}
