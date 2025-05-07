
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
  position?: 'left' | 'right'; // To determine if it's the left or right view
}

const CodeView: React.FC<CodeViewProps> = ({ 
  content, 
  language, 
  lines, 
  showLineNumbers = true,
  title,
  position = 'left' // Default to left position
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
      <div className="h-full flex flex-col">
        {title && (
          <div className="px-4 py-2 font-medium text-sm bg-card border-b sticky top-0 z-10">
            {title}
          </div>
        )}
        <div className="flex flex-1 min-w-full overflow-hidden">
          {showLineNumbers && (
            <div className="text-right pr-4 py-4 bg-muted/20 text-muted-foreground select-none min-w-[3rem] sticky left-0 z-10 border-r border-border/50">
              {lines.map((line, i) => (
                <div key={i} className={`text-xs leading-5 h-5 ${line.spacer ? 'text-transparent' : ''}`}>
                  {line.spacer ? '\u00A0' : line.lineNumber}
                </div>
              ))}
            </div>
          )}
          <pre className="p-4 overflow-visible flex-1 m-0">
            <code className={`language-${language}`}>
              {lines.map((line, i) => {
                // Handle spacer lines
                if (line.spacer) {
                  return <div key={i} className="block h-5">&nbsp;</div>;
                }
                
                // Determine line class based on position and line type
                let className = "block line-highlight h-5";
                
                if (position === 'left') {
                  // Original text block highlighting
                  if (line.removed) className += " line-removed";
                  else if (line.modified) className += " line-modified";
                } else {
                  // Modified text block highlighting
                  if (line.added) className += " line-added";
                  else if (line.modified) className += " line-modified";
                }
                
                // If this line has inline changes, render them
                if (line.inlineChanges && line.inlineChanges.length) {
                  return (
                    <div key={i} className={className}>
                      {line.inlineChanges.map((part, j) => {
                        // Only add highlighting class to actually changed parts
                        let spanClass = "";
                        if ((position === 'left' && part.removed) || 
                            (position === 'right' && part.added)) {
                          spanClass = position === 'left' ? "token-removed" : "token-added";
                        }
                        
                        return (
                          <span 
                            key={j} 
                            className={spanClass}
                            dangerouslySetInnerHTML={{ 
                              __html: part.value ? Prism.highlight(
                                part.value, 
                                Prism.languages[language] || Prism.languages.plaintext, 
                                language
                              ) : " "
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
    <div className="h-full flex flex-col">
      {title && (
        <div className="px-4 py-2 font-medium text-sm bg-card border-b sticky top-0">
          {title}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <pre ref={codeRef} className="p-4 m-0">
          <code className={`language-${language}`}>{content || " "}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeView;
