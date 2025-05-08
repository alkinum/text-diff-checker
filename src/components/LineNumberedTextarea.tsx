
import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LineNumberedTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  minHeight?: string;
  onScroll?: () => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
}

const LineNumberedTextarea: React.FC<LineNumberedTextareaProps> = ({
  value,
  onChange,
  placeholder,
  id,
  className,
  minHeight = "300px",
  onScroll,
  scrollRef,
}) => {
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate line numbers whenever text changes
  useEffect(() => {
    const lines = (value || "").split("\n");
    const numbers = lines.map((_, i) => (i + 1).toString());
    setLineNumbers(numbers);
  }, [value]);

  // Sync scroll between line numbers and textarea
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current && lineNumbersRef.current && scrollContainerRef.current) {
      // Synchronize vertical and horizontal scrolling
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      scrollContainerRef.current.scrollLeft = textareaRef.current.scrollLeft;
      
      if (onScroll) {
        onScroll();
      }
    }
  };

  return (
    <div 
      className="line-numbered-wrapper w-full overflow-hidden"
      style={{ minHeight }}
      ref={containerRef}
    >
      <div 
        className="relative flex w-full overflow-hidden"
        ref={scrollContainerRef}
        style={{ overflowX: 'auto' }}
      >
        <div 
          ref={lineNumbersRef} 
          className="line-numbers-container bg-slate-100 dark:bg-slate-800/95"
          style={{ 
            minHeight,
            zIndex: 10,
            position: "sticky",
            left: 0,
            top: 0,
            bottom: 0,
            overflow: "hidden",
            borderRight: "1px solid var(--border)",
            minWidth: "48px"
          }}
        >
          {lineNumbers.map((num, i) => (
            <div key={i} className="leading-6 h-6 px-2 text-xs text-right text-muted-foreground">
              {num}
            </div>
          ))}
          {/* Add one extra line number to ensure there's always space to type on a new line */}
          <div className="leading-6 h-6 px-2 text-xs text-right text-muted-foreground">{(lineNumbers.length + 1).toString()}</div>
        </div>
        
        <div className="relative flex-1 overflow-hidden">
          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={onChange}
            onScroll={handleScroll}
            placeholder={placeholder}
            className={`line-numbered-textarea min-h-[${minHeight}] font-mono text-sm bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-200 focus:ring-1 focus:ring-primary/30 w-full ${className}`}
            style={{ 
              minHeight, 
              lineHeight: "1.5rem", 
              position: "relative", 
              zIndex: 5,
              width: "100%",
              paddingLeft: "8px", // Reduce padding as line numbers are now in a separate container
              whiteSpace: "pre", 
              overflowX: "auto", // Enable horizontal scrolling
              overflowY: "auto", // Keep vertical scrolling
              resize: "none" // Disable resize since we're controlling it
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LineNumberedTextarea;
