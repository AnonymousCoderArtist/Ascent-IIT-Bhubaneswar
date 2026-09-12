// Global [SYSTEM] message log — aria-live so screen readers announce rewards.
// Usage: pushSystemMessage("+45 XP — Quest cleared") from anywhere.

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface SystemMessageItem {
  id: number;
  text: string;
}

interface SystemMessageContextValue {
  push: (text: string) => void;
}

const SystemMessageContext = createContext<SystemMessageContextValue>({ push: () => {} });

let nextId = 1;

export function SystemMessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<SystemMessageItem[]>([]);

  const push = useCallback((text: string) => {
    const id = nextId++;
    setMessages((prev) => [...prev.slice(-4), { id, text }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 5000);
  }, []);

  return (
    <SystemMessageContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed bottom-16 left-1/2 z-[90] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className="hud-panel w-full rounded px-4 py-3 text-center text-sm tracking-wide text-ivory"
          >
            {m.text}
          </div>
        ))}
      </div>
    </SystemMessageContext.Provider>
  );
}

export function useSystemMessage() {
  return useContext(SystemMessageContext);
}
