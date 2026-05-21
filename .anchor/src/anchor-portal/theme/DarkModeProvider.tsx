import * as React from "react";

const DARK_KEY = "anchor-dark-mode";

type ThemeState = { dark: boolean; setDark: (v: boolean) => void; toggle: () => void };

const ThemeCtx = React.createContext<ThemeState>({
  dark: false,
  setDark: () => {},
  toggle: () => {},
});

export function useTheme(): ThemeState {
  return React.useContext(ThemeCtx);
}

function readInitial(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(DARK_KEY) === "true";
}

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = React.useState<boolean>(readInitial);

  const broadcast = React.useCallback((v: boolean) => {
    try {
      const ch = new BroadcastChannel(DARK_KEY);
      ch.postMessage(v);
      ch.close();
    } catch {
      /* BroadcastChannel not available */
    }
  }, []);

  const setDark = React.useCallback(
    (v: boolean) => {
      setDarkState(v);
      try {
        localStorage.setItem(DARK_KEY, String(v));
      } catch {
        /* storage may be blocked */
      }
      broadcast(v);
    },
    [broadcast],
  );

  const toggle = React.useCallback(() => {
    setDark(!dark);
  }, [dark, setDark]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DARK_KEY) setDarkState(e.newValue === "true");
    };
    window.addEventListener("storage", onStorage);
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel(DARK_KEY);
      ch.onmessage = (ev) => setDarkState(Boolean(ev.data));
    } catch {
      /* ignore */
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      ch?.close();
    };
  }, []);

  const value = React.useMemo<ThemeState>(
    () => ({ dark, setDark, toggle }),
    [dark, setDark, toggle],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
