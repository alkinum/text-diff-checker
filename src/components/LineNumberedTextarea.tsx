
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

  // Calculate line numbers whenever text changes
  useEffect(() => {
    const lines = (value || "").split("\n");
    const numbers = lines.map((_, i) => (i + 1).toString());
    setLineNumbers(numbers);
  }, [value]);

  // Sync scroll between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current && wrapperRef.current) {
      // Synchronize vertical scrolling
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      
      if (onScroll) {
        onScroll();
      }
    }
  };

  return (
    <div 
      className="line-numbered-wrapper w-full"
      style={{ minHeight }}
      ref={containerRef}
    >
      <div className="relative flex w-full" ref={wrapperRef}>
        <div 
          ref={lineNumbersRef} 
          className="line-numbers bg-slate-100 dark:bg-slate-800/95" 
          style={{ 
            minHeight, 
            zIndex: 10,
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            overflow: "hidden"
          }}
        >
          {lineNumbers.map((num, i) => (
            <div key={i} className="leading-6 h-6 px-2">
              {num}
            </div>
          ))}
          {/* Add one extra line number to ensure there's always space to type on a new line */}
          <div className="leading-6 h-6 px-2">{(lineNumbers.length + 1).toString()}</div>
        </div>
        
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
            paddingLeft: "55px", // Ensure text doesn't overlap with line numbers
            whiteSpace: "nowrap", // Prevent text wrapping
            overflowX: "auto" // Enable horizontal scrolling
          }}
        />
      </div>
    </div>
  );
};

export default LineNumberedTextarea;
