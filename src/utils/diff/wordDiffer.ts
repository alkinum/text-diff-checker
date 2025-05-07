
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
    if (leftLines[leftIdx].removed && rightLines[rightIdx].added) {
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
    
    // Find common substrings to highlight only the differences
    highlightSubstringChanges(leftLine, rightLine, leftText, rightText);
  }
}

// Function to find and highlight differences in substrings
function highlightSubstringChanges(
  leftLine: DiffResultWithLineNumbers, 
  rightLine: DiffResultWithLineNumbers, 
  leftText: string, 
  rightText: string
): void {
  // Find common prefix and suffix
  const commonPrefix = findCommonPrefix(leftText, rightText);
  const commonSuffix = findCommonSuffix(
    leftText.substring(commonPrefix.length),
    rightText.substring(commonPrefix.length)
  );
  
  // Calculate the middle sections (the different parts)
  const leftMiddle = leftText.substring(
    commonPrefix.length,
    leftText.length - commonSuffix.length
  );
  
  const rightMiddle = rightText.substring(
    commonPrefix.length,
    rightText.length - commonSuffix.length
  );
  
  // Create inline changes for the left line
  leftLine.inlineChanges = [];
  if (commonPrefix) {
    leftLine.inlineChanges.push({ value: commonPrefix, removed: false, added: false });
  }
  if (leftMiddle) {
    leftLine.inlineChanges.push({ value: leftMiddle, removed: true, added: false });
  }
  if (commonSuffix) {
    leftLine.inlineChanges.push({ value: commonSuffix, removed: false, added: false });
  }
  
  // Create inline changes for the right line
  rightLine.inlineChanges = [];
  if (commonPrefix) {
    rightLine.inlineChanges.push({ value: commonPrefix, removed: false, added: false });
  }
  if (rightMiddle) {
    rightLine.inlineChanges.push({ value: rightMiddle, removed: false, added: true });
  }
  if (commonSuffix) {
    rightLine.inlineChanges.push({ value: commonSuffix, removed: false, added: false });
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
