import React, { useRef, useEffect, useState } from 'react';
import CodeView from '@/components/CodeView';
import { type FormattedDiff } from '@/utils/diff';
import DiffMinimap from '@/components/DiffMinimap';
import { Copy, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
      if (!isRightScrolling) {
        isLeftScrolling = true;
        rightVertElement.scrollTop = leftVertElement.scrollTop;
        rightHorizElement.scrollLeft = leftHorizElement.scrollLeft;
        setTimeout(() => { isLeftScrolling = false; }, 20);
      }
    };

    const handleRightScroll = () => {
      if (!isLeftScrolling) {
        isRightScrolling = true;
        leftVertElement.scrollTop = rightVertElement.scrollTop;
        leftHorizElement.scrollLeft = rightHorizElement.scrollLeft;
        setTimeout(() => { isRightScrolling = false; }, 20);
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

  useEffect(() => {
    // Determine if we need an expand button
    const checkHeight = () => {
      if (leftScrollRef.current && leftScrollRef.current.scrollHeight > 500) {
        setShowExpandButton(true);
      } else if (rightScrollRef.current && rightScrollRef.current.scrollHeight > 500) {
        setShowExpandButton(true);
      } else {
        setShowExpandButton(false);
      }
    };
    // Simple timeout to wait for render
    setTimeout(checkHeight, 100);
  }, [leftContent, rightContent, diff]);

  const calculateStats = () => {
    const leftLines = Array.isArray(diff.left) ? diff.left : [];
    const rightLines = Array.isArray(diff.right) ? diff.right : [];
    
    // Filter out spacer lines for counting
    const realLeftLines = leftLines.filter(line => !line.spacer);
    const realRightLines = rightLines.filter(line => !line.spacer);

    const removedCount = realLeftLines.filter(line => line.removed && !line.modified).length;
    const addedCount = realRightLines.filter(line => line.added && !line.modified).length;
    // Modified lines exist in both but counting logic can vary. 
    // Let's count them based on where they appear or just unique modifications.
    // For simplicity, we just count them from one side or sum distinct modifications if possible.
    // Here we just count how many lines are marked 'modified'.
    const modifiedCount = realLeftLines.filter(line => line.modified).length;

    return {
      removedCount,
      addedCount,
      modifiedCount,
      leftLinesCount: realLeftLines.length,
      rightLinesCount: realRightLines.length,
      maxTotalLines: Math.max(leftLines.length, rightLines.length) // Use total including spacers for minimap
    };
  };

  const stats = calculateStats();

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const Header = ({ title, count, type, onCopy }: { title: string, count?: number, type?: 'added' | 'removed', onCopy: () => void }) => (
    <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b text-xs font-medium select-none h-10">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground uppercase tracking-wider">{title}</span>
        {count !== undefined && count > 0 && (
          <span className={cn(
            "px-1.5 py-0.5 rounded-sm text-[10px]",
            type === 'added' ? "bg-green-500/10 text-green-600 dark:text-green-400" : 
            type === 'removed' ? "bg-red-500/10 text-red-600 dark:text-red-400" : ""
          )}>
            {count} {type}
          </span>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopy} title="Copy">
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col bg-card border rounded-lg overflow-hidden relative">
      <div className={cn("grid", isMobile ? "grid-cols-1" : "grid-cols-2", "divide-x divide-border")}>
        {/* Left Pane */}
        <div className="flex flex-col min-w-0">
          <Header 
            title="Original" 
            count={stats.removedCount} 
            type="removed" 
            onCopy={() => copyContent(leftContent)} 
          />
          <div className="relative flex-1 min-h-0">
             <CodeView
              scrollRef={leftScrollRef}
              horizontalScrollRef={leftHorizScrollRef}
              content={leftContent}
              language={language}
              lines={diff.left}
              position="left"
              isExpanded={expanded}
              maxHeight={isMobile ? '40vh' : DUAL_CODE_VIEW_MAX_HEIGHT}
            />
             <DiffMinimap
                lines={diff.left}
                containerRef={leftScrollRef}
                position="left"
                isExpanded={expanded}
                maxTotalLines={stats.maxTotalLines}
              />
          </div>
        </div>

        {/* Right Pane */}
        <div className="flex flex-col min-w-0 border-t md:border-t-0">
          <Header 
            title="Modified" 
            count={stats.addedCount} 
            type="added" 
            onCopy={() => copyContent(rightContent)} 
          />
          <div className="relative flex-1 min-h-0">
            <CodeView
              scrollRef={rightScrollRef}
              horizontalScrollRef={rightHorizScrollRef}
              content={rightContent}
              language={language}
              lines={diff.right}
              position="right"
              isExpanded={expanded}
              maxHeight={isMobile ? '40vh' : DUAL_CODE_VIEW_MAX_HEIGHT}
            />
             <DiffMinimap
                lines={diff.right}
                containerRef={rightScrollRef}
                position="right"
                isExpanded={expanded}
                maxTotalLines={stats.maxTotalLines}
              />
          </div>
        </div>
      </div>

      {showExpandButton && (
        <div className="absolute bottom-4 right-4 z-50">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="shadow-lg opacity-90 hover:opacity-100 transition-opacity"
          >
            {expanded ? (
              <>
                <Minimize className="mr-2 h-3 w-3" /> Collapse
              </>
            ) : (
              <>
                <Maximize className="mr-2 h-3 w-3" /> Full View
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DualCodeView;
