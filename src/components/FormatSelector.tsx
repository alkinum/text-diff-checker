import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileCode } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface FormatSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
  triggerClassName?: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'xml', label: 'XML' },
  { value: 'css', label: 'CSS' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'ejs', label: 'EJS' },
  { value: 'python', label: 'Python' },
  { value: 'perl', label: 'Perl' },
  { value: 'java', label: 'Java' },
  { value: 'clike', label: 'C-like' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'ini', label: 'INI' },
];

const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  className,
  triggerClassName
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <Select value={selectedLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger
          className={cn(
            "rounded-[14px] border-border/70 bg-background/80 shadow-sm",
            isMobile ? 'h-9 w-[132px] text-xs' : 'h-10 w-[172px]',
            triggerClassName
          )}
        >
          <SelectValue placeholder="Select format" />
        </SelectTrigger>
        <SelectContent className={isMobile ? 'text-sm' : ''}>
          {LANGUAGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FormatSelector;
