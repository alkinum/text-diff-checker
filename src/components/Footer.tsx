import React from "react";
import { Shield } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-14 pb-4 text-center">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
        <Shield className="h-3.5 w-3.5" />
        <span className="select-none">All data is processed locally in your browser</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground/55 select-none">Made by Alkinum</p>
    </footer>
  );
};

export default Footer;
