import { diffLines } from 'diff';
import { applyWordDiffs } from './wordDiffer';
import { detectLanguage } from './languageDetector';
import { FormattedDiff, DiffResultWithLineNumbers } from './types';

// Main function to compute line-by-line differences with proper alignment
export function computeLineDiff(oldText: string, newText: string): FormattedDiff {
  // First, split both texts into lines
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // Create arrays to store the aligned line-by-line diff result
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];
  
  let leftLineNumber = 1;
  let rightLineNumber = 1;

  // Get the diff results
  const changes = diffLines(oldText, newText);
  
  // Process each change
  for (const part of changes) {
    if (part.added) {
      // Added lines
      const lines = part.value.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Skip the last element if it's empty (due to trailing newline)
        if (i === lines.length - 1 && lines[i] === '') continue;
        
        // Add a spacer in left side
        leftLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
        
        // Add the line on right side
        rightLines.push({
          value: lines[i],
          added: true,
          lineNumber: rightLineNumber++
        });
      }
    } else if (part.removed) {
      // Removed lines
      const lines = part.value.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Skip the last element if it's empty (due to trailing newline)
        if (i === lines.length - 1 && lines[i] === '') continue;
        
        // Add the line on left side
        leftLines.push({
          value: lines[i],
          removed: true,
          lineNumber: leftLineNumber++
        });
        
        // Add a spacer in right side
        rightLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
      }
    } else {
      // Unchanged lines
      const lines = part.value.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Skip the last element if it's empty (due to trailing newline)
        if (i === lines.length - 1 && lines[i] === '') continue;
        
        // Add unchanged line to both sides
        leftLines.push({
          value: lines[i],
          lineNumber: leftLineNumber++
        });
        
        rightLines.push({
          value: lines[i],
          lineNumber: rightLineNumber++
        });
      }
    }
  }
  
  // Apply character-level diffs for modified lines
  applyWordDiffs(leftLines, rightLines);
  
  return { left: leftLines, right: rightLines };
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResultWithLineNumbers };
