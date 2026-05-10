import React, { useCallback, useEffect, useMemo, useRef } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-ejs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-xml-doc";
import "prismjs/components/prism-ini";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface LineNumberedTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  height?: string;
  onScroll?: () => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
  language?: string;
}

const LineNumberedTextarea: React.FC<LineNumberedTextareaProps> = ({
  value,
  onChange,
  placeholder,
  id,
  className,
  height = "300px",
  onScroll,
  scrollRef,
  language = "plaintext",
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const isMobile = useIsMobile();

  const lineNumbers = useMemo(() => {
    const normalized = (value || "").replace(/\r\n/g, "\n");
    const lines = normalized.length ? normalized.split("\n") : [""];
    return lines.map((_, index) => index + 1);
  }, [value]);

  const escapeHtml = (input: string) =>
    input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const resolvedLanguage = useMemo(
    () => (Prism.languages[language] ? language : "plaintext"),
    [language]
  );

  const highlightedMarkup = useMemo(() => {
    const grammar = Prism.languages[resolvedLanguage] || Prism.languages.plaintext;
    try {
      return Prism.highlight(value || " ", grammar, resolvedLanguage);
    } catch (error) {
      console.warn(`Falling back to plain text highlighting for ${resolvedLanguage}`, error);
      return escapeHtml(value || " ");
    }
  }, [resolvedLanguage, value]);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    requestAnimationFrame(() => {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textarea.scrollTop;
      }

      if (highlightRef.current) {
        highlightRef.current.scrollTop = textarea.scrollTop;
        highlightRef.current.scrollLeft = textarea.scrollLeft;
      }

      onScroll?.();
    });
  }, [onScroll]);

  useEffect(() => {
    syncScroll();
  }, [highlightedMarkup, syncScroll]);

  const lineNumberWidth = isMobile ? "42px" : "54px";
  const editorFontSize = isMobile ? "12px" : "13px";
  const editorLineHeight = isMobile ? "21px" : "22px";

  return (
    <div
      className="line-numbered-wrapper group w-full focus-within:border-ring/40 focus-within:shadow-[0_0_0_1px_hsl(var(--ring)/0.16),0_24px_70px_rgba(15,23,42,0.12)]"
      style={{ height }}
      ref={scrollRef}
    >
      <div
        className="grid h-full w-full min-w-0"
        style={{ gridTemplateColumns: `${lineNumberWidth} minmax(0, 1fr)` }}
      >
        <div
          ref={lineNumbersRef}
          className="line-numbers-container overflow-hidden py-3 scrollbar-none"
        >
          {lineNumbers.map((num) => (
            <div
              key={num}
              className="flex items-center justify-end px-3 text-right"
              style={{
                fontSize: editorFontSize,
                height: editorLineHeight,
                lineHeight: editorLineHeight,
              }}
            >
              {num}
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <pre
            ref={highlightRef}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 overflow-auto scrollbar-none py-3 pl-4 pr-5 font-mono text-foreground",
              className
            )}
            style={{
              fontSize: editorFontSize,
              lineHeight: editorLineHeight,
              tabSize: 2,
            }}
          >
            <code
              className={`language-${resolvedLanguage} block min-h-full whitespace-pre`}
              style={{
                fontSize: editorFontSize,
                lineHeight: editorLineHeight,
                tabSize: 2,
              }}
              dangerouslySetInnerHTML={{ __html: highlightedMarkup }}
            />
          </pre>

          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={onChange}
            onScroll={syncScroll}
            onPaste={() => {
              window.setTimeout(syncScroll, 0);
            }}
            placeholder={placeholder}
            aria-label={id ? `${id} editor` : "Text editor"}
            className={cn(
              "absolute inset-0 z-10 h-full w-full resize-none border-none bg-transparent py-3 pl-4 pr-5 font-mono text-transparent shadow-none caret-primary placeholder:text-muted-foreground/45 focus-visible:ring-0 focus-visible:ring-offset-0",
              className
            )}
            style={{
              fontSize: editorFontSize,
              lineHeight: editorLineHeight,
              tabSize: 2,
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
};

export default LineNumberedTextarea;
