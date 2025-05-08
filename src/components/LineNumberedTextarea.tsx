
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate line numbers whenever text changes
  useEffect(() => {
    const lines = (value || "").split("\n");
    const numbers = lines.map((_, i) => (i + 1).toString());
    setLineNumbers(numbers);
  }, [value]);

  // Handle scroll synchronization
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (textareaRef.current && lineNumbersRef.current && containerRef.current) {
      // Since both elements are in the same scrollable container, they will scroll together
      if (onScroll) {
        onScroll();
      }
    }
  };

  // Function to auto-resize the textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      // Reset the height first to get the correct scrollHeight
      textareaRef.current.style.height = 'auto';
      // Set the height to the scrollHeight to fit the content
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Adjust height on content change
  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  return (
    <div 
      className="line-numbered-wrapper w-full border rounded-md hover:border-primary/50 transition-all duration-200"
      style={{ minHeight }}
      ref={scrollRef}
    >
      <div 
        ref={containerRef}
        className="flex w-full overflow-auto"
        style={{ maxHeight: minHeight }}
        onScroll={handleScroll}
      >
        <div 
          ref={lineNumbersRef} 
          className="line-numbers-container bg-slate-100 dark:bg-slate-800/95 sticky left-0 py-2"
          style={{ 
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
        
        <div className="w-full py-2">
          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => {
              onChange(e);
              // We'll adjust height after the value changes through the useEffect
            }}
            placeholder={placeholder}
            className={`line-numbered-textarea border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full font-mono text-sm p-0 bg-transparent overflow-hidden ${className}`}
            style={{ 
              lineHeight: "1.5rem", 
              paddingLeft: "8px",
              whiteSpace: "pre",
              resize: "none",
              minHeight: "auto", // Let the content dictate the height
              height: "auto", // Will be set dynamically
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LineNumberedTextarea;
