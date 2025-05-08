import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-ini';
import { type DiffResultWithLineNumbers } from '@/utils/diff/types';

// Load Prism CSS theme
import 'prismjs/themes/prism.css';

interface CodeViewProps {
  content: string;
  language: string;
  lines?: DiffResultWithLineNumbers[];
  showLineNumbers?: boolean;
  title?: string;
  scrollRef?: React.RefObject<HTMLDivElement>;
  horizontalScrollRef?: React.RefObject<HTMLPreElement>;
  position?: 'left' | 'right'; // To determine if it's the left or right view
  isExpanded?: boolean; // Added to control expansion
  maxHeight?: string; // Added to control max height
}

const LINE_HEIGHT = 'h-6'; // Consistent line height class

const CodeView: React.FC<CodeViewProps> = ({ 
  content, 
  language, 
  lines, 
  showLineNumbers = true,
  title,
  position = 'left', // Default to left position
  isExpanded = false, // Default to not expanded
  maxHeight = '70vh', // Default max height
  scrollRef,
  horizontalScrollRef
}) => {
  const codeRef = useRef<HTMLPreElement>(null);

  // Highlight code when component mounts or when content/language changes
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [content, language]);

  // If we have line-by-line diff data
  if (lines && lines.length > 0) {
    return (
      <div 
        ref={scrollRef} // Assign scrollRef here
        className="flex flex-col w-full relative scrollbar-none"
        style={{ 
          maxHeight: !isExpanded ? maxHeight : 'none', 
          overflowY: !isExpanded ? 'auto' : 'visible'
        }}
      >
        {title && (
          <div className="px-4 py-2 font-medium text-sm bg-slate-100 dark:bg-slate-800/95 border-b sticky top-0 z-20">
            {title}
          </div>
        )}
        <div className="flex">
          {showLineNumbers && (
            <div className="line-numbers-container py-4 bg-slate-100 dark:bg-slate-800/95 sticky left-0 z-10 border-r border-border/50" 
                 style={{ minWidth: "48px", borderRight: "1px solid var(--border)" }}>
              {lines.map((line, i) => (
                <div key={i} className={`leading-6 ${LINE_HEIGHT} px-2 text-xs text-right text-muted-foreground ${line.spacer ? 'text-transparent' : ''}`}>
                  {line.spacer ? '\u00A0' : line.lineNumber}
                </div>
              ))}
            </div>
          )}
          <pre 
            ref={horizontalScrollRef}
            className="p-4 pl-2 m-0 flex-grow overflow-x-auto scrollbar-thin"
          >
            <code 
              className={`language-${language} whitespace-pre`}
              style={{ display: 'table', width: 'max-content', minWidth: '100%' }}
            >
              {lines.map((line, i) => {
                // Handle spacer lines
                if (line.spacer) {
                  return <div key={i} className={`block ${LINE_HEIGHT} leading-6`}>&nbsp;</div>;
                }
                
                // Determine line class based on position and line type
                let className = `block ${LINE_HEIGHT} leading-6`;
                
                if (position === 'left' && line.removed) {
                  className += " line-removed";
                } else if (position === 'right' && line.added) {
                  className += " line-added";
                }
                
                // If this line has inline changes, render them
                if (line.inlineChanges && line.inlineChanges.length > 0) {
                  return (
                    <div key={i} className={className}>
                      {line.inlineChanges.map((part, j) => {
                        // Skip rendering empty parts
                        if (!part.value) return null;
                        
                        let spanClass = "";
                        
                        // Apply highlighting for removed parts in original (left)
                        if (position === 'left' && part.removed) {
                          spanClass = "token-removed";
                        }
                        // Apply highlighting for added parts in modified (right)
                        else if (position === 'right' && part.added) {
                          spanClass = "token-added";
                        }
                        
                        return (
                          <span 
                            key={j} 
                            className={spanClass}
                            dangerouslySetInnerHTML={{ 
                              __html: Prism.highlight(
                                part.value, 
                                Prism.languages[language] || Prism.languages.plaintext, 
                                language
                              )
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                }
                
                // Regular line rendering (no inline changes)
                return (
                  <div key={i} className={className}>
                    <span 
                      dangerouslySetInnerHTML={{ 
                        __html: Prism.highlight(
                          line.value || " ", 
                          Prism.languages[language] || Prism.languages.plaintext, 
                          language
                        )
                      }} 
                    />
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  // Standard syntax highlighted view
  return (
    <div 
      ref={scrollRef}
      className="flex flex-col w-full scrollbar-none"
      style={{ 
        maxHeight: !isExpanded ? maxHeight : 'none', 
        overflowY: !isExpanded ? 'auto' : 'visible' 
      }}
    >
      {title && (
        <div className="px-4 py-2 font-medium text-sm bg-slate-100 dark:bg-slate-800/95 border-b sticky top-0 z-20">
          {title}
        </div>
      )}
      <div className="w-full">
        <pre 
          ref={codeRef}
          className="p-4 m-0 w-full overflow-x-auto scrollbar-thin"
        >
          <code className={`language-${language} whitespace-pre`}>{content || " "}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeView;
