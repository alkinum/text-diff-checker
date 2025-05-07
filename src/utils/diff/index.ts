import { diffLines } from 'diff';
import { prepareLineDiff, alignLines } from './lineAligner';
import { applyWordDiffs } from './wordDiffer';
import { detectLanguage } from './languageDetector';
import { FormattedDiff, DiffResult, DiffResultWithLineNumbers } from './types';

// Main function to compute line-by-line differences with proper alignment
export function computeLineDiff(oldText: string, newText: string): FormattedDiff {
  // First, compute the raw line-by-line differences
  const diff = diffLines(oldText, newText);
  
  // Create aligned arrays of line differences
  const { leftLines, rightLines } = createAlignedDiffs(diff);
  
  // Apply word-level diffs for modified lines
  applyWordDiffs(leftLines, rightLines);
  
  return { left: leftLines, right: rightLines };
}

// Helper function to create aligned arrays from the diff result
function createAlignedDiffs(diff: any[]): {
  leftLines: DiffResultWithLineNumbers[];
  rightLines: DiffResultWithLineNumbers[];
} {
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];
  
  let leftLineNumber = 1;
  let rightLineNumber = 1;
  
  // Process each diff part
  diff.forEach(part => {
    const lines = part.value.split('\n');
    
    // Remove empty line at the end (from trailing newline)
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    if (part.added) {
      // Added lines go only to the right side
      lines.forEach(line => {
        // Add a spacer on the left for alignment
        leftLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
        
        rightLines.push({
          value: line,
          added: true,
          lineNumber: rightLineNumber++
        });
      });
    } else if (part.removed) {
      // Removed lines go only to the left side
      lines.forEach(line => {
        leftLines.push({
          value: line,
          removed: true,
          lineNumber: leftLineNumber++
        });
        
        // Add a spacer on the right for alignment
        rightLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
      });
    } else {
      // Unchanged lines go to both sides
      lines.forEach(line => {
        leftLines.push({
          value: line,
          lineNumber: leftLineNumber++
        });
        
        rightLines.push({
          value: line,
          lineNumber: rightLineNumber++
        });
      });
    }
  });
  
  return { leftLines, rightLines };
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResult, DiffResultWithLineNumbers };
