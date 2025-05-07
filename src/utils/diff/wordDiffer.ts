
import { diffWords } from 'diff';
import { DiffResultWithLineNumbers } from './types';

// Function to apply word-level diffs to modified lines
export function applyWordDiffs(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): void {
  // Apply word-level diff only to lines that are modified (not added or removed)
  for (let i = 0; i < leftLines.length; i++) {
    const leftLine = leftLines[i];
    
    // Skip if this is a spacer
    if (leftLine.spacer) continue;
    
    // Find the corresponding line in the right side (if any)
    const rightIndex = rightLines.findIndex(line => 
      !line.spacer && 
      line.lineNumber === leftLine.lineNumber && 
      !line.added && 
      !leftLine.removed
    );
    
    if (rightIndex === -1) continue; // No matching line
    
    const rightLine = rightLines[rightIndex];
    
    // If lines are different without being marked as added/removed
    if (leftLine.value !== rightLine.value) {
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
      
      // Mark both lines as modified if there are actual differences
      if (wordDiffs.some(part => part.added || part.removed)) {
        leftLine.modified = true;
        rightLine.modified = true;
      }
    }
  }
}
