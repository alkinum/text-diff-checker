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
      const maxLines = Math.max(
        oldLines.length > 0 && oldLines[oldLines.length - 1] === '' ? oldLines.length - 1 : oldLines.length,
        newLines.length > 0 && newLines[newLines.length - 1] === '' ? newLines.length - 1 : newLines.length
      );
      
      for (let i = 0; i < maxLines; i++) {
        const oldLine = i < oldLines.length ? oldLines[i] : '';
        const newLine = i < newLines.length ? newLines[i] : '';
        
        // Skip empty trailing lines
        if (i === oldLines.length - 1 && oldLine === '' && 
            i === newLines.length - 1 && newLine === '') {
          continue;
        }
        
        // Add lines side by side with modification markers
        leftLines.push({
          value: i < oldLines.length && oldLines[i] !== '' ? oldLines[i] : '',
          removed: true,
          lineNumber: leftLineNumber++,
          modified: true
        });
        
        rightLines.push({
          value: i < newLines.length && newLines[i] !== '' ? newLines[i] : '',
          added: true,
          lineNumber: rightLineNumber++,
          modified: true
        });
      }
    } else if (part.added) {
      // Added lines
      const lines = part.value.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Skip the last element if it's empty (due to trailing newline)
        if (i === lines.length - 1 && lines[i] === '') continue;
        
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
      for (let i = 0; i < lines.length; i++) {
        // Skip the last element if it's empty (due to trailing newline)
        if (i === lines.length - 1 && lines[i] === '') continue;
        
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
      for (let i = 0; i < lines.length; i++) {
        // Skip the last element if it's empty (due to trailing newline)
        if (i === lines.length - 1 && lines[i] === '') continue;
        
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
  
  // Apply character-level diffs for modified lines
  applyWordDiffs(leftLines, rightLines);
  
  return { left: leftLines, right: rightLines };
}

// Re-export all types and utilities
export { detectLanguage };
export type { FormattedDiff, DiffResultWithLineNumbers };
