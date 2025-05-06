
import { diffLines, diffWords } from 'diff';

// Types for our diff functions
export interface DiffResult {
  value: string;
  added?: boolean;
  removed?: boolean;
  lineNumber?: number;
}

export interface FormattedDiff {
  left: DiffResultWithLineNumbers[];
  right: DiffResultWithLineNumbers[];
}

export interface DiffResultWithLineNumbers extends DiffResult {
  lineNumber: number;
  modified?: boolean; // Add the missing property
  inlineChanges?: {
    value: string;
    added?: boolean;
    removed?: boolean;
  }[];
}

// Function to compute line-by-line differences
export function computeLineDiff(oldText: string, newText: string): FormattedDiff {
  const differences = diffLines(oldText, newText);
  
  let leftLineNumber = 1;
  let rightLineNumber = 1;
  
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];
  
  // First pass: analyze which lines changed but have direct counterparts
  // Map of left line index to right line index for matching lines
  const matchingLines = new Map<number, number>();
  
  differences.forEach((part) => {
    const lines = part.value.split('\n');
    // Remove the last element if it's an empty string (due to trailing newline)
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    if (part.added) {
      // Added lines only appear in right side
      lines.forEach(line => {
        rightLines.push({ value: line, added: true, lineNumber: rightLineNumber++ });
      });
    } else if (part.removed) {
      // Removed lines only appear in left side
      lines.forEach(line => {
        leftLines.push({ value: line, removed: true, lineNumber: leftLineNumber++ });
      });
    } else {
      // Unchanged lines appear in both sides
      lines.forEach(line => {
        const leftIdx = leftLines.length;
        const rightIdx = rightLines.length;
        
        leftLines.push({ value: line, lineNumber: leftLineNumber++ });
        rightLines.push({ value: line, lineNumber: rightLineNumber++ });
        
        matchingLines.set(leftIdx, rightIdx);
      });
    }
  });
  
  // Second pass: perform word-level diffs for lines that have counterparts
  // where one is added and one is removed
  if (leftLines.length === rightLines.length) {
    for (let i = 0; i < leftLines.length; i++) {
      const leftLine = leftLines[i];
      const rightLine = rightLines[i];
      
      // If one line is added and one is removed, they might be modified versions of each other
      if ((leftLine.removed && rightLine.added) || 
          (!leftLine.removed && !rightLine.added && leftLine.value !== rightLine.value)) {
        const wordDiffs = diffWords(leftLine.value, rightLine.value);
        
        // Process left line
        const leftInlineChanges = wordDiffs.map(part => ({
          value: part.value,
          removed: part.removed,
          added: part.added,
        }));
        
        // Process right line
        const rightInlineChanges = wordDiffs.map(part => ({
          value: part.value,
          removed: part.removed,
          added: part.added,
        }));
        
        leftLine.inlineChanges = leftInlineChanges;
        rightLine.inlineChanges = rightInlineChanges;
        
        // Mark as changed rather than added/removed if they're just modifications
        if (leftLine.removed && rightLine.added) {
          leftLine.removed = false;
          rightLine.added = false;
          leftLine.modified = true;
          rightLine.modified = true;
        }
      }
    }
  }
  
  return { left: leftLines, right: rightLines };
}

// Function to detect the probable language from content
export function detectLanguage(content: string): string {
  if (!content.trim()) return 'plaintext';
  
  // Simple language detection based on file content patterns
  if (/^\s*[{\[]/.test(content) && /[}\]]\s*$/.test(content)) {
    try {
      JSON.parse(content);
      return 'json';
    } catch (e) {
      // Not valid JSON
    }
  }
  
  if (/^\s*<\?xml/.test(content)) return 'xml';
  if (/^\s*<!DOCTYPE\s+html>/i.test(content) || /^\s*<html>/i.test(content)) return 'html';
  if (/^\s*import\s+|^\s*export\s+|^\s*function\s+|^\s*const\s+|^\s*let\s+|^\s*var\s+|^\s*class\s+/.test(content)) return 'javascript';
  if (/^\s*#include|^\s*#define|^\s*(public|private|protected):\s*$/.test(content)) return 'cpp';
  if (/^\s*(def\s+|class\s+|import\s+|from\s+\w+\s+import)/.test(content)) return 'python';
  if (/^\s*(package\s+|import\s+|public\s+class)/.test(content)) return 'java';
  if (/^\s*(use\s+|package\s+|sub\s+)/.test(content)) return 'perl';
  if (/^\s*<%/.test(content)) return 'ejs';
  if (/^\s*(\/\*|\/\/)/.test(content)) return 'clike';
  if (/^\s*[a-zA-Z]+:/.test(content)) return 'yaml';
  if (/^\s*\[.+\]/.test(content) && /=/.test(content)) return 'ini';
  
  // Default to plaintext if no pattern is matched
  return 'plaintext';
}
