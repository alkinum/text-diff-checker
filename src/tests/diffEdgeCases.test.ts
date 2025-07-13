import { describe, it, expect, vi } from 'vitest';
import { computeLineDiff } from '@/utils/diff/index';

describe('Diff Edge Cases', () => {
  describe('Special characters and encoding', () => {
    it('should handle unicode characters correctly', () => {
      const oldText = '🚀 Hello 世界\n🎉 Test line';
      const newText = '🚀 Hello 世界\n🎊 Test line';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(2);
      expect(result.right).toHaveLength(2);
      expect(result.left[0].value).toBe('🚀 Hello 世界');
      expect(result.right[0].value).toBe('🚀 Hello 世界');
      expect(result.left[1].removed).toBe(true);
      expect(result.right[1].added).toBe(true);
    });

    it('should handle null bytes and control characters', () => {
      const oldText = 'line with\x00null\x01control\x02chars';
      const newText = 'line with\x00null\x01modified\x02chars';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);
      expect(result.left[0].removed).toBe(true);
      expect(result.right[0].added).toBe(true);
    });

    it('should handle very long unicode sequences', () => {
      const unicodeChars = '🚀🎉🎊🌟⭐✨💫🌙☀️🌈';
      const oldText = unicodeChars.repeat(100);
      const newText = unicodeChars.repeat(99) + '🔥';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);
      expect(result.left[0].inlineChanges).toBeDefined();
      expect(result.right[0].inlineChanges).toBeDefined();
    });

    it('should handle mixed encoding scenarios', () => {
      const oldText = 'ASCII text\nUTF-8: 世界\nEmoji: 🚀';
      const newText = 'ASCII text\nUTF-8: 宇宙\nEmoji: 🎉';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(3);
      expect(result.right).toHaveLength(3);

      // First line unchanged
      expect(result.left[0].value).toBe('ASCII text');
      expect(result.right[0].value).toBe('ASCII text');

      // Other lines modified
      expect(result.left[1].removed).toBe(true);
      expect(result.right[1].added).toBe(true);
      expect(result.left[2].removed).toBe(true);
      expect(result.right[2].added).toBe(true);
    });
  });

  describe('Whitespace and formatting edge cases', () => {
    it('should handle tabs vs spaces', () => {
      const oldText = '\tindented with tab';
      const newText = '    indented with spaces';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);
      expect(result.left[0].removed).toBe(true);
      expect(result.right[0].added).toBe(true);
    });

    it('should handle mixed line endings', () => {
      const oldText = 'line 1\r\nline 2\nline 3\r';
      const newText = 'line 1\nline 2\r\nline 3';

      const result = computeLineDiff(oldText, newText);

      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);
      expect(result.left.length).toBe(result.right.length);
    });

    it('should handle trailing whitespace', () => {
      const oldText = 'line with trailing spaces   ';
      const newText = 'line with trailing spaces';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);
      expect(result.left[0].removed).toBe(true);
      expect(result.right[0].added).toBe(true);
    });

    it('should handle only whitespace lines', () => {
      const oldText = 'line 1\n   \nline 3';
      const newText = 'line 1\n\t\t\nline 3';

      const result = computeLineDiff(oldText, newText);

      expect(result.left).toHaveLength(3);
      expect(result.right).toHaveLength(3);

      // Middle line should be different
      expect(result.left[1].removed).toBe(true);
      expect(result.right[1].added).toBe(true);
    });
  });

  describe('Extreme size scenarios', () => {
    it('should handle extremely long single line', () => {
      const veryLongLine = 'x'.repeat(1000000); // 1MB line

      const result = computeLineDiff(veryLongLine, veryLongLine + 'y');

      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);
      expect(result.left[0].removed).toBe(true);
      expect(result.right[0].added).toBe(true);
    });

    it('should handle many empty lines', () => {
      const manyEmptyLines = '\n'.repeat(1000);
      const manyEmptyLinesPlus = '\n'.repeat(1001);

      const result = computeLineDiff(manyEmptyLines, manyEmptyLinesPlus);

      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);
    });

    it('should handle alternating pattern with many changes', () => {
      const pattern1 = Array(500).fill(0).map((_, i) =>
        i % 2 === 0 ? 'A' : 'B'
      ).join('\n');
      const pattern2 = Array(500).fill(0).map((_, i) =>
        i % 2 === 0 ? 'B' : 'A'
      ).join('\n');

      const result = computeLineDiff(pattern1, pattern2);

      expect(result.left.length).toBe(result.right.length);
      expect(result.left.length).toBeGreaterThan(400);
    });
  });

  describe('Malformed input handling', () => {
    it('should throw appropriate errors for null and undefined inputs', () => {
      // Test runtime behavior with type assertion for testing purposes
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        computeLineDiff('' as any, null as any);
      }).toThrow();

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        computeLineDiff(undefined as any, '');
      }).toThrow();
    });

    it('should throw appropriate errors for non-string input', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        computeLineDiff(123 as any, 'string');
      }).toThrow();

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        computeLineDiff('string', {} as any);
      }).toThrow();
    });

    it('should throw appropriate errors for circular references in objects', () => {
      interface CircularObject {
        prop: string;
        self?: CircularObject;
      }

      const circular: CircularObject = { prop: 'value' };
      circular.self = circular;

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        computeLineDiff(circular as any, 'string');
      }).toThrow();
    });
  });

  describe('Memory pressure scenarios', () => {
    it('should handle repeated large computations', () => {
      const largeText1 = Array(1000).fill('large content line').join('\n');
      const largeText2 = Array(1000).fill('different large content').join('\n');

      // Run multiple times to test memory handling
      for (let i = 0; i < 5; i++) {
        const result = computeLineDiff(largeText1, largeText2);
        expect(result.left.length).toBeGreaterThan(0);
        expect(result.right.length).toBeGreaterThan(0);
      }
    });

    it('should handle nested diff computations', () => {
      const text1 = 'outer line 1\nouter line 2';
      const text2 = 'outer line 1\nmodified outer line 2';

      // Simulate nested computation scenario
      const result1 = computeLineDiff(text1, text2);
      const result2 = computeLineDiff(text2, text1);

      expect(result1.left.length).toBe(result2.right.length);
      expect(result1.right.length).toBe(result2.left.length);
    });
  });

  describe('Concurrent access patterns', () => {
    it('should handle multiple simultaneous computations', async () => {
      const texts = Array(10).fill(0).map((_, i) => ({
        old: `text ${i} version A\nline 2\nline 3`,
        new: `text ${i} version B\nline 2\nline 3`
      }));

      const promises = texts.map(({ old, new: newText }) =>
        Promise.resolve(computeLineDiff(old, newText))
      );

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.left.length).toBeGreaterThan(0);
        expect(result.right.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error recovery', () => {
    it('should recover from word diff failures', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const oldText = 'line that might cause word diff issues';
      const newText = 'line that definitely causes word diff problems';

      const result = computeLineDiff(oldText, newText);

      // Should still produce a valid result even if word diff fails
      expect(result.left).toHaveLength(1);
      expect(result.right).toHaveLength(1);

      warnSpy.mockRestore();
    });

    it('should handle line number overflow scenarios', () => {
      // Create a scenario with many lines to test line number handling
      const manyLines = Array(100000).fill('line').join('\n');

      const result = computeLineDiff(manyLines, manyLines + '\nextra');

      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);

      // Check that line numbers are reasonable
      const maxLeftLineNumber = Math.max(...result.left
        .filter(l => !l.spacer)
        .map(l => l.lineNumber));
      const maxRightLineNumber = Math.max(...result.right
        .filter(l => !l.spacer)
        .map(l => l.lineNumber));

      expect(maxLeftLineNumber).toBeGreaterThan(0);
      expect(maxRightLineNumber).toBeGreaterThan(0);
    });
  });
});
