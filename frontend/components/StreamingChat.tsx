"use client";

import { useState, useRef, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function StreamingChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const appendStreamChunk = useCallback((chunk: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") {
        next[next.length - 1] = { ...last, content: last.content + chunk };
      } else {
        next.push({ role: "assistant", content: chunk });
      }
      return next;
    });
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        appendStreamChunk(`Error: ${(err as { error?: string }).error ?? res.statusText}`);
        return;
      }

      const body = res.body;
      if (!body) {
        appendStreamChunk("Error: No response body.");
        return;
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        appendStreamChunk(chunk);
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      appendStreamChunk(`Error: ${(e as Error).message}`);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, appendStreamChunk]);

  return (
    <div className="flex flex-col h-[100vh] w-full max-w-2xl mx-auto bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex-none py-4 px-2 border-b border-[var(--foreground)]/10">
        <h1 className="text-lg font-semibold">AI Task Planner Agent</h1>
        <p className="text-sm text-[var(--foreground)]/70 mt-0.5">
          Hello! Ask me to plan any task.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-[var(--foreground)]/60 text-sm">
            Send a message to get a streamed plan.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 ${
              m.role === "user"
                ? "bg-[var(--foreground)]/10 ml-8"
                : "bg-[var(--foreground)]/5 mr-8 whitespace-pre-wrap"
            }`}
          >
            <span className="text-xs font-medium opacity-70 block mb-1">
              {m.role === "user" ? "You " : "Assistant "}
            </span>
            {m.content || (m.role === "assistant" && isStreaming ? "…" : "")}
          </div>
        ))}
      </div>

      <div className="flex-none p-4 border-t border-[var(--foreground)]/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a plan..."
            className="flex-1 rounded-lg border border-[var(--foreground)]/20 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/30"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="rounded-lg bg-[var(--foreground)] text-[var(--background)] px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
