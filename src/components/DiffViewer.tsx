import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  parseDiffFromFile,
  type FileContents,
  type FileDiffMetadata,
  type SupportedLanguages,
  type VirtualFileMetrics,
} from "@pierre/diffs";
import { FileDiff, Virtualizer } from "@pierre/diffs/react";
import {
  ArrowRightLeft,
  Columns2,
  FileDiff as FileDiffIcon,
  Loader2,
  PencilLine,
  RefreshCcw,
  Rows3,
  Trash2,
  WrapText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { detectLanguage } from "@/utils/diff/languageDetector";
import FormatSelector from "@/components/FormatSelector";
import LineNumberedTextarea from "@/components/LineNumberedTextarea";
import Footer from "@/components/Footer";
import { useTheme } from "@/components/ThemeProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type DiffStyle = "split" | "unified";
type LanguageMode = "auto" | "manual";
type MobilePane = "edit" | "output";

type DiffStats = {
  additions: number;
  deletions: number;
};

const DIFF_METRICS: VirtualFileMetrics = {
  hunkLineCount: 46,
  lineHeight: 18,
  diffHeaderHeight: 38,
  hunkSeparatorHeight: 26,
  fileGap: 6,
};

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  plaintext: "txt",
  text: "txt",
  javascript: "js",
  typescript: "ts",
  jsx: "jsx",
  tsx: "tsx",
  json: "json",
  html: "html",
  xml: "xml",
  css: "css",
  yaml: "yml",
  markdown: "md",
  bash: "sh",
  ejs: "ejs",
  python: "py",
  perl: "pl",
  java: "java",
  clike: "c",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  go: "go",
  rust: "rs",
  sql: "sql",
  ini: "ini",
};

const DIFF_LANGUAGE_ALIASES: Record<string, SupportedLanguages> = {
  plaintext: "text",
  clike: "c",
};

function normalizeDiffLanguage(language: string): SupportedLanguages {
  return DIFF_LANGUAGE_ALIASES[language] ?? (language as SupportedLanguages);
}

function getFileExtension(language: string) {
  return LANGUAGE_EXTENSIONS[language] ?? "txt";
}

function createFile(name: string, contents: string, language: string): FileContents {
  return {
    name,
    contents,
    lang: normalizeDiffLanguage(language),
  };
}

function getDiffStats(fileDiff: FileDiffMetadata): DiffStats {
  return {
    additions: fileDiff.additionLines.length,
    deletions: fileDiff.deletionLines.length,
  };
}

const DiffViewer: React.FC = () => {
  const isMobile = useIsMobile();
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [language, setLanguage] = useState("plaintext");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("auto");
  const [diffStyle, setDiffStyle] = useState<DiffStyle>(() => (isMobile ? "unified" : "split"));
  const [wrapText, setWrapText] = useState(() => isMobile);
  const [mobilePane, setMobilePane] = useState<MobilePane>("edit");
  const [comparison, setComparison] = useState<FileDiffMetadata | null>(null);
  const [comparisonVersion, setComparisonVersion] = useState(0);
  const [isComparing, setIsComparing] = useState(false);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const renderVersion = useRef(0);

  const autoDetectedLanguage = useMemo(() => {
    if (languageMode !== "auto") {
      return language;
    }

    const sourceText = leftText.trim() ? leftText : rightText;
    return sourceText ? detectLanguage(sourceText) : "plaintext";
  }, [language, languageMode, leftText, rightText]);

  const currentLanguage = languageMode === "auto" ? autoDetectedLanguage : language;

  const comparisonStats = useMemo(
    () => (comparison ? getDiffStats(comparison) : { additions: 0, deletions: 0 }),
    [comparison]
  );

  const editorsHeight = isMobile
    ? "clamp(140px, calc((100svh - 456px) / 2), 246px)"
    : "clamp(170px, calc((100svh - 372px) / 2), 292px)";
  const outputPanelHeight = isMobile
    ? "h-[min(68svh,640px)] min-h-[420px]"
    : "h-[min(82vh,920px)]";

  const diffOptions = useMemo(
    () => ({
      theme: {
        light: "pierre-light",
        dark: "pierre-dark",
      },
      themeType: resolvedTheme,
      diffStyle,
      diffIndicators: "bars" as const,
      hunkSeparators: "line-info-basic" as const,
      overflow: wrapText ? ("wrap" as const) : ("scroll" as const),
      lineDiffType: "word" as const,
      disableBackground: false,
      disableLineNumbers: false,
    }),
    [diffStyle, resolvedTheme, wrapText]
  );

  useEffect(() => {
    const nextVersion = renderVersion.current + 1;
    renderVersion.current = nextVersion;
    let frame = 0;

    frame = window.requestAnimationFrame(() => {
      if (renderVersion.current !== nextVersion) {
        return;
      }

      if (!leftText && !rightText) {
        setComparison(null);
        setIsComparing(false);
        return;
      }

      try {
        setIsComparing(true);

        const normalizedLanguage = normalizeDiffLanguage(currentLanguage);
        const extension = getFileExtension(currentLanguage);
        const leftFile = createFile(`original.${extension}`, leftText, normalizedLanguage);
        const rightFile = createFile(`modified.${extension}`, rightText, normalizedLanguage);
        const fileDiff = parseDiffFromFile(leftFile, rightFile);

        setComparison(fileDiff);
        setComparisonVersion((version) => version + 1);
      } catch (error) {
        console.error("Error computing diff:", error);
        setComparison(null);
        toast({
          title: "Diff rendering failed",
          description: "The comparison could not be prepared. Try simplifying the input and try again.",
          variant: "destructive",
        });
      } finally {
        setIsComparing(false);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentLanguage, leftText, rightText, toast]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {isMobile ? (
        <section className="surface-panel px-2.5 py-2.5">
          <ToggleGroup
            type="single"
            value={mobilePane}
            onValueChange={(value) => {
              if (value === "edit" || value === "output") {
                setMobilePane(value);
              }
            }}
            variant="outline"
            size="sm"
            className="grid grid-cols-2 rounded-[16px] border border-border/70 bg-background/80 p-1 shadow-sm"
          >
            <ToggleGroupItem
              value="edit"
              aria-label="Edit texts"
              className="h-9 gap-1.5 rounded-[12px] text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </ToggleGroupItem>
            <ToggleGroupItem
              value="output"
              aria-label="View diff output"
              className="h-9 gap-1.5 rounded-[12px] text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <FileDiffIcon className="h-4 w-4" />
              Output
            </ToggleGroupItem>
          </ToggleGroup>
        </section>
      ) : null}

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:items-start">
        <div
          className={cn(
            "space-y-4 xl:col-start-1 xl:row-start-1",
            isMobile ? (mobilePane === "edit" ? "block" : "hidden") : "order-2 xl:order-none"
          )}
        >
          <section className="surface-panel px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <FormatSelector
                  selectedLanguage={currentLanguage}
                  onLanguageChange={(nextLanguage) => {
                    setLanguage(nextLanguage);
                    setLanguageMode("manual");
                  }}
                  className="shrink-0"
                  triggerClassName="border-border/70 bg-background/80 shadow-sm"
                />
                <Button
                  variant={languageMode === "auto" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setLanguageMode("auto")}
                  className="h-10 gap-1 rounded-[14px] border-border/70 bg-background/80 px-3 text-muted-foreground shadow-sm hover:bg-surface-muted/80 hover:text-foreground sm:px-3.5"
                  aria-label="Auto-detect format"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Auto</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLeftText(rightText);
                    setRightText(leftText);
                  }}
                  className="h-10 gap-1 rounded-[14px] border-border/70 bg-background/80 px-3 text-muted-foreground shadow-sm hover:bg-surface-muted/80 hover:text-foreground sm:px-3.5"
                  disabled={!leftText && !rightText}
                  aria-label="Swap texts"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Swap</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLeftText("");
                    setRightText("");
                    setComparison(null);
                    setComparisonVersion((version) => version + 1);
                    setIsComparing(false);
                  }}
                  className="h-10 gap-1 rounded-[14px] border-border/70 bg-background/80 px-3 text-muted-foreground shadow-sm hover:bg-surface-muted/80 hover:text-foreground sm:px-3.5"
                  disabled={!leftText && !rightText}
                  aria-label="Clear both texts"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>
          </section>

          <section className="surface-panel px-4 py-4 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium tracking-normal">Original</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftText("")}
                disabled={!leftText}
                className="h-9 w-9 rounded-[12px] border border-border/70 bg-background/70 text-muted-foreground shadow-sm hover:bg-surface-muted/80 hover:text-foreground"
                title="Clear original text"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <LineNumberedTextarea
              id="original"
              value={leftText}
              onChange={(event) => setLeftText(event.target.value)}
              height={editorsHeight}
              language={currentLanguage}
            />
          </section>

          <section className="surface-panel px-4 py-4 sm:px-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium tracking-normal">Modified</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRightText("")}
                disabled={!rightText}
                className="h-9 w-9 rounded-[12px] border border-border/70 bg-background/70 text-muted-foreground shadow-sm hover:bg-surface-muted/80 hover:text-foreground"
                title="Clear modified text"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <LineNumberedTextarea
              id="modified"
              value={rightText}
              onChange={(event) => setRightText(event.target.value)}
              height={editorsHeight}
              language={currentLanguage}
            />
          </section>
        </div>

        <section
          className={cn(
            "surface-panel-strong flex flex-col overflow-hidden xl:col-start-2 xl:row-start-1",
            isMobile ? (mobilePane === "output" ? "flex" : "hidden") : "order-1 xl:order-none",
            outputPanelHeight,
            !isMobile && "min-h-[680px]"
          )}
        >
          <div className="border-b border-border/70 px-3 py-2 sm:px-5 sm:py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold leading-none tracking-normal sm:text-[15px]">
                  Diff output
                </h2>
                {isComparing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="metric-chip px-2.5 py-1">
                  <span className="text-signal-emerald">+{comparisonStats.additions}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-signal-rose">-{comparisonStats.deletions}</span>
                </span>

                <ToggleGroup
                  type="single"
                  value={diffStyle}
                  onValueChange={(value) => {
                    if (value === "split" || value === "unified") {
                      setDiffStyle(value);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-[14px] border border-border/70 bg-background/80 p-1 shadow-sm"
                >
                  <ToggleGroupItem
                    value="split"
                    aria-label="Split view"
                    className="h-8 gap-1 rounded-[10px] px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:px-2.5"
                  >
                    <Columns2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Split</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="unified"
                    aria-label="Unified view"
                    className="h-8 gap-1 rounded-[10px] px-2 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:px-2.5"
                  >
                    <Rows3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Unified</span>
                  </ToggleGroupItem>
                </ToggleGroup>

                <Toggle
                  pressed={wrapText}
                  onPressedChange={setWrapText}
                  aria-label="Toggle line wrapping"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-[12px] border-border/70 bg-background/80 px-2 text-muted-foreground shadow-sm hover:bg-surface-muted/80 hover:text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground sm:px-2.5"
                >
                  <WrapText className="h-4 w-4" />
                  <span className="hidden sm:inline">Wrap</span>
                </Toggle>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {comparison ? (
              <Virtualizer
                key={`diff-${comparisonVersion}-${diffStyle}-${wrapText}-${resolvedTheme}`}
                className="h-full w-full"
                style={{ height: "100%" }}
                contentClassName="h-full"
                config={{
                  overscrollSize: 240,
                  intersectionObserverMargin: 320,
                  resizeDebugging: false,
                }}
              >
                <FileDiff
                  key={comparisonVersion}
                  fileDiff={comparison}
                  metrics={DIFF_METRICS}
                  options={{
                    ...diffOptions,
                    disableFileHeader: true,
                    unsafeCSS:
                      ":host{--diffs-line-height:18px;--diffs-font-size:12px;--diffs-gap-block:4px;--diffs-gap-inline:7px;}",
                  }}
                />
              </Virtualizer>
            ) : (
              <div className="flex h-full items-center justify-center px-8 py-12">
                <div
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-[24px] border border-border/70 bg-background/80 shadow-sm",
                    isComparing && "animate-pulse"
                  )}
                >
                  {isComparing ? (
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                  ) : (
                    <ArrowRightLeft className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default DiffViewer;
