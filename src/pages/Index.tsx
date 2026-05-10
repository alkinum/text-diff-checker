import { Button } from "@/components/ui/button";
import DiffViewer from "@/components/DiffViewer";
import { ThemeToggle } from "@/components/ThemeToggle";

const GitHubMarkIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    focusable="false"
  >
    <path d="M12 .296C5.373.296 0 5.67 0 12.297c0 5.303 3.438 9.8 8.207 11.388.6.111.793-.261.793-.58v-2.165c-3.338.726-4.042-1.414-4.042-1.414-.546-1.39-1.333-1.761-1.333-1.761-1.089-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.833 2.81 1.303 3.495.997.107-.774.418-1.303.76-1.602-2.665-.303-5.466-1.332-5.466-5.927 0-1.31.469-2.382 1.237-3.221-.124-.304-.537-1.52.117-3.166 0 0 1.008-.323 3.3 1.23.957-.266 1.984-.399 3.003-.404 1.02.005 2.048.138 3.006.404 2.29-1.553 3.297-1.23 3.297-1.23.656 1.646.243 2.862.119 3.166.77.839 1.236 1.91 1.236 3.221 0 4.606-2.804 5.62-5.478 5.918.43.372.813 1.103.813 2.222v3.293c0 .322.193.697.801.579C20.565 22.09 24 17.594 24 12.296 24 5.67 18.627.296 12 .296Z" />
  </svg>
);

const Index = () => {
  const repoUrl = "https://github.com/alkinum/text-diff-checker";

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto mt-4 w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="surface-panel flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/favicon.png"
              alt=""
              className="h-9 w-9 shrink-0 rounded-[13px] border border-border/70 bg-background/80 p-1 shadow-sm"
            />
            <h1 className="truncate text-base font-semibold tracking-normal">DiffChecker</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-[14px] border-border/70 bg-background/80 text-foreground shadow-sm hover:bg-surface-muted/80"
              title="GitHub"
            >
              <a href={repoUrl} target="_blank" rel="noreferrer noopener" aria-label="Open GitHub repository">
                <GitHubMarkIcon className="h-[18px] w-[18px]" />
                <span className="sr-only">GitHub repository</span>
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 sm:px-6 lg:px-8">
        <DiffViewer />
      </main>
    </div>
  );
};

export default Index;
