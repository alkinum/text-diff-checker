
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

    // Look for pairs of lines that should be compared for word diffs
    // Either both are at the same position, or marked as added/removed
    if (leftLine.removed && rightLine.added && 
        // Ensure we're looking at lines in the same position
        leftIndex === rightIndex) {
      // Perform word-level diff
      const wordDiffs = diffWords(leftLine.value, rightLine.value);
      
      // Apply word diffs to left line (removed)
      leftLine.inlineChanges = wordDiffs.map(part => ({
        value: part.value,
        removed: part.removed,
        added: false, // For left side, we only care about removed parts
      }));
      
      // Apply word diffs to right line (added)
      rightLine.inlineChanges = wordDiffs.map(part => ({
        value: part.value,
        removed: false, // For right side, we only care about added parts
        added: part.added,
      }));
    }
    
    leftIndex++;
    rightIndex++;
  }
}
