import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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

const LineNumberedTextarea: React.FC<LineNumberedTextareaProps> = ({ value, onChange, placeholder, id, className, height = '300px', onScroll, scrollRef }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Calculate line numbers using useMemo for better performance
  const lineNumbers = useMemo(() => {
    const lines = (value || '').split('\n');
    return lines.map((_, i) => (i + 1).toString());
  }, [value]);

  // Handle scroll synchronization - optimized for better performance
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (lineNumbersRef.current && textareaRef.current) {
          lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;

          if (onScroll) {
            onScroll();
          }
        }
      });
    }
  };

  // Handle paste event to update scroll position after pasting
  const handlePaste = () => {
    // Use requestAnimationFrame to ensure this runs after the paste event completes
    setTimeout(() => {
      handleScroll();
    }, 0);
  };

  // Set up event listeners
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

  // Get dimensions based on device type
  const lineNumberWidth = isMobile ? '32px' : '48px';
  const textareaLeftPadding = isMobile ? 'pl-[40px]' : 'pl-[56px]';
  const lineHeight = isMobile ? '1.3rem' : '1.5rem';
  const lineNumberTextSize = isMobile ? 'text-[10px]' : 'text-xs';
  const lineNumberPadding = isMobile ? 'px-1' : 'px-2';
  const lineNumberHeight = isMobile ? 'h-[1.3rem]' : 'h-6';
  const lineNumberLineHeight = isMobile ? 'leading-[1.3rem]' : 'leading-6';

  return (
    <div className="line-numbered-wrapper w-full border rounded-md hover:border-primary/50 transition-all duration-200" style={{ height }} ref={scrollRef}>
      <div ref={containerRef} className="flex w-full h-full relative">
        <div
          ref={lineNumbersRef}
          className="line-numbers-container bg-slate-100 dark:bg-slate-800/95 absolute left-0 top-0 bottom-0 py-2 overflow-hidden scrollbar-none"
          style={{
            zIndex: 10,
            borderRight: '1px solid var(--border)',
            minWidth: lineNumberWidth,
            height: '100%',
          }}
        >
          {lineNumbers.map((num, i) => (
            <div
              key={i}
              className={`${lineNumberLineHeight} ${lineNumberHeight} ${lineNumberPadding} ${lineNumberTextSize} text-right text-muted-foreground`}
            >
              {num}
            </div>
          ))}
          {/* Add one extra line number to ensure there's always space to type on a new line */}
          <div
            className={`${lineNumberLineHeight} ${lineNumberHeight} ${lineNumberPadding} ${lineNumberTextSize} text-right text-muted-foreground`}
          >
            {(lineNumbers.length + 1).toString()}
          </div>
        </div>

        <div className={`w-full h-full ${textareaLeftPadding} py-2`}>
          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={onChange}
            onScroll={handleScroll}
            placeholder={placeholder}
            className={cn(
              'line-numbered-textarea border-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 w-full h-full font-mono p-0 bg-transparent overflow-auto scrollbar-thin',
              isMobile ? 'text-xs' : 'text-sm',
              className
            )}
            style={{
              lineHeight,
              paddingLeft: '0',
              whiteSpace: 'pre',
              resize: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LineNumberedTextarea;
