import { diffLines } from 'diff';
import { applyWordDiffs } from './wordDiffer';
import { detectLanguage } from './languageDetector';
import { FormattedDiff, DiffResultWithLineNumbers } from './types';

// Main function to compute line-by-line differences with top-to-bottom comparison
export function computeLineDiff(oldText: string, newText: string): FormattedDiff {
  // Split the text into arrays of lines
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // Create arrays to store the line-by-line diff result
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];
  
  // Count how many lines we need to compare
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  // Process each line by comparing directly without pre-alignment
  for (let i = 0; i < maxLines; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : null;
    const newLine = i < newLines.length ? newLines[i] : null;
    
    if (oldLine === null) {
      // Line only exists in the new text
      rightLines.push({
        value: newLine as string,
        added: true,
        lineNumber: i + 1
      });
      
      leftLines.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
    } else if (newLine === null) {
      // Line only exists in the old text
      leftLines.push({
        value: oldLine,
        removed: true,
        lineNumber: i + 1
      });
      
      rightLines.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
    } else if (oldLine !== newLine) {
      // Line exists in both but was modified
      leftLines.push({
        value: oldLine,
        lineNumber: i + 1
      });
      
      rightLines.push({
        value: newLine,
        lineNumber: i + 1
      });
      
      // Mark both lines as modified for further word-level diff
      leftLines[leftLines.length - 1].modified = true;
      rightLines[rightLines.length - 1].modified = true;
    } else {
      // Line exists in both and is unchanged
      leftLines.push({
        value: oldLine,
        lineNumber: i + 1
      });
      
      rightLines.push({
        value: newLine,
        lineNumber: i + 1
      });
    }
  }
  
  // Apply word-level diffs for modified lines
  applyWordDiffsForModifiedLines(leftLines, rightLines);
  
  return { left: leftLines, right: rightLines };
}

// Helper function to apply word-level diffs only to modified lines
function applyWordDiffsForModifiedLines(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): void {
  for (let i = 0; i < leftLines.length; i++) {
    if (leftLines[i].modified && rightLines[i].modified) {
      const leftLine = leftLines[i];
      const rightLine = rightLines[i];
      
      // Apply word-level diff to modified lines
      const leftValue = leftLine.value;
      const rightValue = rightLine.value;
      
      if (leftValue !== rightValue) {
        const wordDiffs = diffLines(leftValue, rightValue);
        
        leftLine.inlineChanges = wordDiffs.map(part => ({
          value: part.value,
          removed: part.removed,
          added: part.added,
        }));
        
        rightLine.inlineChanges = wordDiffs.map(part => ({
          value: part.value,
          removed: part.removed,
          added: part.added,
        }));
      }
    }
  }
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResultWithLineNumbers };
