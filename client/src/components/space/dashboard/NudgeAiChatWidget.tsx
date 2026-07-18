"use client";

import { useState, useRef, useEffect } from "react";
import NudgeAiCard from "./NudgeAiCard";
import { useWorkspaceStore } from "@/store/workspace-store";

export default function NudgeAiChatWidget({ me }: { me: any }) {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hello! I'm your Nudge AI assistant. Ask me about tasks, projects, or team status — I can help!" }
  ]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = chatContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const handleAiSend = async (customPrompt?: string) => {
    const userMsg = customPrompt ?? aiInput;
    if (!userMsg.trim() || isAiTyping || !workspace?.id) return;

    if (!customPrompt) setAiInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setMessages(prev => [...prev, { role: "ai", content: "" }]);
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspace.id, content: userMsg }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiResponse = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "ai", content: aiResponse };
          return updated;
        });
      }
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", content: "Sorry, I encountered an error. Please try again." };
        return updated;
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  return (
    <div className="w-full h-full">
      <NudgeAiCard
        messages={messages}
        input={aiInput}
        loading={isAiTyping}
        onInputChange={setAiInput}
        onSend={() => handleAiSend()}
        onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAiSend()}
        onSuggestionClick={(p) => handleAiSend(p)}
        me={me}
        chatContainerRef={chatContainerRef}
        onClear={() => setMessages([{ role: "ai", content: "Hello! I'm your Nudge AI assistant. Ask me about tasks, projects, or team status — I can help!" }])}
      />
    </div>
  );
}
