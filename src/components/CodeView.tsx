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
import { useIsMobile } from '@/hooks/use-mobile';

// Load Prism CSS theme
import 'prismjs/themes/prism.css';

interface CodeViewProps {
  content: string;
  language: string;
  lines?: DiffResultWithLineNumbers[];
  showLineNumbers?: boolean;
  title?: string; // Kept for compatibility but not used if parent handles it
  scrollRef?: React.RefObject<HTMLDivElement>;
  horizontalScrollRef?: React.RefObject<HTMLPreElement>;
  position?: 'left' | 'right'; 
  isExpanded?: boolean; 
  maxHeight?: string; 
}

const LINE_HEIGHT_CLASS = 'h-6'; 

const CodeView: React.FC<CodeViewProps> = ({
  content,
  language,
  lines,
  showLineNumbers = true,
  position = 'left',
  isExpanded = false,
  maxHeight = '70vh',
  scrollRef,
  horizontalScrollRef
}) => {
  const codeRef = useRef<HTMLPreElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [content, language]);

  // Render Diff View
  if (lines && lines.length > 0) {
    return (
      <div
        ref={scrollRef}
        className="flex w-full overflow-y-auto scrollbar-thin bg-background"
        style={{
          maxHeight: !isExpanded ? maxHeight : 'none',
        }}
      >
        {showLineNumbers && (
          <div 
            className="flex flex-col flex-shrink-0 text-right select-none bg-muted/20 border-r border-border/50 py-2"
            style={{ minWidth: isMobile ? "32px" : "48px" }}
          >
            {lines.map((line, i) => (
              <div
                key={i}
                className={`${LINE_HEIGHT_CLASS} leading-6 ${isMobile ? 'px-1 text-[10px]' : 'px-2 text-xs'} text-muted-foreground/50 font-mono`}
              >
                {line.spacer ? '\u00A0' : line.lineNumber}
              </div>
            ))}
          </div>
        )}
        
        <pre
          ref={horizontalScrollRef}
          className="m-0 p-0 flex-grow overflow-x-auto scrollbar-thin py-2"
        >
          <code
            className={`language-${language} block min-w-full w-max`}
          >
            {lines.map((line, i) => {
              if (line.spacer) {
                return <div key={i} className={`${LINE_HEIGHT_CLASS} leading-6`}>&nbsp;</div>;
              }

              let className = `${LINE_HEIGHT_CLASS} leading-6 px-4 w-full inline-block`;

              if (position === 'left' && line.removed) {
                className += " line-removed";
              } else if (position === 'right' && line.added) {
                className += " line-added";
              } else if (line.modified) {
                 // Optionally handle modified lines if we want a different background, 
                 // but typically they are just containers for inline diffs.
                 className += " line-modified"; 
              }

              // Inline changes
              if (line.inlineChanges && line.inlineChanges.length > 0) {
                return (
                  <div key={i} className={className}>
                    {line.inlineChanges.map((part, j) => {
                      if (!part.value) return null;
                      
                      let spanClass = "";
                      if (position === 'left' && part.removed) {
                        spanClass = "token-removed";
                      } else if (position === 'right' && part.added) {
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
    );
  }

  // Render Standard Code View
  return (
    <div
      ref={scrollRef}
      className="flex w-full overflow-y-auto scrollbar-thin bg-background"
      style={{
        maxHeight: !isExpanded ? maxHeight : 'none',
      }}
    >
      <pre
        ref={codeRef}
        className="m-0 p-4 w-full overflow-x-auto scrollbar-thin"
      >
        <code className={`language-${language} whitespace-pre`}>{content || " "}</code>
      </pre>
    </div>
  );
};

export default CodeView;
