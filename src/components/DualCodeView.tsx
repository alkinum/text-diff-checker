
import React, { useRef } from 'react';
import CodeView from '@/components/CodeView';
import { type FormattedDiff } from '@/utils/diffUtils';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg overflow-hidden border shadow-sm h-[600px] bg-background">
      <div className="h-full border-r">
        <CodeView 
          content={leftContent} 
          language={leftLanguage} 
          lines={diff.left}
          title="Original"
          scrollRef={leftScrollRef}
        />
      </div>
      
      <div className="h-full">
        <CodeView 
          content={rightContent} 
          language={rightLanguage} 
          lines={diff.right}
          title="Modified"
          scrollRef={rightScrollRef}
        />
      </div>
    </div>
  );
};

export default DualCodeView;
