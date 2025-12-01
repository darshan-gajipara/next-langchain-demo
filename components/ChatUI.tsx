"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Strict message type
type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatUI() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");
    
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        body: JSON.stringify({ query: input, memory: memory, }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setMemory(data.memory);  // 👈 save memory for next turn

      const botMessage: ChatMessage = {
        role: "assistant",
        text: data.response ?? "No response generated",
      };

      setMessages((prev) => [...prev, botMessage]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errMsg: ChatMessage = {
        role: "assistant",
        text: "Error: " + err.message,
      };
      setMessages((prev) => [...prev, errMsg]);
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-muted/30 p-4">
      <Card className="w-full max-w-2xl border shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            LangGraph Calculator AI Chat
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col h-[70vh]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 border rounded-lg bg-background shadow-inner">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-1 px-2 rounded-md max-w-[75%] text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <p className="text-sm text-muted-foreground">Thinking...</p>
            )}
          </div>

          {/* Input Box */}
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="Ask: add 50 and 50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={loading}>
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
