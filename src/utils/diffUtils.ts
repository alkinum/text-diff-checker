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
  const differences = diffLines(oldText, newText);
  
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];
  
  let leftLineNumber = 1;
  let rightLineNumber = 1;
  
  // First, analyze the raw diff to determine mapping of unchanged blocks
  const unchangedBlocks: { leftStart: number, leftEnd: number, rightStart: number, rightEnd: number }[] = [];
  let leftIdxAnalysis = 0;
  let rightIdxAnalysis = 0;
  
  differences.forEach(part => {
    const lines = part.value.split('\n');
    // Remove the last element if it's an empty string (due to trailing newline)
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    const lineCount = lines.length;
    
    if (!part.added && !part.removed) {
      // This is an unchanged block
      unchangedBlocks.push({
        leftStart: leftIdxAnalysis,
        leftEnd: leftIdxAnalysis + lineCount - 1,
        rightStart: rightIdxAnalysis,
        rightEnd: rightIdxAnalysis + lineCount - 1
      });
    }
    
    if (!part.added) leftIdxAnalysis += lineCount;
    if (!part.removed) rightIdxAnalysis += lineCount;
  });
  
  // Process the raw diff to create aligned lines
  let leftIdxProcess = 0;
  let rightIdxProcess = 0;
  
  differences.forEach(part => {
    const lines = part.value.split('\n');
    // Remove the last element if it's an empty string (due to trailing newline)
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    if (part.added) {
      // Added lines only appear in right side
      lines.forEach(line => {
        rightLines.push({ 
          value: line, 
          added: true, 
          lineNumber: rightLineNumber++ 
        });
      });
    } else if (part.removed) {
      // Removed lines only appear in left side
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
  
  // Align the lines by adding spacers
  const alignedLeft: DiffResultWithLineNumbers[] = [];
  const alignedRight: DiffResultWithLineNumbers[] = [];
  
  let leftPos = 0;
  let rightPos = 0;
  
  // Process each unchanged block and the changes between them
  for (let i = 0; i <= unchangedBlocks.length; i++) {
    // Handle changes before this unchanged block
    const currentBlock = unchangedBlocks[i];
    const leftEnd = currentBlock ? currentBlock.leftStart : leftLines.length;
    const rightEnd = currentBlock ? currentBlock.rightStart : rightLines.length;
    
    // Add all left lines up to the next unchanged block
    while (leftPos < leftEnd) {
      const line = leftLines[leftPos++];
      
      // Check if this is an 'extra' line (only in original text)
      // We identify extra lines by checking if the current position in left is ahead of right
      // and if the line is not already marked as removed
      if (!line.removed && leftPos > rightPos + 1 && !currentBlock) {
        line.extraLine = true;
      }
      
      alignedLeft.push(line);
    }
    
    // Add all right lines up to the next unchanged block
    while (rightPos < rightEnd) {
      alignedRight.push(rightLines[rightPos++]);
    }
    
    // Balance the lines by adding spacers
    const leftAddedCount = alignedLeft.length - alignedRight.length;
    if (leftAddedCount > 0) {
      // Add spacers to right side
      for (let j = 0; j < leftAddedCount; j++) {
        alignedRight.push({
          value: '',
          lineNumber: -1, // No line number for spacers
          spacer: true
        });
      }
    } else if (leftAddedCount < 0) {
      // Add spacers to left side
      for (let j = 0; j < Math.abs(leftAddedCount); j++) {
        alignedLeft.push({
          value: '',
          lineNumber: -1, // No line number for spacers
          spacer: true
        });
      }
    }
    
    // If this is the last iteration, break
    if (!currentBlock) break;
    
    // Add the unchanged block
    for (let j = 0; j <= currentBlock.leftEnd - currentBlock.leftStart; j++) {
      alignedLeft.push(leftLines[leftPos++]);
      alignedRight.push(rightLines[rightPos++]);
    }
  }
  
  // Second pass: perform word-level diffs for lines that appear to be similar
  // And check for additional "extra lines" in the original text that should be highlighted
  for (let i = 0; i < alignedLeft.length && i < alignedRight.length; i++) {
    const leftLine = alignedLeft[i];
    const rightLine = alignedRight[i];
    
    // Skip spacers and lines that are strictly added/removed
    if (leftLine.spacer || rightLine.spacer || 
        (leftLine.removed && rightLine.added) ||
        (!leftLine.value && !rightLine.value)) {
      continue;
    }
    
    // If one line is normal and the other is not, or they have different values,
    // they might be modified versions of each other
    if ((!leftLine.removed && !rightLine.added && leftLine.value !== rightLine.value) ||
        (leftLine.value && rightLine.value && !leftLine.spacer && !rightLine.spacer)) {
      
      const wordDiffs = diffWords(leftLine.value, rightLine.value);
      
      // Process left line
      leftLine.inlineChanges = wordDiffs.map(part => ({
        value: part.value,
        removed: part.removed,
        added: part.added,
      }));
      
      // Process right line
      rightLine.inlineChanges = wordDiffs.map(part => ({
        value: part.value,
        removed: part.removed,
        added: part.added,
      }));
      
      // Mark as modified rather than added/removed if they have inline changes
      if (leftLine.inlineChanges.some(change => change.removed) || 
          rightLine.inlineChanges.some(change => change.added)) {
        leftLine.removed = false;
        rightLine.added = false;
        leftLine.modified = true;
        rightLine.modified = true;
      }
    }
  }
  
  // Mark any trailing lines in the original text as "extra"
  let hasExtraLine = false;
  for (let i = 0; i < alignedLeft.length; i++) {
    if (!alignedLeft[i].removed && !alignedLeft[i].modified && !alignedLeft[i].spacer) {
      // If there's a corresponding right-side spacer, this is an extra line
      if (i < alignedRight.length && alignedRight[i].spacer) {
        alignedLeft[i].extraLine = true;
        hasExtraLine = true;
      }
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
