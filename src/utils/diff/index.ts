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
  
  // Get basic diff to identify added/removed blocks
  const diff = diffLines(oldText, newText);
  
  let leftLineNumber = 1;
  let rightLineNumber = 1;

  // Helper function to identify modified lines vs add/remove
  const isInlineModification = (oldIndex: number, newIndex: number): boolean => {
    if (oldIndex >= oldLines.length || newIndex >= newLines.length) return false;
    
    const oldLine = oldLines[oldIndex];
    const newLine = newLines[newIndex];
    
    // If lines are similar but not identical, treat as modification
    if (oldLine !== newLine && 
        (oldLine.length > 0 && newLine.length > 0) && 
        (oldLine.substring(0, 3) === newLine.substring(0, 3))) {
      return true;
    }
    
    return false;
  };
  
  let oldIndex = 0;
  let newIndex = 0;
  
  // Process each line with smarter alignment
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    // Case 1: Both lines exist and are identical
    if (oldIndex < oldLines.length && newIndex < newLines.length && 
        oldLines[oldIndex] === newLines[newIndex]) {
      // Add unchanged line to both sides
      leftLines.push({
        value: oldLines[oldIndex],
        lineNumber: leftLineNumber++
      });
      
      rightLines.push({
        value: newLines[newIndex],
        lineNumber: rightLineNumber++
      });
      
      oldIndex++;
      newIndex++;
    }
    // Case 2: Both lines exist but are different - check if it's an inline modification
    else if (oldIndex < oldLines.length && newIndex < newLines.length && 
             isInlineModification(oldIndex, newIndex)) {
      // Add as modified lines rather than add/remove
      leftLines.push({
        value: oldLines[oldIndex],
        lineNumber: leftLineNumber++,
        modified: true
      });
      
      rightLines.push({
        value: newLines[newIndex],
        lineNumber: rightLineNumber++,
        modified: true
      });
      
      oldIndex++;
      newIndex++;
    }
    // Case 3: Line removed from old text
    else if (oldIndex < oldLines.length && 
            (newIndex >= newLines.length || 
             !newLines.slice(newIndex).includes(oldLines[oldIndex]))) {
      // Add removed line in the left side
      leftLines.push({
        value: oldLines[oldIndex],
        removed: true,
        lineNumber: leftLineNumber++
      });
      
      // Add a spacer in the right side
      rightLines.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
      
      oldIndex++;
    }
    // Case 4: Line added in new text
    else if (newIndex < newLines.length) {
      // Add a spacer in the left side
      leftLines.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
      
      // Add the actual line in the right side
      rightLines.push({
        value: newLines[newIndex],
        added: true,
        lineNumber: rightLineNumber++
      });
      
      newIndex++;
    }
  }
  
  // Apply word-level diffs for modified lines
  applyWordDiffs(leftLines, rightLines);
  
  return { left: leftLines, right: rightLines };
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResultWithLineNumbers };
