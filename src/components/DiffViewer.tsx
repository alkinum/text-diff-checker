
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileDiff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { computeLineDiff, detectLanguage, type FormattedDiff } from "@/utils/diffUtils";
import DualCodeView from "@/components/DualCodeView";
import FormatSelector from "@/components/FormatSelector";

const DiffViewer: React.FC = () => {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [diff, setDiff] = useState<FormattedDiff | null>(null);
  const [language, setLanguage] = useState("plaintext");
  const { toast } = useToast();

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

    const result = computeLineDiff(leftText, rightText);
    setDiff(result);
  };

  // Function to clear inputs
  const handleClear = () => {
    setLeftText("");
    setRightText("");
    setDiff(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      <header className="mb-8 pt-6 pb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FileDiff className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Text Diff Viewer</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Compare text files with syntax highlighting for multiple formats
        </p>
      </header>

      <div className="space-y-6">
        {/* Diff View (appears only when diff exists) */}
        {diff && (
          <div className="space-y-4 mb-6">
            <DualCodeView 
              leftContent={leftText}
              rightContent={rightText}
              diff={diff}
              language={language}
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <div className="text-lg font-medium">Text Input</div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleCompare}>Compare</Button>
          </div>
        </div>

        {/* Text Input View */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="original" className="text-base">Original Text</Label>
              <FormatSelector 
                selectedLanguage={language} 
                onLanguageChange={setLanguage}
              />
            </div>
            <Textarea
              id="original"
              placeholder="Paste original text here..."
              className="min-h-[300px] font-mono text-sm"
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="modified" className="text-base">Modified Text</Label>
              <FormatSelector 
                selectedLanguage={language} 
                onLanguageChange={setLanguage}
              />
            </div>
            <Textarea
              id="modified"
              placeholder="Paste modified text here..."
              className="min-h-[300px] font-mono text-sm"
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
