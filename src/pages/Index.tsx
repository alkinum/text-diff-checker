import { Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import DiffViewer from "@/components/DiffViewer";
import { ThemeToggle } from "@/components/ThemeToggle"

const Index = () => {
  // Repository URL from package.json
  const repoUrl = "https://github.com/alkinum/text-diff-checker";

  return (
    <>
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="px-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 shadow-md hover:shadow-lg transition-all duration-300 ease-out transform hover:-translate-y-1 hover:bg-primary/10"
          onClick={() => window.open(repoUrl, "_blank", "noopener,noreferrer")}
          title="View on GitHub"
        >
          <Github className="h-5 w-5 transition-transform duration-300 hover:rotate-12" />
          <span className="sr-only">GitHub repository</span>
        </Button>
        <ThemeToggle />
      </div>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-background/95 pb-20">
        <DiffViewer />
      </div>
    </>
  );
};

export default Index;
