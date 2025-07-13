import { describe, it, expect, beforeEach, vi } from 'vitest';
import { applyWordDiffs } from '@/utils/diff/wordDiffer';
import type { DiffResultWithLineNumbers } from '@/utils/diff/types';

describe('WordDiffer', () => {
  describe('applyWordDiffs', () => {
    let leftLines: DiffResultWithLineNumbers[];
    let rightLines: DiffResultWithLineNumbers[];

    beforeEach(() => {
      leftLines = [];
      rightLines = [];
    });

    it('should handle identical lines without changes', () => {
      leftLines = [
        { value: 'same line', lineNumber: 1, modified: true },
      ];
      rightLines = [
        { value: 'same line', lineNumber: 1, modified: true },
      ];

      applyWordDiffs(leftLines, rightLines);

      expect(leftLines[0].inlineChanges).toEqual([
        { value: 'same line', removed: false, added: false }
      ]);
      expect(rightLines[0].inlineChanges).toEqual([
        { value: 'same line', removed: false, added: false }
      ]);
    });

    it('should handle word-level changes', () => {
      leftLines = [
        { value: 'hello world', lineNumber: 1, removed: true },
      ];
      rightLines = [
        { value: 'hello universe', lineNumber: 1, added: true },
      ];

      applyWordDiffs(leftLines, rightLines);

      expect(leftLines[0].inlineChanges).toBeDefined();
      expect(rightLines[0].inlineChanges).toBeDefined();

      // Should have some changes detected
      const leftChanges = leftLines[0].inlineChanges!;
      const rightChanges = rightLines[0].inlineChanges!;

      expect(leftChanges.some(c => c.removed)).toBe(true);
      expect(rightChanges.some(c => c.added)).toBe(true);
    });

    it('should handle character-level changes for small differences', () => {
      leftLines = [
        { value: 'test123', lineNumber: 1, removed: true },
      ];
      rightLines = [
        { value: 'test456', lineNumber: 1, added: true },
      ];

      applyWordDiffs(leftLines, rightLines);

      const leftChanges = leftLines[0].inlineChanges!;
      const rightChanges = rightLines[0].inlineChanges!;

      expect(leftChanges).toBeDefined();
      expect(rightChanges).toBeDefined();
      expect(leftChanges.length).toBeGreaterThan(0);
      expect(rightChanges.length).toBeGreaterThan(0);
    });

    it('should handle empty lines', () => {
      leftLines = [
        { value: '', lineNumber: 1, removed: true },
      ];
      rightLines = [
        { value: 'new content', lineNumber: 1, added: true },
      ];

      applyWordDiffs(leftLines, rightLines);

      expect(leftLines[0].inlineChanges).toBeDefined();
      expect(rightLines[0].inlineChanges).toBeDefined();
    });

    it('should handle lines with only whitespace changes', () => {
      leftLines = [
        { value: '  hello  ', lineNumber: 1, removed: true },
      ];
      rightLines = [
        { value: '    hello    ', lineNumber: 1, added: true },
      ];

      applyWordDiffs(leftLines, rightLines);

      const leftChanges = leftLines[0].inlineChanges!;
      const rightChanges = rightLines[0].inlineChanges!;

      expect(leftChanges).toBeDefined();
      expect(rightChanges).toBeDefined();
    });

    it('should skip spacer lines', () => {
      leftLines = [
        { value: '', lineNumber: -1, spacer: true },
        { value: 'real line', lineNumber: 1, removed: true },
      ];
      rightLines = [
        { value: 'modified line', lineNumber: 1, added: true },
        { value: '', lineNumber: -1, spacer: true },
      ];

      applyWordDiffs(leftLines, rightLines);

      // Spacer lines should not have inlineChanges
      expect(leftLines[0].inlineChanges).toBeUndefined();
      expect(rightLines[1].inlineChanges).toBeUndefined();

      // Real lines should have inlineChanges
      expect(leftLines[1].inlineChanges).toBeDefined();
      expect(rightLines[0].inlineChanges).toBeDefined();
    });

    it('should handle multiple modified line pairs', () => {
      leftLines = [
        { value: 'line one', lineNumber: 1, removed: true },
        { value: 'line two', lineNumber: 2, removed: true },
      ];
      rightLines = [
        { value: 'line ONE', lineNumber: 1, added: true },
        { value: 'line TWO', lineNumber: 2, added: true },
      ];

      applyWordDiffs(leftLines, rightLines);

      expect(leftLines[0].inlineChanges).toBeDefined();
      expect(leftLines[1].inlineChanges).toBeDefined();
      expect(rightLines[0].inlineChanges).toBeDefined();
      expect(rightLines[1].inlineChanges).toBeDefined();
    });

    it('should handle very long lines efficiently', () => {
      const longText1 = 'a'.repeat(10000) + 'different' + 'b'.repeat(10000);
      const longText2 = 'a'.repeat(10000) + 'changed' + 'b'.repeat(10000);

      leftLines = [
        { value: longText1, lineNumber: 1, removed: true },
      ];
      rightLines = [
        { value: longText2, lineNumber: 1, added: true },
      ];

      const startTime = Date.now();
      applyWordDiffs(leftLines, rightLines);
      const endTime = Date.now();

      // Should complete in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(leftLines[0].inlineChanges).toBeDefined();
      expect(rightLines[0].inlineChanges).toBeDefined();
    });

    it('should handle mixed modified and spacer lines', () => {
      leftLines = [
        { value: 'modified line', lineNumber: 1, modified: true },
        { value: '', lineNumber: -1, spacer: true },
        { value: 'another line', lineNumber: 2, removed: true },
      ];
      rightLines = [
        { value: 'modified LINE', lineNumber: 1, modified: true },
        { value: 'new line', lineNumber: 2, added: true },
        { value: '', lineNumber: -1, spacer: true },
      ];

      applyWordDiffs(leftLines, rightLines);

      expect(leftLines[0].inlineChanges).toBeDefined();
      expect(leftLines[1].inlineChanges).toBeUndefined(); // spacer
      expect(leftLines[2].inlineChanges).toBeDefined();

      expect(rightLines[0].inlineChanges).toBeDefined();
      expect(rightLines[1].inlineChanges).toBeDefined();
      expect(rightLines[2].inlineChanges).toBeUndefined(); // spacer
    });

    it('should handle error cases gracefully', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      leftLines = [
        { value: 'test line', lineNumber: 1, removed: true },
      ];
      rightLines = [
        { value: 'test line modified', lineNumber: 1, added: true },
      ];

      // This should not throw even if there are internal errors
      expect(() => {
        applyWordDiffs(leftLines, rightLines);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
