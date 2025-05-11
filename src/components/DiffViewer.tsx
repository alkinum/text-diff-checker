import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileDiff, Sparkle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { computeLineDiff, detectLanguage, type FormattedDiff } from "@/utils/diff";
import DualCodeView from "@/components/DualCodeView";
import FormatSelector from "@/components/FormatSelector";
import LineNumberedTextarea from "@/components/LineNumberedTextarea";
import { useIsMobile } from "@/hooks/use-mobile";

const DiffViewer: React.FC = () => {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [diff, setDiff] = useState<FormattedDiff | null>(null);
  const [language, setLanguage] = useState("plaintext");
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // Responsive height for textareas
  const textareaHeight = isMobile ? "200px" : "300px";

  // Detect language when text changes
  useEffect(() => {
    if (leftText || rightText) {
      const detectedLanguage = detectLanguage(leftText || rightText);
      setLanguage(detectedLanguage);
    }
  }, [leftText, rightText]);

  // Function to compute differences
  const handleCompare = () => {
    if (!leftText && !rightText) {
      toast({
        title: "Empty comparison",
        description: "Please enter text in at least one of the editors.",
        variant: "destructive",
      });
      return;
    }

    // Ensure we're using the current input values when comparing
    const result = computeLineDiff(leftText, rightText);
    setDiff(result);
  };

  // Function to clear inputs
  const handleClear = () => {
    setLeftText("");
    setRightText("");
    setDiff(null);
  };

  // Functions to handle scroll synchronization between textareas
  const handleLeftScroll = () => {
    if (rightScrollRef.current && leftScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
  };

  const handleRightScroll = () => {
    if (leftScrollRef.current && rightScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
  };

  return (
    <div className={`max-w-7xl mx-auto ${isMobile ? 'p-4' : 'p-6'}`}>
      <header className={`${isMobile ? 'mb-4' : 'mb-8'} ${isMobile ? 'pt-10 pb-4' : 'pt-10 pb-8'} text-center`}>
        <div className="flex items-center justify-center gap-3 mb-4 select-none">
          <FileDiff className={`${isMobile ? 'h-6 w-6' : 'h-12 w-12'} text-primary`} />
          <h1 className={`${isMobile ? 'text-xl' : 'text-4xl'} font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500`}>
            Text Diff Checker
          </h1>
        </div>
        <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-lg'} max-w-2xl mx-auto select-none`}>
          Compare text files with syntax highlighting for multiple formats
        </p>
      </header>

      <div className={`${isMobile ? 'space-y-4' : 'space-y-8'}`}>
        {/* Diff View (appears only when diff exists) */}
        {diff && (
          <div className={`space-y-4 ${isMobile ? 'mb-6' : 'mb-10'} glass-card rounded-xl p-4 shadow-lg`}>
            <DualCodeView
              leftContent={leftText}
              rightContent={rightText}
              diff={diff}
              language={language}
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-3">
          <div className={`${isMobile ? 'text-base' : 'text-xl'} font-medium flex items-center gap-2 select-none`}>
            <Sparkle className={`${isMobile ? 'h-3.5' : 'h-5'} text-primary`} />
            Input Text
          </div>
          <div className="flex gap-2 select-none">
            <Button
              variant="outline"
              onClick={handleClear}
              className="btn-transition border-border/50"
              size={isMobile ? "sm" : "default"}
            >
              Clear
            </Button>
            <Button
              onClick={handleCompare}
              className="btn-transition bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
              size={isMobile ? "sm" : "default"}
            >
              Compare
            </Button>
          </div>
        </div>

        {/* Text Input View with Line Numbers - with responsive height */}
        <div className={`grid md:grid-cols-2 ${isMobile ? 'gap-4' : 'gap-8'}`}>
          <div className="space-y-3 glass-card rounded-xl p-4 transition-all duration-300 hover:shadow-xl w-full">
            <div className="flex justify-between items-center select-none">
              <Label htmlFor="original" className={`${isMobile ? 'text-xs' : 'text-base'} font-medium`}>Original Text</Label>
              <FormatSelector
                selectedLanguage={language}
                onLanguageChange={setLanguage}
              />
            </div>
            <LineNumberedTextarea
              id="original"
              placeholder="Paste original text here..."
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              height={textareaHeight}
              onScroll={handleLeftScroll}
              scrollRef={leftScrollRef}
              className="w-full"
            />
          </div>

          <div className="space-y-3 glass-card rounded-xl p-4 transition-all duration-300 hover:shadow-xl w-full">
            <div className="flex justify-between items-center">
              <Label htmlFor="modified" className={`${isMobile ? 'text-xs' : 'text-base'} font-medium`}>Modified Text</Label>
              <FormatSelector
                selectedLanguage={language}
                onLanguageChange={setLanguage}
              />
            </div>
            <LineNumberedTextarea
              id="modified"
              placeholder="Paste modified text here..."
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              height={textareaHeight}
              onScroll={handleRightScroll}
              scrollRef={rightScrollRef}
              className="w-full"
            />
          </div>
        </div>
      </div>
      <div className="mt-12 pb-4 text-center">
        <p className="text-xs text-muted-foreground/15 select-none">Made by Alkinum</p>
      </div>
    </div>
  );
};

export default DiffViewer;
