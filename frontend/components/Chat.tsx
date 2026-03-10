"use client";

import { CopilotChat } from "@copilotkit/react-ui";

export default function Chat() {
  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <CopilotChat
        instructions={"You are a helpful AI task planner."}
        labels={{
          title: "AI Task Planner Agent",
          initial: "Hello! Ask me to plan any task.",
        }}
      />
    </div>
  );
}