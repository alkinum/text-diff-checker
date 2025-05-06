
import React, { useRef, useEffect } from 'react';
import CodeView from '@/components/CodeView';
import { type FormattedDiff } from '@/utils/diffUtils';
import DiffMinimap from '@/components/DiffMinimap';

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

  return (
    <div className="flex flex-col h-[600px] bg-background">
      {/* Summary header */}
      <div className="flex justify-between items-center text-sm p-2 border-b">
        <div className="flex items-center">
          <span className="inline-flex items-center bg-diff-deleted-bg text-diff-deleted-text px-2 py-1 rounded mr-2">
            <span className="mr-1">-</span> {removedCount} removals
          </span>
          <span className="text-muted-foreground">{leftLinesCount} lines</span>
        </div>
        <div className="flex items-center">
          <span className="inline-flex items-center bg-diff-added-bg text-diff-added-text px-2 py-1 rounded mr-2">
            <span className="mr-1">+</span> {addedCount} additions
          </span>
          <span className="text-muted-foreground">{rightLinesCount} lines</span>
        </div>
      </div>
      
      {/* Diff view */}
      <div className="grid grid-cols-2 gap-0 flex-1 relative">
        <div className="h-full relative border-r">
          <div 
            ref={leftScrollRef} 
            className="h-full overflow-auto"
          >
            <CodeView 
              content={leftContent} 
              language={language} 
              lines={diff.left}
              title="Original"
            />
          </div>
          <DiffMinimap 
            lines={diff.left} 
            containerRef={leftScrollRef}
            position="left"
          />
        </div>
        
        <div className="h-full relative">
          <div 
            ref={rightScrollRef} 
            className="h-full overflow-auto"
          >
            <CodeView 
              content={rightContent} 
              language={language} 
              lines={diff.right}
              title="Modified"
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
