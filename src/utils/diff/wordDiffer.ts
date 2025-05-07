
import { diffWords } from 'diff';
import { DiffResultWithLineNumbers } from './types';

// Function to apply word-level diffs to modified lines
export function applyWordDiffs(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): void {
  // Apply word-level diff only to lines that are modified (not added or removed)
  for (let i = 0; i < Math.min(leftLines.length, rightLines.length); i++) {
    const leftLine = leftLines[i];
    const rightLine = rightLines[i];
    
    // Skip spacers and obvious add/remove pairs
    if (leftLine.spacer || rightLine.spacer || leftLine.added || leftLine.removed || 
        rightLine.added || rightLine.removed) {
      continue;
    }
    
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
