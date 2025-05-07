import { diffLines } from 'diff';
import { applyWordDiffs } from './wordDiffer';
import { detectLanguage } from './languageDetector';
import { FormattedDiff, DiffResultWithLineNumbers } from './types';

// Main function to compute line-by-line differences with proper alignment
export function computeLineDiff(oldText: string, newText: string): FormattedDiff {
  // Get the raw diff
  const diff = diffLines(oldText, newText);
  
  // Create arrays to store the aligned line-by-line diff result
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];
  
  let leftLineNumber = 1;
  let rightLineNumber = 1;
  
  // Process each part of the diff
  for (const part of diff) {
    const lines = part.value.split('\n');
    // Remove empty line at the end if last character was a newline
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    if (part.added) {
      // Added lines (only in new text)
      for (const line of lines) {
        // Add a spacer in the left side
        leftLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
        
        // Add the actual line in the right side
        rightLines.push({
          value: line,
          added: true,
          lineNumber: rightLineNumber++
        });
      }
    } else if (part.removed) {
      // Removed lines (only in old text)
      for (const line of lines) {
        // Add the removed line in the left side
        leftLines.push({
          value: line,
          removed: true,
          lineNumber: leftLineNumber++
        });
        
        // Add a spacer in the right side
        rightLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
      }
    } else {
      // Unchanged lines (in both texts)
      for (const line of lines) {
        // Add the unchanged line in both sides
        leftLines.push({
          value: line,
          lineNumber: leftLineNumber++
        });
        
        rightLines.push({
          value: line,
          lineNumber: rightLineNumber++
        });
      }
    }
  }
  
  // Apply word-level diffs for modified lines
  applyWordDiffs(leftLines, rightLines);
  
  return { left: leftLines, right: rightLines };
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResultWithLineNumbers };
