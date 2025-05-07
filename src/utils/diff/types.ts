
// Type definitions for diff functionality
export interface DiffResult {
  value: string;
  added?: boolean;
  removed?: boolean;
  lineNumber?: number;
}

export interface FormattedDiff {
  left: DiffResultWithLineNumbers[];
  right: DiffResultWithLineNumbers[];
}

export interface DiffResultWithLineNumbers extends DiffResult {
  lineNumber: number;
  modified?: boolean; 
  inlineChanges?: {
    value: string;
    added?: boolean;
    removed?: boolean;
  }[];
  spacer?: boolean; // To indicate this is a placeholder for spacing
  extraLine?: boolean; // To indicate this line exists in original but not in modified
}
