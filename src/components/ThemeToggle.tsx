import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "light" ? "dark" : "light";

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10 rounded-[14px] border-border/70 bg-background/80 text-muted-foreground shadow-sm hover:bg-surface-muted/80 hover:text-foreground"
      onClick={() => setTheme(nextTheme)}
      title="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
