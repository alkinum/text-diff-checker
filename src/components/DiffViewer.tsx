
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="max-w-7xl mx-auto p-4 animate-fade-in">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileDiff className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Text Diff Viewer</h1>
        </div>
        <p className="text-muted-foreground">
          Compare text files with syntax highlighting for multiple formats
        </p>
      </header>

      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as "input" | "diff")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="input">Text Input</TabsTrigger>
            <TabsTrigger value="diff">Diff View</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleCompare}>Compare</Button>
          </div>
        </div>

        <TabsContent value="input" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="original">Original Text</Label>
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
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="modified">Modified Text</Label>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diff" className="space-y-4">
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
