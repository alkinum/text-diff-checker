
import { prepareLineDiff, alignLines } from './lineAligner';
import { applyWordDiffs } from './wordDiffer';
import { detectLanguage } from './languageDetector';
import { FormattedDiff, DiffResult, DiffResultWithLineNumbers } from './types';

// Main function to compute line-by-line differences with proper alignment
export function computeLineDiff(oldText: string, newText: string): FormattedDiff {
  // First pass: Process the differences to create initial line arrays
  const { leftLines, rightLines } = prepareLineDiff(oldText, newText);
  
  // Second pass: Match up the lines between left and right sides to ensure proper alignment
  const { alignedLeft, alignedRight } = alignLines(leftLines, rightLines);
  
  // Third pass: Perform word-level diffs for modified lines
  applyWordDiffs(alignedLeft, alignedRight);
  
  return { left: alignedLeft, right: alignedRight };
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResult, DiffResultWithLineNumbers };
