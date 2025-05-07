
import { diffChars } from 'diff';
import { DiffResultWithLineNumbers } from './types';

// Function to apply character-level diffs to modified lines
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
      // Perform character-level diff instead of word-level
      const charDiffs = diffChars(leftLine.value, rightLine.value);
      
      // Apply char diffs to left line (removed)
      leftLine.inlineChanges = charDiffs.map(part => ({
        value: part.value,
        removed: part.removed,
        added: false, // For left side, we only care about removed parts
      }));
      
      // Apply char diffs to right line (added)
      rightLine.inlineChanges = charDiffs.map(part => ({
        value: part.value,
        removed: false, // For right side, we only care about added parts
        added: part.added,
      }));
    }
    
    leftIndex++;
    rightIndex++;
  }
}
