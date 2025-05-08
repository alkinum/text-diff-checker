
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
}

const LineNumberedTextarea: React.FC<LineNumberedTextareaProps> = ({
  value,
  onChange,
  placeholder,
  id,
  className,
  minHeight = "300px",
}) => {
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Calculate line numbers whenever text changes
  useEffect(() => {
    const lines = (value || "").split("\n");
    const numbers = lines.map((_, i) => (i + 1).toString());
    setLineNumbers(numbers);
  }, [value]);

  // Sync scroll between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="line-numbered-wrapper" style={{ minHeight }}>
      <div 
        ref={lineNumbersRef} 
        className="line-numbers" 
        style={{ minHeight }}
      >
        {lineNumbers.map((num, i) => (
          <div key={i} className="leading-6 h-6">
            {num}
          </div>
        ))}
        {/* Add one extra line number to ensure there's always space to type on a new line */}
        <div className="leading-6 h-6">{(lineNumbers.length + 1).toString()}</div>
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        placeholder={placeholder}
        className={`line-numbered-textarea min-h-[${minHeight}] font-mono text-sm bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-all duration-200 focus:ring-1 focus:ring-primary/30 ${className}`}
        style={{ minHeight }}
      />
    </div>
  );
};

export default LineNumberedTextarea;
