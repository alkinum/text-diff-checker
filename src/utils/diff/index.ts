import { diffLines } from 'diff';
import { applyWordDiffs } from './wordDiffer';
import { detectLanguage } from './languageDetector';
import { FormattedDiff, DiffResultWithLineNumbers } from './types';

// Main function to compute line-by-line differences with proper alignment
export function computeLineDiff(oldText: string, newText: string): FormattedDiff {
  // First, split both texts into lines
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Create arrays to store the aligned line-by-line diff result
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];

  let leftLineNumber = 1;
  let rightLineNumber = 1;

  // Get the diff results
  const changes = diffLines(oldText, newText);

  // First pass: identify adjacent removed/added pairs to mark them as modified instead
  const processedChanges = [];
  let i = 0;

  while (i < changes.length) {
    const current = changes[i];
    const next = i + 1 < changes.length ? changes[i + 1] : null;

    // If we have a removed line followed by an added line, we'll treat it as a modification
    if (current.removed && next && next.added) {
      // Create a modified change that combines both (will be handled specially)
      processedChanges.push({
        modified: true,
        oldValue: current.value,
        newValue: next.value
      });
      i += 2; // Skip the next change since we've processed it
    } else {
      // Keep the original change
      processedChanges.push(current);
      i++;
    }
  }

  // Process each change
  for (const part of processedChanges) {
    if (part.modified) {
      // This is our special case for modifications
      const oldLines = part.oldValue.split('\n');
      const newLines = part.newValue.split('\n');

      // Calculate actual number of lines (excluding empty trailing lines)
      const oldLineCount = oldLines.length > 0 && oldLines[oldLines.length - 1] === '' ?
        oldLines.length - 1 : oldLines.length;
      const newLineCount = newLines.length > 0 && newLines[newLines.length - 1] === '' ?
        newLines.length - 1 : newLines.length;

      // Handle modifications line by line with proper alignment
      const minLines = Math.min(oldLineCount, newLineCount);

      // First, add paired modified lines
      for (let i = 0; i < minLines; i++) {
        if (oldLines[i] === '' && i === oldLineCount - 1 &&
          newLines[i] === '' && i === newLineCount - 1) {
          continue; // Skip empty trailing lines
        }

        leftLines.push({
          value: oldLines[i],
          removed: true,
          lineNumber: leftLineNumber++,
          modified: true
        });

        rightLines.push({
          value: newLines[i],
          added: true,
          lineNumber: rightLineNumber++,
          modified: true
        });
      }

      // Then handle any remaining lines in the old text
      for (let i = minLines; i < oldLineCount; i++) {
        leftLines.push({
          value: oldLines[i],
          removed: true,
          lineNumber: leftLineNumber++
        });

        rightLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
      }

      // Then handle any remaining lines in the new text
      for (let i = minLines; i < newLineCount; i++) {
        leftLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });

        rightLines.push({
          value: newLines[i],
          added: true,
          lineNumber: rightLineNumber++
        });
      }
    } else if (part.added) {
      // Added lines
      const lines = part.value.split('\n');
      const lineCount = lines.length > 0 && lines[lines.length - 1] === '' ?
        lines.length - 1 : lines.length;

      for (let i = 0; i < lineCount; i++) {
        // Add a spacer in left side
        leftLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });

        // Add the line on right side
        rightLines.push({
          value: lines[i],
          added: true,
          lineNumber: rightLineNumber++
        });
      }
    } else if (part.removed) {
      // Removed lines
      const lines = part.value.split('\n');
      const lineCount = lines.length > 0 && lines[lines.length - 1] === '' ?
        lines.length - 1 : lines.length;

      for (let i = 0; i < lineCount; i++) {
        // Add the line on left side
        leftLines.push({
          value: lines[i],
          removed: true,
          lineNumber: leftLineNumber++
        });

        // Add a spacer in right side
        rightLines.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
      }
    } else {
      // Unchanged lines
      const lines = part.value.split('\n');
      const lineCount = lines.length > 0 && lines[lines.length - 1] === '' ?
        lines.length - 1 : lines.length;

      for (let i = 0; i < lineCount; i++) {
        // Add unchanged line to both sides
        leftLines.push({
          value: lines[i],
          lineNumber: leftLineNumber++
        });

        rightLines.push({
          value: lines[i],
          lineNumber: rightLineNumber++
        });
      }
    }
  }

  // Validate line counts
  const actualLeftLines = leftLines.filter(line => !line.spacer).length;
  const actualRightLines = rightLines.filter(line => !line.spacer).length;

  // Safety check: ensure we don't have more removed lines than actual original lines
  const leftRemoved = leftLines.filter(line => line.removed).length;
  if (leftRemoved > oldLines.length) {
    console.warn("Diff calculation error: More removed lines than original text lines");
    // If we have an error in calculation, we'll regenerate a simpler diff
    return generateSimpleDiff(oldText, newText);
  }

  // Apply character-level diffs for modified lines
  applyWordDiffs(leftLines, rightLines);

  return { left: leftLines, right: rightLines };
}

// A simpler fallback diff generator for problematic cases
function generateSimpleDiff(oldText: string, newText: string): FormattedDiff {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];

  // Calculate actual number of lines (excluding empty trailing lines)
  const oldLineCount = oldLines.length > 0 && oldLines[oldLines.length - 1] === '' ?
    oldLines.length - 1 : oldLines.length;
  const newLineCount = newLines.length > 0 && newLines[newLines.length - 1] === '' ?
    newLines.length - 1 : newLines.length;

  // First, add all existing lines from the old text as removed
  for (let i = 0; i < oldLineCount; i++) {
    leftLines.push({
      value: oldLines[i],
      removed: true,
      lineNumber: i + 1
    });
  }

  // Then add all new lines as added
  for (let i = 0; i < newLineCount; i++) {
    rightLines.push({
      value: newLines[i],
      added: true,
      lineNumber: i + 1
    });
  }

  // Add spacers to align the arrays
  const maxLines = Math.max(leftLines.length, rightLines.length);

  while (leftLines.length < maxLines) {
    leftLines.push({
      value: '',
      lineNumber: -1,
      spacer: true
    });
  }

  while (rightLines.length < maxLines) {
    rightLines.push({
      value: '',
      lineNumber: -1,
      spacer: true
    });
  }

  return { left: leftLines, right: rightLines };
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResultWithLineNumbers };
