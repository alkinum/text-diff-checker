
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
import { type DiffResultWithLineNumbers } from '@/utils/diffUtils';

// Load Prism CSS theme
import 'prismjs/themes/prism.css';

interface CodeViewProps {
  content: string;
  language: string;
  lines?: DiffResultWithLineNumbers[];
  showLineNumbers?: boolean;
  title?: string;
}

const CodeView: React.FC<CodeViewProps> = ({ 
  content, 
  language, 
  lines, 
  showLineNumbers = true,
  title
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
      <div className="relative overflow-hidden rounded-md border bg-background">
        {title && (
          <div className="px-4 py-2 border-b font-medium text-sm sticky top-0 bg-card z-10">
            {title}
          </div>
        )}
        <div className="flex overflow-auto">
          {showLineNumbers && (
            <div className="text-right pr-4 py-4 bg-muted/30 text-muted-foreground select-none min-w-[3rem]">
              {lines.map((line, i) => (
                <div key={i} className="text-xs leading-5">
                  {line.lineNumber}
                </div>
              ))}
            </div>
          )}
          <pre className="p-4 overflow-auto flex-1">
            <code>
              {lines.map((line, i) => {
                let className = "line-highlight";
                if (line.added) className += " line-added";
                if (line.removed) className += " line-removed";
                
                return (
                  <span key={i} className={className}>
                    {line.value || " "}&nbsp;
                  </span>
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
    <div className="relative overflow-hidden rounded-md border bg-background">
      {title && (
        <div className="px-4 py-2 border-b font-medium text-sm sticky top-0 bg-card">
          {title}
        </div>
      )}
      <pre ref={codeRef} className="language-plaintext">
        <code className={`language-${language}`}>{content || " "}</code>
      </pre>
    </div>
  );
};

export default CodeView;
