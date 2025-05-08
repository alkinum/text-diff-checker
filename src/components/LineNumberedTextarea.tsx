import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

interface LineNumberedTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  height?: string;
  onScroll?: () => void;
  scrollRef?: React.RefObject<HTMLDivElement>;
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
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      
      if (onScroll) {
        onScroll();
      }
    }
  };
  
  // Handle paste event to update line numbers immediately
  const handlePaste = () => {
    // Use setTimeout to ensure this runs after the paste event completes
    setTimeout(() => {
      if (textareaRef.current && lineNumbersRef.current) {
        // Update line numbers
        const lines = textareaRef.current.value.split("\n");
        const numbers = lines.map((_, i) => (i + 1).toString());
        setLineNumbers(numbers);
        
        // Synchronize scroll position after the line numbers have been updated
        setTimeout(() => {
          if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
          }
        }, 10);
      }
    }, 0);
  };
  
  // Ensure line numbers container stays in sync with textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', handleScroll);
      textarea.addEventListener('paste', handlePaste);
      return () => {
        textarea.removeEventListener('scroll', handleScroll);
        textarea.removeEventListener('paste', handlePaste);
      };
    }
  }, []);

  return (
    <div 
      className="line-numbered-wrapper w-full border rounded-md hover:border-primary/50 transition-all duration-200"
      style={{ height }}
      ref={scrollRef}
    >
      <div 
        ref={containerRef}
        className="flex w-full h-full relative"
      >
        <div 
          ref={lineNumbersRef} 
          className="line-numbers-container bg-slate-100 dark:bg-slate-800/95 absolute left-0 top-0 bottom-0 py-2 overflow-hidden"
          style={{ 
            zIndex: 10,
            borderRight: "1px solid var(--border)",
            minWidth: "48px",
            height: "100%"
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
        
        <div className="w-full h-full pl-12 py-2">
          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={onChange}
            onScroll={handleScroll}
            placeholder={placeholder}
            className={`line-numbered-textarea border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full h-full font-mono text-sm p-0 bg-transparent overflow-auto ${className}`}
            style={{
              lineHeight: "1.5rem",
              paddingLeft: "8px",
              whiteSpace: "pre",
              resize: "none"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LineNumberedTextarea;
