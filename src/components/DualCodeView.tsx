import React, { useRef, useEffect, useState } from 'react';
import CodeView from '@/components/CodeView';
import { type FormattedDiff } from '@/utils/diff';
import DiffMinimap from '@/components/DiffMinimap';
import { Copy, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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

  // Calculate accurate diff statistics
  const calculateStats = () => {
    // Only count real lines (not spacers)
    const realLeftLines = diff.left.filter(line => !line.spacer);
    const realRightLines = diff.right.filter(line => !line.spacer);

    // Get removed lines from left side
    const removedCount = realLeftLines.filter(line => line.removed && !line.modified).length;

    // Get modified lines (count only once)
    const modifiedCount = realLeftLines.filter(line => line.modified).length;

    // Get added lines from right side (excluding those that are marked as modified)
    const addedCount = realRightLines.filter(line => line.added && !line.modified).length;

    // Total lines in each side (excluding spacers)
    const leftLinesCount = realLeftLines.length;
    const rightLinesCount = realRightLines.length;

    // Calculate the maximum total lines for minimap consistency
    const maxTotalLines = Math.max(leftLinesCount, rightLinesCount);

    return {
      removedCount,
      addedCount,
      modifiedCount,
      leftLinesCount,
      rightLinesCount,
      maxTotalLines
    };
  };

  const stats = calculateStats();

  // Determine if we should show the indicators
  const showRemovedIndicator = stats.removedCount > 0 || stats.modifiedCount > 0;
  const showAddedIndicator = stats.addedCount > 0 || stats.modifiedCount > 0;

  // For display purposes, include modified lines in both counts
  const displayRemovedCount = stats.removedCount + stats.modifiedCount;
  const displayAddedCount = stats.addedCount + stats.modifiedCount;

  const copyLeftContent = () => {
    navigator.clipboard.writeText(leftContent);
  };

  const copyRightContent = () => {
    navigator.clipboard.writeText(rightContent);
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Render the summary header for original (left) content
  const renderLeftSummary = () => (
    <div className="flex items-center">
      {showRemovedIndicator && (
        <span className="inline-flex items-center bg-diff-removed-bg text-diff-removed-text px-3 py-1 rounded-full mr-2 font-medium">
          <span className="mr-1">-</span> {displayRemovedCount} {displayRemovedCount === 1 ? 'removal' : 'removals'}
        </span>
      )}
      <span className="text-muted-foreground">{stats.leftLinesCount} {stats.leftLinesCount === 1 ? 'line' : 'lines'}</span>
      <button
        onClick={copyLeftContent}
        className="ml-2 p-1 text-muted-foreground hover:text-foreground flex items-center"
        aria-label="Copy original content"
      >
        Copy <Copy className="h-3.5 w-3.5 ml-1" />
      </button>
    </div>
  );

  // Render the summary header for modified (right) content
  const renderRightSummary = () => (
    <div className="flex items-center">
      {showAddedIndicator && (
        <span className="inline-flex items-center bg-diff-added-bg text-diff-added-text px-3 py-1 rounded-full mr-2 font-medium">
          <span className="mr-1">+</span> {displayAddedCount} {displayAddedCount === 1 ? 'addition' : 'additions'}
        </span>
      )}
      <span className="text-muted-foreground">{stats.rightLinesCount} {stats.rightLinesCount === 1 ? 'line' : 'lines'}</span>
      <button
        onClick={copyRightContent}
        className="ml-2 p-1 text-muted-foreground hover:text-foreground flex items-center"
        aria-label="Copy modified content"
      >
        Copy <Copy className="h-3.5 w-3.5 ml-1" />
      </button>
    </div>
  );

  // Render the summary header for original (left) content - mobile optimized
  const renderMobileLeftSummary = () => (
    <div className="flex items-center">
      {showRemovedIndicator && (
        <span className="inline-flex items-center bg-diff-removed-bg text-diff-removed-text px-2 py-0.5 rounded-full text-xs font-medium">
          <span className="mr-0.5">-</span> {displayRemovedCount}
        </span>
      )}
      <span className="text-muted-foreground text-xs ml-2">{stats.leftLinesCount} {stats.leftLinesCount === 1 ? 'line' : 'lines'}</span>
      <button
        onClick={copyLeftContent}
        className="ml-2 p-0.5 text-muted-foreground hover:text-foreground flex items-center text-xs"
        aria-label="Copy original content"
      >
        <Copy className="h-3 w-3 ml-0.5" />
      </button>
    </div>
  );

  // Render the summary header for modified (right) content - mobile optimized
  const renderMobileRightSummary = () => (
    <div className="flex items-center">
      {showAddedIndicator && (
        <span className="inline-flex items-center bg-diff-added-bg text-diff-added-text px-2 py-0.5 rounded-full text-xs font-medium">
          <span className="mr-0.5">+</span> {displayAddedCount}
        </span>
      )}
      <span className="text-muted-foreground text-xs ml-2">{stats.rightLinesCount} {stats.rightLinesCount === 1 ? 'line' : 'lines'}</span>
      <button
        onClick={copyRightContent}
        className="ml-2 p-0.5 text-muted-foreground hover:text-foreground flex items-center text-xs"
        aria-label="Copy modified content"
      >
        <Copy className="h-3 w-3 ml-0.5" />
      </button>
    </div>
  );

  return (
    <div id="diff-view-container" className="flex flex-col bg-background border rounded-md shadow-sm overflow-hidden">
      {/* Summary header - only show on desktop or if expand button is needed on mobile */}
      {(!isMobile || (isMobile && showExpandButton)) && (
        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-center text-sm p-2 border-b bg-slate-100 dark:bg-slate-800/95 sticky top-0 z-30`}>
          {isMobile ? (
            <div className="flex justify-center items-center w-full">
              {showExpandButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleExpand}
                  className="flex items-center gap-1 text-xs py-1 px-2 h-auto"
                  aria-label={expanded ? "Minimize diff view" : "Expand diff view"}
                >
                  {expanded ? (
                    <>
                      <Minimize className="h-3 w-3" /> Minimize
                    </>
                  ) : (
                    <>
                      <Maximize className="h-3 w-3" /> Expand
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <>
              {renderLeftSummary()}
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
                {renderRightSummary()}
              </div>
            </>
          )}
        </div>
      )}

      {/* Diff view - responsive grid */}
      <div className={`${isMobile ? 'flex flex-col' : 'grid grid-cols-2'} gap-0 relative`}>
        <div className={`relative ${isMobile ? 'border-b' : 'border-r'}`}>
          {isMobile && (
            <div className="flex justify-between items-center w-full p-1.5 bg-slate-50 dark:bg-slate-800/75 border-b select-none">
              <span className="text-xs font-medium text-muted-foreground">Original</span>
              {renderMobileLeftSummary()}
            </div>
          )}
          <div className="w-full">
            <CodeView
              scrollRef={leftScrollRef}
              horizontalScrollRef={leftHorizScrollRef}
              content={leftContent}
              language={language}
              lines={diff.left}
              title="Original"
              position="left"
              isExpanded={expanded}
              maxHeight={isMobile ? '40vh' : DUAL_CODE_VIEW_MAX_HEIGHT}
            />
          </div>
          <DiffMinimap
            lines={diff.left}
            containerRef={leftScrollRef}
            position="left"
            isExpanded={expanded}
            maxTotalLines={stats.maxTotalLines}
          />
        </div>

        <div className="relative">
          {isMobile && (
            <div className="flex justify-between items-center w-full p-1.5 bg-slate-50 dark:bg-slate-800/75 border-b select-none">
              <span className="text-xs font-medium text-muted-foreground">Modified</span>
              {renderMobileRightSummary()}
            </div>
          )}
          <div className="w-full">
            <CodeView
              scrollRef={rightScrollRef}
              horizontalScrollRef={rightHorizScrollRef}
              content={rightContent}
              language={language}
              lines={diff.right}
              title="Modified"
              position="right"
              isExpanded={expanded}
              maxHeight={isMobile ? '40vh' : DUAL_CODE_VIEW_MAX_HEIGHT}
            />
          </div>
          <DiffMinimap
            lines={diff.right}
            containerRef={rightScrollRef}
            position="right"
            isExpanded={expanded}
            maxTotalLines={stats.maxTotalLines}
          />
        </div>
      </div>

      {/* Mobile floating expand button when needed */}
      {isMobile && showExpandButton && !expanded && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleExpand}
            className="flex items-center gap-1 rounded-full shadow-lg"
            aria-label="Expand diff view"
          >
            <Maximize className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DualCodeView;
