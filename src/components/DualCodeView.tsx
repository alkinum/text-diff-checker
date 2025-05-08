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

const DUAL_CODE_VIEW_MAX_HEIGHT = '70vh';

const DualCodeView: React.FC<DualCodeViewProps> = ({
  leftContent,
  rightContent,
  diff,
  language
}) => {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const leftHorizScrollRef = useRef<HTMLPreElement>(null);
  const rightHorizScrollRef = useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);

  // Set up scroll synchronization
  useEffect(() => {
    const leftVertElement = leftScrollRef.current;
    const rightVertElement = rightScrollRef.current;
    const leftHorizElement = leftHorizScrollRef.current;
    const rightHorizElement = rightHorizScrollRef.current;
    
    if (!leftVertElement || !rightVertElement || !leftHorizElement || !rightHorizElement) return;
    
    let isLeftScrolling = false;
    let isRightScrolling = false;
    
    const handleLeftScroll = () => {
      if (!isRightScrolling && leftVertElement && rightVertElement && leftHorizElement && rightHorizElement) {
        isLeftScrolling = true;
        rightVertElement.scrollTop = leftVertElement.scrollTop;
        rightHorizElement.scrollLeft = leftHorizElement.scrollLeft;
        setTimeout(() => {
          isLeftScrolling = false;
        }, 20);
      }
    };
    
    const handleRightScroll = () => {
      if (!isLeftScrolling && leftVertElement && rightVertElement && leftHorizElement && rightHorizElement) {
        isRightScrolling = true;
        leftVertElement.scrollTop = rightVertElement.scrollTop;
        leftHorizElement.scrollLeft = rightHorizElement.scrollLeft;
        setTimeout(() => {
          isRightScrolling = false;
        }, 20);
      }
    };
    
    leftVertElement.addEventListener('scroll', handleLeftScroll);
    leftHorizElement.addEventListener('scroll', handleLeftScroll);

    rightVertElement.addEventListener('scroll', handleRightScroll);
    rightHorizElement.addEventListener('scroll', handleRightScroll);
    
    return () => {
      leftVertElement.removeEventListener('scroll', handleLeftScroll);
      leftHorizElement.removeEventListener('scroll', handleLeftScroll);
      rightVertElement.removeEventListener('scroll', handleRightScroll);
      rightHorizElement.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  // Check content height to determine if expand button should be shown
  useEffect(() => {
    const checkContentHeight = () => {
      const leftElement = leftScrollRef.current;
      const rightElement = rightScrollRef.current;
      
      let overflows = false;
      if (leftElement) {
        // Check if scrollHeight is greater than clientHeight for the left CodeView
        // clientHeight will be based on DUAL_CODE_VIEW_MAX_HEIGHT when not expanded
        const leftMaxHeightVh = parseInt(DUAL_CODE_VIEW_MAX_HEIGHT);
        const leftMaxHeightPx = (leftMaxHeightVh / 100) * window.innerHeight;
        if (leftElement.scrollHeight > leftMaxHeightPx) {
          overflows = true;
        }
      }
      if (!overflows && rightElement) {
        // Check for the right CodeView if left doesn't overflow
        const rightMaxHeightVh = parseInt(DUAL_CODE_VIEW_MAX_HEIGHT);
        const rightMaxHeightPx = (rightMaxHeightVh / 100) * window.innerHeight;
        if (rightElement.scrollHeight > rightMaxHeightPx) {
          overflows = true;
        }
      }
      setShowExpandButton(overflows || expanded);
    };

    checkContentHeight();
  }, [leftContent, rightContent, expanded, diff]);

  // Add summary stats for the diff
  const removedCount = diff.left.filter(line => line.removed).length;
  const addedCount = diff.right.filter(line => line.added).length;
  const leftLinesCount = diff.left.filter(line => !line.spacer).length;
  const rightLinesCount = diff.right.filter(line => !line.spacer).length;

  // Determine if we should show the indicators
  const showRemovedIndicator = removedCount > 0;
  const showAddedIndicator = addedCount > 0;

  const copyLeftContent = () => {
    navigator.clipboard.writeText(leftContent);
  };

  const copyRightContent = () => {
    navigator.clipboard.writeText(rightContent);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div id="diff-view-container" className="flex flex-col bg-background border rounded-md shadow-sm overflow-hidden">
      {/* Summary header */}
      <div className="flex justify-between items-center text-sm p-2 border-b bg-slate-100 dark:bg-slate-800/95 sticky top-0 z-30">
        <div className="flex items-center">
          {showRemovedIndicator && (
            <span className="inline-flex items-center bg-diff-removed-bg text-diff-removed-text px-3 py-1 rounded-full mr-2 font-medium">
              <span className="mr-1">-</span> {removedCount} {removedCount === 1 ? 'removal' : 'removals'}
            </span>
          )}
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
          {showExpandButton && (
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
          )}
          <div className="flex items-center">
            {showAddedIndicator && (
              <span className="inline-flex items-center bg-diff-added-bg text-diff-added-text px-3 py-1 rounded-full mr-2 font-medium">
                <span className="mr-1">+</span> {addedCount} {addedCount === 1 ? 'addition' : 'additions'}
              </span>
            )}
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
            className="w-full"
          >
            <CodeView 
              scrollRef={leftScrollRef}
              horizontalScrollRef={leftHorizScrollRef}
              content={leftContent} 
              language={language} 
              lines={diff.left}
              title="Original"
              position="left"
              isExpanded={expanded}
              maxHeight={DUAL_CODE_VIEW_MAX_HEIGHT}
            />
          </div>
          <DiffMinimap 
            lines={diff.left} 
            containerRef={leftScrollRef}
            position="left"
            isExpanded={expanded}
          />
        </div>
        
        <div className="relative">
          <div 
            className="w-full"
          >
            <CodeView 
              scrollRef={rightScrollRef}
              horizontalScrollRef={rightHorizScrollRef}
              content={rightContent} 
              language={language} 
              lines={diff.right}
              title="Modified"
              position="right"
              isExpanded={expanded}
              maxHeight={DUAL_CODE_VIEW_MAX_HEIGHT}
            />
          </div>
          <DiffMinimap 
            lines={diff.right} 
            containerRef={rightScrollRef}
            position="right"
            isExpanded={expanded}
          />
        </div>
      </div>
    </div>
  );
};

export default DualCodeView;
