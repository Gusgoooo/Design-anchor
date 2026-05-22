"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessageLike,
} from "@assistant-ui/react";

const mockAdapter: ChatModelAdapter = {
  async *run() {
    yield {
      content: [
        {
          type: "text" as const,
          text: "Hello! This is a mock assistant response for Storybook preview.",
        },
      ],
    };
  },
};

const defaultMessages: ThreadMessageLike[] = [
  { role: "user", content: "What is assistant-ui?" },
  {
    role: "assistant",
    content:
      "assistant-ui is a set of React components for building AI chat interfaces. It provides unstyled primitives that handle state management, streaming, and accessibility.",
  },
];

export function MockRuntimeProvider({
  children,
  messages = defaultMessages,
}: {
  children: ReactNode;
  messages?: ThreadMessageLike[];
}) {
  const runtime = useLocalRuntime(mockAdapter, { initialMessages: messages });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

export { defaultMessages };
