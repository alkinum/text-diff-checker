
import { DiffResultWithLineNumbers } from './types';

// These functions are kept for compatibility with existing code that might import them,
// but they are now just simple pass-through functions as the alignment is handled directly
// in the main computeLineDiff function
export function prepareLineDiff(oldText: string, newText: string): {
  leftLines: DiffResultWithLineNumbers[];
  rightLines: DiffResultWithLineNumbers[];
} {
  // This is now a no-op function as alignment is handled in computeLineDiff
  return { leftLines: [], rightLines: [] };
}

export function alignLines(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): {
  alignedLeft: DiffResultWithLineNumbers[];
  alignedRight: DiffResultWithLineNumbers[];
} {
  // This is now a no-op function as alignment is handled in computeLineDiff
  return { alignedLeft: leftLines, alignedRight: rightLines };
}
