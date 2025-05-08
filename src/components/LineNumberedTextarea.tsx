
import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate line numbers whenever text changes
  useEffect(() => {
    const lines = (value || "").split("\n");
    const numbers = lines.map((_, i) => (i + 1).toString());
    setLineNumbers(numbers);
  }, [value]);

  // Handle scroll synchronization
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current && scrollContainerRef.current) {
      if (onScroll) {
        onScroll();
      }
    }
  };

  return (
    <div 
      className="line-numbered-wrapper w-full overflow-hidden border rounded-md hover:border-primary/50 transition-all duration-200"
      style={{ minHeight }}
      ref={wrapperRef}
    >
      <div 
        ref={scrollContainerRef}
        className="flex w-full overflow-auto"
        style={{ maxHeight: minHeight }}
      >
        <div 
          ref={lineNumbersRef} 
          className="line-numbers-container bg-slate-100 dark:bg-slate-800/95 sticky left-0"
          style={{ 
            minHeight,
            zIndex: 10,
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
        
        <Textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={onChange}
          onScroll={handleScroll}
          placeholder={placeholder}
          className={`line-numbered-textarea min-h-[${minHeight}] font-mono text-sm bg-background/50 backdrop-blur-sm border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full ${className}`}
          style={{ 
            minHeight, 
            lineHeight: "1.5rem", 
            paddingLeft: "8px",
            whiteSpace: "pre",
            resize: "none"
          }}
        />
      </div>
    </div>
  );
};

export default LineNumberedTextarea;
