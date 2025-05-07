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
    if (leftLine.removed && rightLine.added) {
      // Get the raw text from the lines for accurate diffing
      const leftText = leftLine.value;
      const rightText = rightLine.value;
      
      // Perform a right-aligned diff to better highlight the differences
      let charDiffs;
      
      // Special case: If one is a substring of the other, perform a special alignment
      if (rightText.includes(leftText) || leftText.includes(rightText)) {
        if (rightText.includes(leftText)) {
          // The left text is fully contained in the right text
          // Find where the differences are by right-aligning
          const commonPrefix = findCommonPrefix(leftText, rightText);
          const commonSuffix = findCommonSuffix(leftText, rightText);
          
          // Create a simulated diff result
          charDiffs = [];
          
          // Common prefix (unchanged)
          if (commonPrefix) {
            charDiffs.push({ value: commonPrefix });
          }
          
          // Middle part - only in right text (added)
          const middleRight = rightText.substring(
            commonPrefix.length, 
            rightText.length - commonSuffix.length
          );
          if (middleRight) {
            charDiffs.push({ value: middleRight, added: true });
          }
          
          // Common suffix (unchanged)
          if (commonSuffix) {
            charDiffs.push({ value: commonSuffix });
          }
        } else {
          // The right text is fully contained in the left text
          // Find where the differences are by right-aligning
          const commonPrefix = findCommonPrefix(leftText, rightText);
          const commonSuffix = findCommonSuffix(leftText, rightText);
          
          // Create a simulated diff result
          charDiffs = [];
          
          // Common prefix (unchanged)
          if (commonPrefix) {
            charDiffs.push({ value: commonPrefix });
          }
          
          // Middle part - only in left text (removed)
          const middleLeft = leftText.substring(
            commonPrefix.length, 
            leftText.length - commonSuffix.length
          );
          if (middleLeft) {
            charDiffs.push({ value: middleLeft, removed: true });
          }
          
          // Common suffix (unchanged)
          if (commonSuffix) {
            charDiffs.push({ value: commonSuffix });
          }
        }
      } else {
        // Use regular char diffing for non-substring cases
        charDiffs = diffChars(leftText, rightText);
      }
      
      // Apply char diffs to left line (removed)
      leftLine.inlineChanges = charDiffs.map(part => ({
        value: part.value,
        removed: part.removed ?? false,
        added: false,
      })).filter(part => part.value.length > 0);
      
      // Apply char diffs to right line (added)
      rightLine.inlineChanges = charDiffs.map(part => ({
        value: part.value,
        removed: false,
        added: part.added ?? false,
      })).filter(part => part.value.length > 0);
    }
    
    leftIndex++;
    rightIndex++;
  }
}

// Helper function to find common prefix of two strings
function findCommonPrefix(str1: string, str2: string): string {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
    i++;
  }
  return str1.substring(0, i);
}

// Helper function to find common suffix of two strings
function findCommonSuffix(str1: string, str2: string): string {
  let i = 0;
  while (
    i < str1.length &&
    i < str2.length &&
    str1[str1.length - 1 - i] === str2[str2.length - 1 - i]
  ) {
    i++;
  }
  return i > 0 ? str1.substring(str1.length - i) : '';
}
