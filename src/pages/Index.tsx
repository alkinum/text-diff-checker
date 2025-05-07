
import DiffViewer from "@/components/DiffViewer";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <>
      <div className="fixed top-4 right-4 z-50 animate-fade-in">
        <ThemeToggle />
      </div>
      <div className="min-h-screen bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-background/95 pb-20">
        <DiffViewer />
      </div>
    </>
  );
};

export default Index;
