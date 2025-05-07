
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
      
      // Get the raw text from the lines for accurate diffing
      const leftText = leftLine.value;
      const rightText = rightLine.value;
      
      // Perform character-level diff using the actual line content
      const charDiffs = diffChars(leftText, rightText);
      
      // Apply char diffs to left line (removed)
      leftLine.inlineChanges = charDiffs.map(part => ({
        value: part.value,
        removed: part.removed,  // Mark parts that are in left but not in right as removed
        added: false,
      }));
      
      // Apply char diffs to right line (added)
      rightLine.inlineChanges = charDiffs.map(part => ({
        value: part.value,
        removed: false,
        added: part.added,  // Mark parts that are in right but not in left as added
      }));
    }
    
    leftIndex++;
    rightIndex++;
  }
}
