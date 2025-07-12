import { describe, it, expect } from 'vitest';
import { prepareLineDiff, alignLines } from '@/utils/diff/lineAligner';

describe('Line Aligner', () => {
  describe('prepareLineDiff', () => {
    it('should return empty arrays for no-op function', () => {
      const result = prepareLineDiff('old text', 'new text');
      
      expect(result).toEqual({
        leftLines: [],
        rightLines: [],
      });
    });

    it('should handle empty strings', () => {
      const result = prepareLineDiff('', '');
      
      expect(result).toEqual({
        leftLines: [],
        rightLines: [],
      });
    });

    it('should handle null/undefined inputs', () => {
      const result1 = prepareLineDiff('', '');
      const result2 = prepareLineDiff('text', '');
      const result3 = prepareLineDiff('', 'text');
      
      expect(result1).toEqual({ leftLines: [], rightLines: [] });
      expect(result2).toEqual({ leftLines: [], rightLines: [] });
      expect(result3).toEqual({ leftLines: [], rightLines: [] });
    });

    it('should handle multiline text', () => {
      const oldText = 'line1\nline2\nline3';
      const newText = 'line1\nmodified\nline3';
      
      const result = prepareLineDiff(oldText, newText);
      
      expect(result).toEqual({
        leftLines: [],
        rightLines: [],
      });
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      const result = prepareLineDiff(longText, longText);
      
      expect(result).toEqual({
        leftLines: [],
        rightLines: [],
      });
    });
  });

  describe('alignLines', () => {
    it('should return input arrays unchanged for no-op function', () => {
      const leftLines = [
        { value: 'line 1', lineNumber: 1, removed: true },
        { value: 'line 2', lineNumber: 2, removed: true },
      ];
      
      const rightLines = [
        { value: 'modified 1', lineNumber: 1, added: true },
        { value: 'modified 2', lineNumber: 2, added: true },
      ];
      
      const result = alignLines(leftLines, rightLines);
      
      expect(result).toEqual({
        alignedLeft: leftLines,
        alignedRight: rightLines,
      });
    });

    it('should handle empty arrays', () => {
      const result = alignLines([], []);
      
      expect(result).toEqual({
        alignedLeft: [],
        alignedRight: [],
      });
    });

    it('should handle asymmetric arrays', () => {
      const leftLines = [
        { value: 'line 1', lineNumber: 1 },
      ];
      
      const rightLines = [
        { value: 'line 1', lineNumber: 1 },
        { value: 'line 2', lineNumber: 2, added: true },
      ];
      
      const result = alignLines(leftLines, rightLines);
      
      expect(result).toEqual({
        alignedLeft: leftLines,
        alignedRight: rightLines,
      });
    });

    it('should handle lines with different properties', () => {
      const leftLines = [
        { value: 'line 1', lineNumber: 1, removed: true, modified: true },
        { value: '', lineNumber: -1, spacer: true },
      ];
      
      const rightLines = [
        { value: 'modified 1', lineNumber: 1, added: true, modified: true },
        { value: 'new line', lineNumber: 2, added: true },
      ];
      
      const result = alignLines(leftLines, rightLines);
      
      expect(result.alignedLeft).toEqual(leftLines);
      expect(result.alignedRight).toEqual(rightLines);
    });

    it('should handle lines with inline changes', () => {
      const leftLines = [
        { 
          value: 'hello world', 
          lineNumber: 1, 
          removed: true,
          inlineChanges: [
            { value: 'hello ', added: false, removed: false },
            { value: 'world', added: false, removed: true },
          ]
        },
      ];
      
      const rightLines = [
        { 
          value: 'hello universe', 
          lineNumber: 1, 
          added: true,
          inlineChanges: [
            { value: 'hello ', added: false, removed: false },
            { value: 'universe', added: true, removed: false },
          ]
        },
      ];
      
      const result = alignLines(leftLines, rightLines);
      
      expect(result.alignedLeft[0].inlineChanges).toEqual(leftLines[0].inlineChanges);
      expect(result.alignedRight[0].inlineChanges).toEqual(rightLines[0].inlineChanges);
    });

    it('should preserve object references', () => {
      const leftLines = [
        { value: 'line 1', lineNumber: 1 },
      ];
      
      const rightLines = [
        { value: 'line 1', lineNumber: 1 },
      ];
      
      const result = alignLines(leftLines, rightLines);
      
      // Should return the same references since it's a no-op
      expect(result.alignedLeft).toBe(leftLines);
      expect(result.alignedRight).toBe(rightLines);
    });

    it('should handle large arrays efficiently', () => {
      const leftLines = Array.from({ length: 1000 }, (_, i) => ({
        value: `line ${i}`,
        lineNumber: i + 1,
      }));
      
      const rightLines = Array.from({ length: 1000 }, (_, i) => ({
        value: `modified ${i}`,
        lineNumber: i + 1,
      }));
      
      const startTime = Date.now();
      const result = alignLines(leftLines, rightLines);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast for no-op
      expect(result.alignedLeft).toHaveLength(1000);
      expect(result.alignedRight).toHaveLength(1000);
    });
  });

  describe('Integration with current implementation', () => {
    it('should be compatible with current diff system', () => {
      // Test that the no-op functions don't break the existing system
      const oldText = 'function hello() {\n  console.log("world");\n}';
      const newText = 'function hello() {\n  console.log("universe");\n}';
      
      const lineDiffResult = prepareLineDiff(oldText, newText);
      expect(lineDiffResult.leftLines).toEqual([]);
      expect(lineDiffResult.rightLines).toEqual([]);
      
      const alignResult = alignLines([], []);
      expect(alignResult.alignedLeft).toEqual([]);
      expect(alignResult.alignedRight).toEqual([]);
    });

    it('should handle edge cases that might occur in real usage', () => {
      // Test with various edge cases
      const testCases = [
        { old: '', new: '' },
        { old: 'a', new: 'b' },
        { old: '\n', new: '\n\n' },
        { old: 'a\n\nb', new: 'a\n\n\nb' },
        { old: 'line with spaces   ', new: 'line with spaces' },
        { old: '\tindented', new: '  indented' },
      ];
      
      testCases.forEach(({ old, new: newText }) => {
        const result = prepareLineDiff(old, newText);
        expect(result).toEqual({ leftLines: [], rightLines: [] });
      });
    });

    it('should maintain type safety', () => {
      // Ensure the functions maintain proper TypeScript types
      const leftLines = [
        { value: 'test', lineNumber: 1, removed: true },
      ];
      
      const rightLines = [
        { value: 'test', lineNumber: 1, added: true },
      ];
      
      const result = alignLines(leftLines, rightLines);
      
      // TypeScript should ensure these properties exist
      expect(result.alignedLeft[0]).toHaveProperty('value');
      expect(result.alignedLeft[0]).toHaveProperty('lineNumber');
      expect(result.alignedRight[0]).toHaveProperty('value');
      expect(result.alignedRight[0]).toHaveProperty('lineNumber');
    });
  });
}); 