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

  // Process each line with smarter alignment
  for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : null;
    const newLine = i < newLines.length ? newLines[i] : null;
    
    // Case 1: Line exists in both old and new
    if (oldLine !== null && newLine !== null) {
      // Check if lines are identical
      if (oldLine === newLine) {
        // Add unchanged line to both sides
        leftLines.push({
          value: oldLine,
          lineNumber: leftLineNumber++
        });
        
        rightLines.push({
          value: newLine,
          lineNumber: rightLineNumber++
        });
      } else {
        // Lines are different but at same position - mark as modified
        leftLines.push({
          value: oldLine,
          lineNumber: leftLineNumber++,
          removed: true  // Mark as removed in left side as per requirement
        });
        
        rightLines.push({
          value: newLine,
          lineNumber: rightLineNumber++,
          added: true    // Mark as added in right side as per requirement
        });
      }
    }
    // Case 2: Line exists only in old text
    else if (oldLine !== null) {
      // Line was removed
      leftLines.push({
        value: oldLine,
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
    // Case 3: Line exists only in new text
    else if (newLine !== null) {
      // Add a spacer in left side
      leftLines.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
      
      // Line was added
      rightLines.push({
        value: newLine,
        added: true,
        lineNumber: rightLineNumber++
      });
    }
  }
  
  // Apply word-level diffs for modified lines
  applyWordDiffs(leftLines, rightLines);
  
  return { left: leftLines, right: rightLines };
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResultWithLineNumbers };
