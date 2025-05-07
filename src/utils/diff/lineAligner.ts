import { diffLines } from 'diff';
import { DiffResultWithLineNumbers, FormattedDiff } from './types';

// Function to create the initial line arrays from diff result
function createInitialLineArrays(oldText: string, newText: string): {
  leftLines: DiffResultWithLineNumbers[];
  rightLines: DiffResultWithLineNumbers[];
} {
  // Calculate the diff between the two arrays of lines
  const differences = diffLines(oldText, newText);
  
  // Initialize our result arrays
  const leftLines: DiffResultWithLineNumbers[] = [];
  const rightLines: DiffResultWithLineNumbers[] = [];
  
  let leftLineNumber = 1;
  let rightLineNumber = 1;
  
  // Process the differences to create initial line arrays
  differences.forEach(part => {
    // Split each part into lines, accounting for newlines
    const lines = part.value.split('\n');
    
    // Remove the last element if it's an empty string (due to trailing newline)
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }

    if (part.added) {
      // Added lines only appear in right side (new text)
      lines.forEach(line => {
        rightLines.push({ 
          value: line, 
          added: true, 
          lineNumber: rightLineNumber++ 
        });
      });
    } else if (part.removed) {
      // Removed lines only appear in left side (old text)
      lines.forEach(line => {
        leftLines.push({ 
          value: line, 
          removed: true, 
          lineNumber: leftLineNumber++ 
        });
      });
    } else {
      // Unchanged lines appear in both sides
      lines.forEach(line => {
        leftLines.push({ value: line, lineNumber: leftLineNumber++ });
        rightLines.push({ value: line, lineNumber: rightLineNumber++ });
      });
    }
  });

  return { leftLines, rightLines };
}

// These are the original functions, but they'll now be unused
export function prepareLineDiff(oldText: string, newText: string): {
  leftLines: DiffResultWithLineNumbers[];
  rightLines: DiffResultWithLineNumbers[];
} {
  return createInitialLineArrays(oldText, newText);
}

export function alignLines(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): {
  alignedLeft: DiffResultWithLineNumbers[];
  alignedRight: DiffResultWithLineNumbers[];
} {
  return { alignedLeft: leftLines, alignedRight: rightLines };
}
