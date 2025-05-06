import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileDiff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { computeLineDiff, detectLanguage, type FormattedDiff } from "@/utils/diffUtils";
import CodeView from "@/components/CodeView";
import DualCodeView from "@/components/DualCodeView";
import FormatSelector from "@/components/FormatSelector";

const DiffViewer: React.FC = () => {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [diff, setDiff] = useState<FormattedDiff | null>(null);
  const [leftLanguage, setLeftLanguage] = useState("plaintext");
  const [rightLanguage, setRightLanguage] = useState("plaintext");
  const [selectedView, setSelectedView] = useState<"input" | "diff">("input");
  const { toast } = useToast();

  // Detect language when text changes
  useEffect(() => {
    if (leftText) {
      setLeftLanguage(detectLanguage(leftText));
    }
    if (rightText) {
      setRightLanguage(detectLanguage(rightText));
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
    setSelectedView("diff");
  };

  // Function to clear inputs
  const handleClear = () => {
    setLeftText("");
    setRightText("");
    setDiff(null);
    setSelectedView("input");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      <header className="mb-12 pt-6 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <FileDiff className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Text Diff Viewer</h1>
        </div>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Compare text files with syntax highlighting for multiple formats
        </p>
      </header>

      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as "input" | "diff")} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="input" className="flex-1 sm:flex-initial">Text Input</TabsTrigger>
            <TabsTrigger value="diff" className="flex-1 sm:flex-initial">Diff View</TabsTrigger>
          </TabsList>

          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleClear} className="flex-1 sm:flex-initial">
              Clear
            </Button>
            <Button onClick={handleCompare} className="flex-1 sm:flex-initial">Compare</Button>
          </div>
        </div>

        <TabsContent value="input" className="space-y-6 mt-0">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="original" className="text-base">Original Text</Label>
                <FormatSelector 
                  selectedLanguage={leftLanguage} 
                  onLanguageChange={setLeftLanguage}
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
                  selectedLanguage={rightLanguage} 
                  onLanguageChange={setRightLanguage}
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
        </TabsContent>

        <TabsContent value="diff" className="space-y-4 mt-0">
          {diff ? (
            <DualCodeView 
              leftContent={leftText}
              rightContent={rightText}
              diff={diff}
              leftLanguage={leftLanguage}
              rightLanguage={rightLanguage}
            />
          ) : (
            <div className="flex justify-center items-center min-h-[300px] bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">
                Click "Compare" to see differences
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiffViewer;
