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

// Function to align the lines between left and right sides
export function alignLines(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): {
  alignedLeft: DiffResultWithLineNumbers[];
  alignedRight: DiffResultWithLineNumbers[];
} {
  const alignedLeft: DiffResultWithLineNumbers[] = [];
  const alignedRight: DiffResultWithLineNumbers[] = [];
  
  // Counters for positions in each array
  let leftPos = 0;
  let rightPos = 0;
  
  // Process both arrays simultaneously
  while (leftPos < leftLines.length || rightPos < rightLines.length) {
    const leftLine = leftPos < leftLines.length ? leftLines[leftPos] : null;
    const rightLine = rightPos < rightLines.length ? rightLines[rightPos] : null;
    
    // Case 1: Both sides have a line
    if (leftLine && rightLine) {
      // 1a: If neither side is marked as added or removed, they're supposed to match
      if (!leftLine.added && !leftLine.removed && !rightLine.added && !rightLine.removed) {
        alignedLeft.push(leftLine);
        alignedRight.push(rightLine);
        leftPos++;
        rightPos++;
      }
      // 1b: Left line is removed, need to add a spacer on the right
      else if (leftLine.removed) {
        alignedLeft.push(leftLine);
        alignedRight.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
        leftPos++;
      }
      // 1c: Right line is added, need to add a spacer on the left
      else if (rightLine.added) {
        alignedLeft.push({
          value: '',
          lineNumber: -1,
          spacer: true
        });
        alignedRight.push(rightLine);
        rightPos++;
      }
    }
    // Case 2: Only left side has a line
    else if (leftLine) {
      alignedLeft.push(leftLine);
      alignedRight.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
      leftPos++;
    }
    // Case 3: Only right side has a line
    else if (rightLine) {
      alignedLeft.push({
        value: '',
        lineNumber: -1,
        spacer: true
      });
      alignedRight.push(rightLine);
      rightPos++;
    }
  }

  return { alignedLeft, alignedRight };
}

// Initial function to prepare the lines
export function prepareLineDiff(oldText: string, newText: string): {
  leftLines: DiffResultWithLineNumbers[];
  rightLines: DiffResultWithLineNumbers[];
} {
  // First we need to split the text into lines before passing to diffLines
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Remove empty lines at the end if they exist
  if (oldLines[oldLines.length - 1] === '') oldLines.pop();
  if (newLines[newLines.length - 1] === '') newLines.pop();
  
  return createInitialLineArrays(oldText, newText);
}
