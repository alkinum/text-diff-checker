
import DiffViewer from "@/components/DiffViewer";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  return (
    <>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <DiffViewer />
    </>
  );
};

export default Index;
