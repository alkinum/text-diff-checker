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
  modified?: boolean; 
  inlineChanges?: {
    value: string;
    added?: boolean;
    removed?: boolean;
  }[];
  spacer?: boolean; // To indicate this is a placeholder for spacing
  extraLine?: boolean; // To indicate this line exists in original but not in modified
}

// Function to compute line-by-line differences with proper alignment
export function computeLineDiff(oldText: string, newText: string): FormattedDiff {
  // First we need to split the text into lines before passing to diffLines
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Remove empty lines at the end if they exist
  if (oldLines[oldLines.length - 1] === '') oldLines.pop();
  if (newLines[newLines.length - 1] === '') newLines.pop();
  
  // Calculate the diff between the two arrays of lines
  const differences = diffLines(oldText, newText);
  
  // Initialize our result arrays
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];
  
  let leftLineNumber = 1;
  let rightLineNumber = 1;
  
  // First pass: Process the differences to create initial line arrays
  differences.forEach(part => {
    // Split each part into lines, accounting for newlines
    const lines = part.value.split('\n');
    
    // Remove the last element if it's an empty string (due to trailing newline)
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    if (part.added) {
      // Added lines only appear in right side (new text)
      lines.forEach(line => {
        rightLines.push({ 
          value: line, 
          added: true, 
          lineNumber: rightLineNumber++ 
        });
      });
    } else if (part.removed) {
      // Removed lines only appear in left side (old text)
      lines.forEach(line => {
        leftLines.push({ 
          value: line, 
          removed: true, 
          lineNumber: leftLineNumber++ 
        });
      });
    } else {
      // Unchanged lines appear in both sides
      lines.forEach(line => {
        leftLines.push({ value: line, lineNumber: leftLineNumber++ });
        rightLines.push({ value: line, lineNumber: rightLineNumber++ });
      });
    }
  });
  
  // Second pass: Match up the lines between left and right sides to ensure proper alignment
  const alignedLeft: DiffResultWithLineNumbers[] = [];
  const alignedRight: DiffResultWithLineNumbers[] = [];
  
  // Find the max length between left and right arrays
  const maxLength = Math.max(leftLines.length, rightLines.length);
  
  // Counters for positions in each array
  let leftPos = 0;
  let rightPos = 0;
  
  // Process both arrays simultaneously
  while (leftPos < leftLines.length || rightPos < rightLines.length) {
    const leftLine = leftPos < leftLines.length ? leftLines[leftPos] : null;
    const rightLine = rightPos < rightLines.length ? rightLines[rightPos] : null;
    
    // Case 1: Both sides have a line
    if (leftLine && rightLine) {
      // 1a: If neither side is marked as added or removed, they're supposed to match
      if (!leftLine.added && !leftLine.removed && !rightLine.added && !rightLine.removed) {
        alignedLeft.push(leftLine);
        alignedRight.push(rightLine);
        leftPos++;
        rightPos++;
      }
      // 1b: Left line is removed, need to add a spacer on the right
      else if (leftLine.removed) {
        alignedLeft.push(leftLine);
        alignedRight.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
        leftPos++;
      }
      // 1c: Right line is added, need to add a spacer on the left
      else if (rightLine.added) {
        alignedLeft.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
        alignedRight.push(rightLine);
        rightPos++;
      }
    }
    // Case 2: Only left side has a line
    else if (leftLine) {
      alignedLeft.push(leftLine);
      alignedRight.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
      leftPos++;
    }
    // Case 3: Only right side has a line
    else if (rightLine) {
      alignedLeft.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
      alignedRight.push(rightLine);
      rightPos++;
    }
  }
  
  // Third pass: Perform word-level diffs for modified lines
  // Compare each aligned line to detect modifications
  for (let i = 0; i < alignedLeft.length; i++) {
    const leftLine = alignedLeft[i];
    const rightLine = alignedRight[i];
    
    // Skip spacers and obvious add/remove pairs
    if (leftLine.spacer || rightLine.spacer) {
      continue;
    }
    
    // If lines are different without being marked as added/removed
    if (leftLine.value !== rightLine.value && 
        !leftLine.removed && !rightLine.added) {
      
      // Do word-level diff for more detailed highlighting
      const wordDiffs = diffWords(leftLine.value, rightLine.value);
      
      // Apply word diffs to left line
      leftLine.inlineChanges = wordDiffs.map(part => ({
        value: part.value,
        removed: part.removed,
        added: part.added,
      }));
      
      // Apply word diffs to right line
      rightLine.inlineChanges = wordDiffs.map(part => ({
        value: part.value,
        removed: part.removed,
        added: part.added,
      }));
      
      // Mark both lines as modified if there are actual differences
      if (wordDiffs.some(part => part.added || part.removed)) {
        leftLine.modified = true;
        rightLine.modified = true;
      }
    }
    
    // Mark original lines that don't have a match on the right as "extra"
    if (!leftLine.removed && !leftLine.modified && rightLine.spacer) {
      leftLine.extraLine = true;
    }
  }
  
  return { left: alignedLeft, right: alignedRight };
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
