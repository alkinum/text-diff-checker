
/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

const getInitialTheme = (defaultTheme: Theme, storageKey: string): Theme => {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme(defaultTheme, storageKey));
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    () => {
      const initialTheme = getInitialTheme(defaultTheme, storageKey);
      return initialTheme === "system" ? getSystemTheme() : initialTheme;
    }
  );

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (nextTheme: ResolvedTheme) => {
      root.classList.remove("light", "dark");
      root.classList.add(nextTheme);
      root.style.colorScheme = nextTheme;
      setResolvedTheme(nextTheme);
    };

    if (theme !== "system") {
      applyTheme(theme);
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => applyTheme(getSystemTheme());

    handleSystemThemeChange();
    media.addEventListener("change", handleSystemThemeChange);

    return () => media.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
