import "../src/styles/globals.css";

import * as React from "react";
import type { Preview } from "@storybook/react";

const DARK_KEY = "accord-dark-mode";

function DarkModeSync({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    function apply() {
      const dark = localStorage.getItem(DARK_KEY) === "true";
      document.documentElement.classList.toggle("dark", dark);
      document.body.style.background = dark ? "#000000" : "#ffffff";
      document.body.style.color = dark ? "rgba(250,250,250,0.85)" : "rgba(0,0,0,0.88)";
    }
    apply();
    window.addEventListener("storage", apply);
    const ch = new BroadcastChannel(DARK_KEY);
    ch.onmessage = () => apply();
    return () => {
      window.removeEventListener("storage", apply);
      ch.close();
    };
  }, []);
  return <>{children}</>;
}

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <DarkModeSync>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem" }}>
          <div style={{ width: "100%", maxWidth: "480px" }}>
            <Story />
          </div>
        </div>
      </DarkModeSync>
    ),
  ],
};

export default preview;
