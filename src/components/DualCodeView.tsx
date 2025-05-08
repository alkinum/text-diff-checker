
import React, { useRef, useEffect, useState } from 'react';
import CodeView from '@/components/CodeView';
import { type FormattedDiff } from '@/utils/diff';
import DiffMinimap from '@/components/DiffMinimap';
import { Copy, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DualCodeViewProps {
  leftContent: string;
  rightContent: string;
  diff: FormattedDiff;
  language: string;
}

const DualCodeView: React.FC<DualCodeViewProps> = ({
  leftContent,
  rightContent,
  diff,
  language
}) => {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  
  // Set up scroll synchronization
  useEffect(() => {
    const leftElement = leftScrollRef.current;
    const rightElement = rightScrollRef.current;
    
    if (!leftElement || !rightElement) return;
    
    let isLeftScrolling = false;
    let isRightScrolling = false;
    
    const handleLeftScroll = () => {
      if (!isRightScrolling && leftElement && rightElement) {
        isLeftScrolling = true;
        rightElement.scrollTop = leftElement.scrollTop;
        rightElement.scrollLeft = leftElement.scrollLeft;
        setTimeout(() => {
          isLeftScrolling = false;
        }, 50);
      }
    };
    
    const handleRightScroll = () => {
      if (!isLeftScrolling && leftElement && rightElement) {
        isRightScrolling = true;
        leftElement.scrollTop = rightElement.scrollTop;
        leftElement.scrollLeft = rightElement.scrollLeft;
        setTimeout(() => {
          isRightScrolling = false;
        }, 50);
      }
    };
    
    leftElement.addEventListener('scroll', handleLeftScroll);
    rightElement.addEventListener('scroll', handleRightScroll);
    
    return () => {
      leftElement.removeEventListener('scroll', handleLeftScroll);
      rightElement.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  // Add summary stats for the diff
  const removedCount = diff.left.filter(line => line.removed).length;
  const addedCount = diff.right.filter(line => line.added).length;
  const leftLinesCount = diff.left.filter(line => !line.spacer).length;
  const rightLinesCount = diff.right.filter(line => !line.spacer).length;

  const copyLeftContent = () => {
    navigator.clipboard.writeText(leftContent);
  };

  const copyRightContent = () => {
    navigator.clipboard.writeText(rightContent);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
    if (!expanded) {
      // If expanding, scroll to the component
      setTimeout(() => {
        const element = document.getElementById('diff-view-container');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <div id="diff-view-container" className="flex flex-col bg-background border rounded-md shadow-sm overflow-hidden">
      {/* Summary header */}
      <div className="flex justify-between items-center text-sm p-2 border-b bg-slate-100 dark:bg-slate-800/95 sticky top-0 z-30">
        <div className="flex items-center">
          <span className="inline-flex items-center bg-diff-removed-bg text-diff-removed-text px-3 py-1 rounded-full mr-2 font-medium">
            <span className="mr-1">-</span> {removedCount} {removedCount === 1 ? 'removal' : 'removals'}
          </span>
          <span className="text-muted-foreground">{leftLinesCount} {leftLinesCount === 1 ? 'line' : 'lines'}</span>
          <button 
            onClick={copyLeftContent} 
            className="ml-2 p-1 text-muted-foreground hover:text-foreground flex items-center"
            aria-label="Copy original content"
          >
            Copy <Copy className="h-3.5 w-3.5 ml-1" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleExpand}
            className="flex items-center gap-1"
            aria-label={expanded ? "Minimize diff view" : "Expand diff view"}
          >
            {expanded ? (
              <>
                <Minimize className="h-3.5 w-3.5" /> Minimize
              </>
            ) : (
              <>
                <Maximize className="h-3.5 w-3.5" /> Expand
              </>
            )}
          </Button>
          <div className="flex items-center">
            <span className="inline-flex items-center bg-diff-added-bg text-diff-added-text px-3 py-1 rounded-full mr-2 font-medium">
              <span className="mr-1">+</span> {addedCount} {addedCount === 1 ? 'addition' : 'additions'}
            </span>
            <span className="text-muted-foreground">{rightLinesCount} {rightLinesCount === 1 ? 'line' : 'lines'}</span>
            <button 
              onClick={copyRightContent} 
              className="ml-2 p-1 text-muted-foreground hover:text-foreground flex items-center"
              aria-label="Copy modified content"
            >
              Copy <Copy className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Diff view */}
      <div className="grid grid-cols-2 gap-0 relative">
        <div className="relative border-r">
          <div 
            ref={leftScrollRef} 
            className="overflow-auto scrollbar-none"
            style={{ 
              maxHeight: expanded ? 'none' : '70vh',
              height: expanded ? 'auto' : '70vh'
            }}
          >
            <CodeView 
              content={leftContent} 
              language={language} 
              lines={diff.left}
              title="Original"
              position="left"
            />
          </div>
          <DiffMinimap 
            lines={diff.left} 
            containerRef={leftScrollRef}
            position="left"
          />
        </div>
        
        <div className="relative">
          <div 
            ref={rightScrollRef} 
            className="overflow-auto scrollbar-none"
            style={{ 
              maxHeight: expanded ? 'none' : '70vh',
              height: expanded ? 'auto' : '70vh'
            }}
          >
            <CodeView 
              content={rightContent} 
              language={language} 
              lines={diff.right}
              title="Modified"
              position="right"
            />
          </div>
          <DiffMinimap 
            lines={diff.right} 
            containerRef={rightScrollRef}
            position="right"
          />
        </div>
      </div>
    </div>
  );
};

export default DualCodeView;
