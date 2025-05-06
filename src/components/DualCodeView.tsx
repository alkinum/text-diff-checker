
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-6 h-[600px] overflow-auto">
          <CodeView 
            content={leftContent} 
            language={leftLanguage} 
            lines={diff.left}
            title="Original"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6 h-[600px] overflow-auto">
          <CodeView 
            content={rightContent} 
            language={rightLanguage} 
            lines={diff.right}
            title="Modified"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DualCodeView;
