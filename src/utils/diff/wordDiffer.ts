
import { diffWords } from 'diff';
import { DiffResultWithLineNumbers } from './types';

// Function to apply word-level diffs to modified lines
export function applyWordDiffs(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): void {
  let leftIndex = 0;
  let rightIndex = 0;
  
  while (leftIndex < leftLines.length && rightIndex < rightLines.length) {
    const leftLine = leftLines[leftIndex];
    const rightLine = rightLines[rightIndex];
    
    // Skip if either is a spacer
    if (leftLine.spacer) {
      leftIndex++;
      continue;
    }
    
    if (rightLine.spacer) {
      rightIndex++;
      continue;
    }
    
    // Case 1: Both are modified lines - apply word diff
    if (leftLine.modified && rightLine.modified) {
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
    }
    // Case 2: If there's a matching line number - they might be the same line yet one is marked as modified
    else if (leftLine.lineNumber === rightLine.lineNumber && leftLine.value !== rightLine.value) {
      // Do word-level diff for more detailed highlighting
      const wordDiffs = diffWords(leftLine.value, rightLine.value);
      
      // If there are differences, mark as modified
      if (wordDiffs.some(part => part.added || part.removed)) {
        leftLine.modified = true;
        rightLine.modified = true;
        
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
      }
    }
    
    leftIndex++;
    rightIndex++;
  }
}
