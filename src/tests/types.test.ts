import { describe, it, expect } from 'vitest';
import type { 
  DiffResult, 
  FormattedDiff, 
  DiffResultWithLineNumbers 
} from '@/utils/diff/types';

describe('Types', () => {
  describe('DiffResult', () => {
    it('should have correct basic structure', () => {
      const diffResult: DiffResult = {
        value: 'test content',
        lineNumber: 1,
      };

      expect(diffResult).toHaveProperty('value');
      expect(diffResult).toHaveProperty('lineNumber');
      expect(typeof diffResult.value).toBe('string');
      expect(typeof diffResult.lineNumber).toBe('number');
    });

    it('should support optional added property', () => {
      const addedResult: DiffResult = {
        value: 'added content',
        lineNumber: 1,
        added: true,
      };

      expect(addedResult.added).toBe(true);
    });

    it('should support optional removed property', () => {
      const removedResult: DiffResult = {
        value: 'removed content',
        lineNumber: 1,
        removed: true,
      };

      expect(removedResult.removed).toBe(true);
    });
  });

  describe('DiffResultWithLineNumbers', () => {
    it('should extend DiffResult with additional properties', () => {
      const extendedResult: DiffResultWithLineNumbers = {
        value: 'modified content',
        lineNumber: 5,
        modified: true,
        inlineChanges: [
          { value: 'unchanged', added: false, removed: false },
          { value: 'added', added: true, removed: false },
        ],
        spacer: false,
        extraLine: false,
        indentOnly: false,
      };

      expect(extendedResult).toHaveProperty('modified');
      expect(extendedResult).toHaveProperty('inlineChanges');
      expect(extendedResult).toHaveProperty('spacer');
      expect(extendedResult).toHaveProperty('extraLine');
      expect(extendedResult).toHaveProperty('indentOnly');
      
      expect(Array.isArray(extendedResult.inlineChanges)).toBe(true);
      expect(extendedResult.inlineChanges).toHaveLength(2);
    });

    it('should support spacer lines', () => {
      const spacerLine: DiffResultWithLineNumbers = {
        value: '',
        lineNumber: -1,
        spacer: true,
      };

      expect(spacerLine.spacer).toBe(true);
      expect(spacerLine.lineNumber).toBe(-1);
      expect(spacerLine.value).toBe('');
    });

    it('should support indent-only changes', () => {
      const indentOnlyLine: DiffResultWithLineNumbers = {
        value: '  console.log("test");',
        lineNumber: 10,
        indentOnly: true,
        inlineChanges: [
          { value: '  ', added: false, removed: true },
          { value: '    ', added: true, removed: false },
          { value: 'console.log("test");', added: false, removed: false },
        ],
      };

      expect(indentOnlyLine.indentOnly).toBe(true);
      expect(indentOnlyLine.inlineChanges).toHaveLength(3);
    });
  });

  describe('FormattedDiff', () => {
    it('should contain left and right line arrays', () => {
      const formattedDiff: FormattedDiff = {
        left: [
          { value: 'line 1', lineNumber: 1 },
          { value: 'line 2', lineNumber: 2, removed: true },
        ],
        right: [
          { value: 'line 1', lineNumber: 1 },
          { value: 'modified line 2', lineNumber: 2, added: true },
        ],
      };

      expect(formattedDiff).toHaveProperty('left');
      expect(formattedDiff).toHaveProperty('right');
      expect(Array.isArray(formattedDiff.left)).toBe(true);
      expect(Array.isArray(formattedDiff.right)).toBe(true);
      expect(formattedDiff.left).toHaveLength(2);
      expect(formattedDiff.right).toHaveLength(2);
    });

    it('should handle empty diffs', () => {
      const emptyDiff: FormattedDiff = {
        left: [],
        right: [],
      };

      expect(emptyDiff.left).toHaveLength(0);
      expect(emptyDiff.right).toHaveLength(0);
    });

    it('should handle asymmetric diffs', () => {
      const asymmetricDiff: FormattedDiff = {
        left: [
          { value: 'only on left', lineNumber: 1, removed: true },
          { value: '', lineNumber: -1, spacer: true },
        ],
        right: [
          { value: '', lineNumber: -1, spacer: true },
          { value: 'only on right', lineNumber: 1, added: true },
        ],
      };

      expect(asymmetricDiff.left).toHaveLength(2);
      expect(asymmetricDiff.right).toHaveLength(2);
      expect(asymmetricDiff.left[0].removed).toBe(true);
      expect(asymmetricDiff.right[1].added).toBe(true);
      expect(asymmetricDiff.left[1].spacer).toBe(true);
      expect(asymmetricDiff.right[0].spacer).toBe(true);
    });
  });

  describe('Type compatibility', () => {
    it('should allow DiffResultWithLineNumbers to be used as DiffResult', () => {
      const extendedResult: DiffResultWithLineNumbers = {
        value: 'test',
        lineNumber: 1,
        modified: true,
      };

      // This should compile without errors
      const basicResult: DiffResult = extendedResult;
      expect(basicResult.value).toBe('test');
      expect(basicResult.lineNumber).toBe(1);
    });

    it('should handle complex inline changes structure', () => {
      const complexInlineChanges = [
        { value: 'const ', added: false, removed: false },
        { value: 'oldVar', added: false, removed: true },
        { value: 'newVar', added: true, removed: false },
        { value: ' = ', added: false, removed: false },
        { value: '42', added: false, removed: true },
        { value: '100', added: true, removed: false },
        { value: ';', added: false, removed: false },
      ];

      const complexLine: DiffResultWithLineNumbers = {
        value: 'const newVar = 100;',
        lineNumber: 15,
        modified: true,
        inlineChanges: complexInlineChanges,
      };

      expect(complexLine.inlineChanges).toHaveLength(7);
      expect(complexLine.inlineChanges?.filter(c => c.removed)).toHaveLength(2);
      expect(complexLine.inlineChanges?.filter(c => c.added)).toHaveLength(2);
      expect(complexLine.inlineChanges?.filter(c => !c.added && !c.removed)).toHaveLength(3);
    });
  });
}); 