
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileDiff, Sparkle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { computeLineDiff, detectLanguage, type FormattedDiff } from "@/utils/diff";
import DualCodeView from "@/components/DualCodeView";
import FormatSelector from "@/components/FormatSelector";
import LineNumberedTextarea from "@/components/LineNumberedTextarea";

const DiffViewer: React.FC = () => {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [diff, setDiff] = useState<FormattedDiff | null>(null);
  const [language, setLanguage] = useState("plaintext");
  const { toast } = useToast();
  
  const leftTextareaContainerRef = useRef<HTMLDivElement>(null);
  const rightTextareaContainerRef = useRef<HTMLDivElement>(null);

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

  // Function to synchronize left textarea scroll to right
  const handleLeftScroll = () => {
    if (rightTextareaContainerRef.current && leftTextareaContainerRef.current) {
      const leftTextarea = leftTextareaContainerRef.current.querySelector('textarea');
      const rightTextarea = rightTextareaContainerRef.current.querySelector('textarea');
      
      if (leftTextarea && rightTextarea) {
        rightTextarea.scrollTop = leftTextarea.scrollTop;
        rightTextarea.scrollLeft = leftTextarea.scrollLeft;
      }
    }
  };

  // Function to synchronize right textarea scroll to left
  const handleRightScroll = () => {
    if (leftTextareaContainerRef.current && rightTextareaContainerRef.current) {
      const leftTextarea = leftTextareaContainerRef.current.querySelector('textarea');
      const rightTextarea = rightTextareaContainerRef.current.querySelector('textarea');
      
      if (leftTextarea && rightTextarea) {
        leftTextarea.scrollTop = rightTextarea.scrollTop;
        leftTextarea.scrollLeft = rightTextarea.scrollLeft;
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      <header className="mb-8 pt-6 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <FileDiff className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            Text Diff Checker
          </h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Compare text files with syntax highlighting for multiple formats
        </p>
      </header>

      <div className="space-y-8">
        {/* Diff View (appears only when diff exists) */}
        {diff && (
          <div className="space-y-4 mb-8 glass-card rounded-xl p-4 shadow-lg">
            <DualCodeView 
              leftContent={leftText}
              rightContent={rightText}
              diff={diff}
              language={language}
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
          <div className="text-xl font-medium flex items-center gap-2">
            <Sparkle className="h-5 w-5 text-primary" />
            Input Text
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="btn-transition border-border/50"
            >
              Clear
            </Button>
            <Button 
              onClick={handleCompare}
              className="btn-transition bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
            >
              Compare
            </Button>
          </div>
        </div>

        {/* Text Input View with Line Numbers */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 glass-card rounded-xl p-5 transition-all duration-300 hover:shadow-xl w-full">
            <div className="flex justify-between items-center">
              <Label htmlFor="original" className="text-base font-medium">Original Text</Label>
              <FormatSelector 
                selectedLanguage={language} 
                onLanguageChange={setLanguage}
              />
            </div>
            <div ref={leftTextareaContainerRef} className="w-full">
              <LineNumberedTextarea
                id="original"
                placeholder="Paste original text here..."
                value={leftText}
                onChange={(e) => setLeftText(e.target.value)}
                minHeight="300px"
                onScroll={handleLeftScroll}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4 glass-card rounded-xl p-5 transition-all duration-300 hover:shadow-xl w-full">
            <div className="flex justify-between items-center">
              <Label htmlFor="modified" className="text-base font-medium">Modified Text</Label>
              <FormatSelector 
                selectedLanguage={language} 
                onLanguageChange={setLanguage}
              />
            </div>
            <div ref={rightTextareaContainerRef} className="w-full">
              <LineNumberedTextarea
                id="modified"
                placeholder="Paste modified text here..."
                value={rightText}
                onChange={(e) => setRightText(e.target.value)}
                minHeight="300px"
                onScroll={handleRightScroll}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
