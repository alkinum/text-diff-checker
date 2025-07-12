import { diffLines } from 'diff';
import { applyWordDiffs } from './wordDiffer';
import { detectLanguage } from './languageDetector';
import { FormattedDiff, DiffResultWithLineNumbers } from './types';

// Define line comparison result type
interface LineDiffResult {
  value: string;
  added?: boolean;
  removed?: boolean;
  count?: number;
}

// Text preprocessing: remove unnecessary whitespace and normalize line breaks
function preprocessText(text: string): { processedText: string, originalLines: string[] } {
  if (!text) return { processedText: text, originalLines: [] };

  // Normalize line breaks
  let processed = text.replace(/\r\n|\r/g, '\n');

  // Remove excess empty lines at end of file (but keep one if originally present)
  const hasTrailingNewline = processed.endsWith('\n');
  processed = processed.replace(/\n+$/, '');
  if (hasTrailingNewline) {
    processed += '\n';
  }

  const originalLines = processed.split('\n');

  return { processedText: processed, originalLines };
}

// Process line diff calculation synchronously
function processLineDiff(oldText: string, newText: string): LineDiffResult[] {
  // Quick optimization: if texts are identical, return early
  if (oldText === newText) {
    return oldText ? [{ value: oldText }] : [];
  }

  const totalLength = oldText.length + newText.length;

  // For extremely large text, use chunked strategy
  if (totalLength > 500000) { // 500KB threshold
    console.warn(`Text extremely large (${totalLength} chars), using chunked line diff`);
    return processChunkedLineDiff(oldText, newText);
  }

  // Use standard diff for all other cases
  return diffLines(oldText, newText);
}

// Chunked line diff processing
function processChunkedLineDiff(oldText: string, newText: string): LineDiffResult[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // If number of lines is not too many, process directly
  if (oldLines.length + newLines.length < 10000) {
    return diffLines(oldText, newText);
  }

  // Find common beginning and ending lines
  let commonStart = 0;
  let commonEnd = 0;
  const minLines = Math.min(oldLines.length, newLines.length);

  // Find common beginning lines
  while (commonStart < minLines && oldLines[commonStart] === newLines[commonStart]) {
    commonStart++;
  }

  // Find common ending lines
  while (commonEnd < minLines - commonStart &&
         oldLines[oldLines.length - 1 - commonEnd] === newLines[newLines.length - 1 - commonEnd]) {
    commonEnd++;
  }

  const result: LineDiffResult[] = [];

  // Add common beginning
  for (let i = 0; i < commonStart; i++) {
    result.push({ value: oldLines[i] + '\n' });
  }

  // Process middle difference part
  const oldMiddleLines = oldLines.slice(commonStart, oldLines.length - commonEnd);
  const newMiddleLines = newLines.slice(commonStart, newLines.length - commonEnd);

  if (oldMiddleLines.length > 0 || newMiddleLines.length > 0) {
    const oldMiddleText = oldMiddleLines.join('\n') + (oldMiddleLines.length > 0 ? '\n' : '');
    const newMiddleText = newMiddleLines.join('\n') + (newMiddleLines.length > 0 ? '\n' : '');

    // Diff the middle part
    try {
      const middleDiff = diffLines(oldMiddleText, newMiddleText);
      result.push(...middleDiff);
    } catch (e) {
      // If worker fails, use simple delete/add strategy
      if (oldMiddleText) {
        result.push({ value: oldMiddleText, removed: true });
      }
      if (newMiddleText) {
        result.push({ value: newMiddleText, added: true });
      }
    }
  }

  // Add common ending
  for (let i = oldLines.length - commonEnd; i < oldLines.length; i++) {
    result.push({ value: oldLines[i] + '\n' });
  }

  return result;
}

// Memory-optimized line processing function
function processLinesInBatches<T>(
  lines: T[],
  batchSize: number,
  processor: (batch: T[], startIndex: number) => void
): void {
  for (let i = 0; i < lines.length; i += batchSize) {
    const batch = lines.slice(i, i + batchSize);
    processor(batch, i);
  }
}

// Main function to compute line-by-line differences with proper alignment
export function computeLineDiff(
  oldText: string,
  newText: string,
): FormattedDiff {
  // Preprocess text (don't ignore whitespace)
  const processedOldText = preprocessText(oldText);
  const processedNewText = preprocessText(newText);

  // Early return for identical texts
  if (processedOldText.processedText === processedNewText.processedText) {
    const lines = processedOldText.originalLines;
    const leftLines: DiffResultWithLineNumbers[] = [];
    const rightLines: DiffResultWithLineNumbers[] = [];

    lines.forEach((line, index) => {
      // Check and remove last empty line
      if (index === lines.length - 1 && line === '') return;
      
      leftLines.push({
        value: line,
        lineNumber: index + 1
      });
      rightLines.push({
        value: line,
        lineNumber: index + 1
      });
    });

    return { left: leftLines, right: rightLines };
  }

  // Split both texts into lines for diffing
  const oldDiffLines = processedOldText.processedText.split('\n');
  const newDiffLines = processedNewText.processedText.split('\n');
  
  // Keep original lines for display
  const oldOriginalLines = processedOldText.originalLines;
  const newOriginalLines = processedNewText.originalLines;


  // Create arrays to store the aligned line-by-line diff result
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];

  let leftLineNumber = 1;
  let rightLineNumber = 1;

  // Get the diff results - use Worker async calculation if available
  let changes: LineDiffResult[];
  try {
    changes = processLineDiff(processedOldText.processedText, processedNewText.processedText);
  } catch (e) {
    console.error('Line diff calculation failed, falling back to simple strategy:', e);
    // Simple fallback for extreme cases
    return generateSimpleDiff(processedOldText.processedText, processedNewText.processedText);
  }

  // Validate changes result
  if (!changes || changes.length === 0) {
    return generateSimpleDiff(processedOldText.processedText, processedNewText.processedText);
  }

  // Process changes in batches for memory efficiency
  const BATCH_SIZE = 1000; // Process 1000 changes per batch
  const processedChanges = [];
  let i = 0;

  while (i < changes.length) {
    const current = changes[i];
    const next = i + 1 < changes.length ? changes[i + 1] : null;

    // If we have a removed line followed by an added line, treat as modification
    if (current.removed && next && next.added) {
      processedChanges.push({
        modified: true,
        oldValue: current.value,
        newValue: next.value
      });
      i += 2; // Skip the next change since we've processed it
    } else {
      processedChanges.push(current);
      i++;
    }
  }

  // Process each change with memory optimization
  processLinesInBatches(processedChanges, BATCH_SIZE, (batch) => {
    for (const part of batch) {
      if (part.modified) {
        // Handle modifications line by line with proper alignment
        const oldPartLines = part.oldValue.split('\n');
        const newPartLines = part.newValue.split('\n');

        // Calculate actual number of lines (excluding empty trailing lines)
        const oldLineCount = oldPartLines.length > 0 && oldPartLines[oldPartLines.length - 1] === '' ?
          oldPartLines.length - 1 : oldPartLines.length;
        const newLineCount = newPartLines.length > 0 && newPartLines[newPartLines.length - 1] === '' ?
          newPartLines.length - 1 : newPartLines.length;

        const minLines = Math.min(oldLineCount, newLineCount);

        // Add paired modified lines
        for (let i = 0; i < minLines; i++) {
          if (oldPartLines[i] === '' && i === oldLineCount - 1 &&
            newPartLines[i] === '' && i === newLineCount - 1) {
            continue;
          }

          leftLines.push({
            value: oldPartLines[i],
            removed: true,
            lineNumber: leftLineNumber++,
            modified: true
          });

          rightLines.push({
            value: newPartLines[i],
            added: true,
            lineNumber: rightLineNumber++,
            modified: true
          });

          // --- New: Check if only indentation is different, if so build inline space diff directly ---
          const leftObj = leftLines[leftLines.length - 1];
          const rightObj = rightLines[rightLines.length - 1];

          const oldTrimmed = oldPartLines[i].trimStart();
          const newTrimmed = newPartLines[i].trimStart();

          if (oldTrimmed === newTrimmed) {
            // Only indentation difference
            const oldSpaces = oldPartLines[i].substring(0, oldPartLines[i].length - oldTrimmed.length);
            const newSpaces = newPartLines[i].substring(0, newPartLines[i].length - newTrimmed.length);

            leftObj.inlineChanges = [];
            rightObj.inlineChanges = [];

            if (oldSpaces) {
              leftObj.inlineChanges.push({ value: oldSpaces, removed: true, added: false });
            }
            if (newSpaces) {
              rightObj.inlineChanges.push({ value: newSpaces, removed: false, added: true });
            }

            // Common text fragment
            if (oldTrimmed) {
              leftObj.inlineChanges.push({ value: oldTrimmed, removed: false, added: false });
              rightObj.inlineChanges.push({ value: newTrimmed, removed: false, added: false });
            }

            // Mark as processed to avoid subsequent applyWordDiffs reprocessing
            leftObj.indentOnly = true;
            rightObj.indentOnly = true;
          }
        }

        // Handle remaining lines in the old text
        for (let i = minLines; i < oldLineCount; i++) {
          leftLines.push({
            value: oldPartLines[i],
            removed: true,
            lineNumber: leftLineNumber++
          });

          rightLines.push({
            value: '',
            lineNumber: -1,
            spacer: true
          });
        }

        // Handle remaining lines in the new text
        for (let i = minLines; i < newLineCount; i++) {
          leftLines.push({
            value: '',
            lineNumber: -1,
            spacer: true
          });

          rightLines.push({
            value: newPartLines[i],
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
          leftLines.push({
            value: '',
            lineNumber: -1,
            spacer: true
          });

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
          leftLines.push({
            value: lines[i],
            removed: true,
            lineNumber: leftLineNumber++
          });

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
  });

  // Validate line counts to prevent infinite loops or errors
  const actualLeftLines = leftLines.filter(line => !line.spacer).length;
  const actualRightLines = rightLines.filter(line => !line.spacer).length;

  // Safety check
  const leftRemoved = leftLines.filter(line => line.removed).length;
  if (leftRemoved > oldDiffLines.length * 1.5) { // Allow some tolerance
    console.warn("Diff calculation error: Excessive removed lines detected, using simple diff");
    return generateSimpleDiff(processedOldText.processedText, processedNewText.processedText);
  }

  // Apply character-level diffs for modified lines
  try {
    applyWordDiffs(leftLines, rightLines);
  } catch (e) {
    console.warn('Word diff application failed, continuing with line-level diff only:', e);
  }

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
