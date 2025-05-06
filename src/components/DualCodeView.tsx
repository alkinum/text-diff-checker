
import React, { useRef, useEffect } from 'react';
import CodeView from '@/components/CodeView';
import { type FormattedDiff } from '@/utils/diffUtils';
import DiffMinimap from '@/components/DiffMinimap';

interface DualCodeViewProps {
  leftContent: string;
  rightContent: string;
  diff: FormattedDiff;
  leftLanguage: string;
  rightLanguage: string;
}

const DualCodeView: React.FC<DualCodeViewProps> = ({
  leftContent,
  rightContent,
  diff,
  leftLanguage,
  rightLanguage
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-[600px] bg-background">
      <div className="h-full relative border-r">
        <div 
          ref={leftScrollRef} 
          className="h-full overflow-auto"
        >
          <CodeView 
            content={leftContent} 
            language={leftLanguage} 
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
            language={rightLanguage} 
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
  );
};

export default DualCodeView;
