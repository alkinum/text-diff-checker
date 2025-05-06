
import React, { useRef, useEffect } from 'react';
import CodeView from '@/components/CodeView';
import { type FormattedDiff } from '@/utils/diffUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowUp, ArrowDown } from 'lucide-react';
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

  const handleScroll = (source: 'left' | 'right', event: React.UIEvent<HTMLDivElement>) => {
    const sourceElement = event.currentTarget;
    const targetElement = source === 'left' ? rightScrollRef.current : leftScrollRef.current;
    
    if (targetElement && sourceElement !== targetElement) {
      targetElement.scrollTop = sourceElement.scrollTop;
      targetElement.scrollLeft = sourceElement.scrollLeft;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 h-[600px] bg-background relative">
      <div className="h-full relative">
        <div 
          ref={leftScrollRef} 
          className="h-full overflow-auto"
          onScroll={(e) => handleScroll('left', e)}
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
          onScroll={(e) => handleScroll('right', e)}
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
