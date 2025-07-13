import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computeLineDiff } from '@/utils/diff/index';

describe('Diff Index (Main Logic)', () => {
  describe('computeLineDiff', () => {
    it('should handle identical texts', () => {
      const text = 'line 1\nline 2\nline 3';
      const result = computeLineDiff(text, text);

      expect(result.left).toHaveLength(3);
      expect(result.right).toHaveLength(3);

      result.left.forEach((line, index) => {
        expect(line.value).toBe(`line ${index + 1}`);
        expect(line.lineNumber).toBe(index + 1);
        expect(line.added).toBeUndefined();
        expect(line.removed).toBeUndefined();
      });
    });

    it('should handle empty texts', () => {
      const result = computeLineDiff('', '');
      expect(result.left).toHaveLength(0);
      expect(result.right).toHaveLength(0);
    });

    it('should handle one empty text', () => {
      const result = computeLineDiff('', 'new line');

      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);
      expect(result.left[0].spacer).toBe(true);
      expect(result.right[0].added).toBe(true);
      expect(result.right[0].value).toBe('new line');
    });

    it('should handle simple line additions', () => {
      const oldText = 'line 1\nline 2';
      const newText = 'line 1\nline 2\nline 3';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(3);
      expect(result.right).toHaveLength(3);

      // First two lines should be unchanged
      expect(result.left[0].value).toBe('line 1');
      expect(result.left[1].value).toBe('line 2');
      expect(result.right[0].value).toBe('line 1');
      expect(result.right[1].value).toBe('line 2');

      // Third line should be added
      expect(result.left[2].spacer).toBe(true);
      expect(result.right[2].added).toBe(true);
      expect(result.right[2].value).toBe('line 3');
    });

    it('should handle simple line deletions', () => {
      const oldText = 'line 1\nline 2\nline 3';
      const newText = 'line 1\nline 3';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(3);
      expect(result.right).toHaveLength(3);

      // First line unchanged
      expect(result.left[0].value).toBe('line 1');
      expect(result.right[0].value).toBe('line 1');

      // Second line removed
      expect(result.left[1].removed).toBe(true);
      expect(result.left[1].value).toBe('line 2');
      expect(result.right[1].spacer).toBe(true);

      // Third line unchanged
      expect(result.left[2].value).toBe('line 3');
      expect(result.right[2].value).toBe('line 3');
    });

    it('should handle line modifications', () => {
      const oldText = 'hello world';
      const newText = 'hello universe';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);

      expect(result.left[0].removed).toBe(true);
      expect(result.left[0].value).toBe('hello world');
      expect(result.right[0].added).toBe(true);
      expect(result.right[0].value).toBe('hello universe');
    });

    it('should handle complex mixed changes', () => {
      const oldText = 'line 1\nold line 2\nline 3\nline 4';
      const newText = 'line 1\nnew line 2\nline 3\nline 5\nline 6';

      const result = computeLineDiff(oldText, newText);

      // Should handle the mix of unchanged, modified, and added lines
      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);
      expect(result.left.length).toBe(result.right.length); // Should be aligned
    });

    it('should handle whitespace-only changes', () => {
      const oldText = 'line with  spaces';
      const newText = 'line with    spaces';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);
      expect(result.left[0].removed).toBe(true);
      expect(result.right[0].added).toBe(true);
    });

    it('should handle trailing newlines correctly', () => {
      const oldText = 'line 1\nline 2\n';
      const newText = 'line 1\nline 2';

      const result = computeLineDiff(oldText, newText);

      // Should handle trailing newlines properly
      expect(result.left.length).toBe(result.right.length);
    });

    it('should handle very large texts efficiently', () => {
      const largeText1 = Array(1000).fill('line content').join('\n');
      const largeText2 = Array(1000).fill('line content').join('\n') + '\nextra line';

      const startTime = Date.now();
      const result = computeLineDiff(largeText1, largeText2);
      const endTime = Date.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);
    });

    it('should handle extremely large texts with chunked processing', () => {
      // Create text larger than 500KB threshold
      const largeContent = 'x'.repeat(100000); // 100KB per line
      const largeText1 = Array(6).fill(largeContent).join('\n'); // ~600KB
      const largeText2 = Array(6).fill(largeContent).join('\n') + '\nextra';

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = computeLineDiff(largeText1, largeText2);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Text extremely large')
      );
      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    it('should handle special characters and unicode', () => {
      const oldText = 'Hello 世界\n🚀 emoji line';
      const newText = 'Hello 世界\n🎉 emoji line';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(2);
      expect(result.right).toHaveLength(2);

      // First line should be unchanged
      expect(result.left[0].value).toBe('Hello 世界');
      expect(result.right[0].value).toBe('Hello 世界');

      // Second line should be modified
      expect(result.left[1].removed).toBe(true);
      expect(result.right[1].added).toBe(true);
    });

    it('should handle error cases gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Should not throw even with problematic input
      expect(() => {
        computeLineDiff('test', 'test\x00\x01\x02');
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should maintain line number consistency', () => {
      const oldText = 'line 1\nline 2\nline 3';
      const newText = 'line 1\nmodified line 2\nline 3\nline 4';

      const result = computeLineDiff(oldText, newText);

      // Check that line numbers are consistent and properly assigned
      result.left.forEach((line) => {
        if (!line.spacer) {
          expect(line.lineNumber).toBeGreaterThan(0);
        } else {
          expect(line.lineNumber).toBe(-1);
        }
      });

      result.right.forEach((line) => {
        if (!line.spacer) {
          expect(line.lineNumber).toBeGreaterThan(0);
        } else {
          expect(line.lineNumber).toBe(-1);
        }
      });
    });

    it('should apply word diffs to modified lines', () => {
      const oldText = 'hello world';
      const newText = 'hello universe';

      const result = computeLineDiff(oldText, newText);

      // Word diffs should be applied
      expect(result.left[0].inlineChanges).toBeDefined();
      expect(result.right[0].inlineChanges).toBeDefined();
      expect(result.left[0].inlineChanges!.length).toBeGreaterThan(0);
      expect(result.right[0].inlineChanges!.length).toBeGreaterThan(0);
    });

    it('should handle fallback to simple diff on errors', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create a scenario that might trigger fallback
      const problematicText1 = 'a'.repeat(1000000); // Very large
      const problematicText2 = 'b'.repeat(1000000);

      const result = computeLineDiff(problematicText1, problematicText2);

      // Should still return a valid result
      expect(result).toBeDefined();
      expect(result.left).toBeDefined();
      expect(result.right).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should handle mixed line endings', () => {
      const oldText = 'line 1\r\nline 2\nline 3\r';
      const newText = 'line 1\nline 2\r\nline 3';

      const result = computeLineDiff(oldText, newText);

      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);
      expect(result.left.length).toBe(result.right.length);
    });

    it('should preserve original content in diff results', () => {
      const oldText = 'original content\nwith multiple lines';
      const newText = 'modified content\nwith multiple lines';

      const result = computeLineDiff(oldText, newText);

      // Find the modified line
      const removedLine = result.left.find(line => line.removed);
      const addedLine = result.right.find(line => line.added);

      expect(removedLine?.value).toBe('original content');
      expect(addedLine?.value).toBe('modified content');
    });
  });
});
