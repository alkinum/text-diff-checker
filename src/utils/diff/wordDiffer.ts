
import { diffChars } from 'diff';
import { DiffResultWithLineNumbers } from './types';

// Function to apply character-level diffs to modified lines
export function applyWordDiffs(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): void {
  // Identify corresponding modified line pairs
  const modifiedPairs: [number, number][] = [];
  
  let leftIdx = 0;
  let rightIdx = 0;
  
  while (leftIdx < leftLines.length && rightIdx < rightLines.length) {
    if (leftLines[leftIdx].spacer) {
      leftIdx++;
      continue;
    }
    
    if (rightLines[rightIdx].spacer) {
      rightIdx++;
      continue;
    }
    
    // Look for pairs of lines that should be compared for word diffs
    // This includes both explicit 'modified' lines and removed/added pairs
    if ((leftLines[leftIdx].removed && rightLines[rightIdx].added) ||
        (leftLines[leftIdx].modified && rightLines[rightIdx].modified)) {
      modifiedPairs.push([leftIdx, rightIdx]);
    }
    
    leftIdx++;
    rightIdx++;
  }
  
  // Now handle modified line pairs with proper highlighting
  for (const [leftIndex, rightIndex] of modifiedPairs) {
    const leftLine = leftLines[leftIndex];
    const rightLine = rightLines[rightIndex];
    
    const leftText = leftLine.value;
    const rightText = rightLine.value;
    
    // Use diffChars to get precise character differences
    const charDiffs = diffChars(leftText, rightText);
    
    // Process the character diffs for the left side
    leftLine.inlineChanges = [];
    rightLine.inlineChanges = [];
    
    // Create inline changes based on char diffs
    for (const part of charDiffs) {
      if (part.added) {
        // Added parts only appear in the right side
        rightLine.inlineChanges.push({
          value: part.value,
          added: true,
          removed: false
        });
      } else if (part.removed) {
        // Removed parts only appear in the left side
        leftLine.inlineChanges.push({
          value: part.value,
          removed: true,
          added: false
        });
      } else {
        // Common parts appear in both sides
        leftLine.inlineChanges.push({
          value: part.value,
          removed: false,
          added: false
        });
        
        rightLine.inlineChanges.push({
          value: part.value,
          removed: false,
          added: false
        });
      }
    }
  }
}
