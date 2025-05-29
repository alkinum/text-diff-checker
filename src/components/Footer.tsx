import React from "react";
import { Shield } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-20 pb-4 text-center space-y-2">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/20">
        <Shield className="h-4 w-4" />
        <span className="select-none">
          All data is processed locally in your browser
        </span>
      </div>
      <p className="text-xs text-muted-foreground/20 select-none">Made by Alkinum</p>
    </footer>
  );
};

export default Footer;