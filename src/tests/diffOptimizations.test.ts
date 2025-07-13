import { describe, it, expect, beforeEach, vi } from 'vitest';
import { computeLineDiff } from '@/utils/diff/index';

describe('Diff Optimizations', () => {
  beforeEach(() => {
    // Clear any console spies before each test
    vi.clearAllMocks();
  });

  describe('Caching behavior', () => {
    it('should handle repeated identical computations efficiently', () => {
      const text1 = 'line 1\nline 2\nline 3';
      const text2 = 'line 1\nmodified line 2\nline 3';

      const startTime1 = Date.now();
      const result1 = computeLineDiff(text1, text2);
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      const result2 = computeLineDiff(text1, text2);
      const endTime2 = Date.now();

      // Results should be identical
      expect(result1.left.length).toBe(result2.left.length);
      expect(result1.right.length).toBe(result2.right.length);

      // Both should complete in reasonable time
      expect(endTime1 - startTime1).toBeLessThan(1000);
      expect(endTime2 - startTime2).toBeLessThan(1000);
    });

    it('should handle cache collisions gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create different texts that might cause hash collisions
      const text1a = 'a'.repeat(1000);
      const text1b = 'b'.repeat(1000);
      const text2a = 'c'.repeat(1000);
      const text2b = 'd'.repeat(1000);

      const result1 = computeLineDiff(text1a, text1b);
      const result2 = computeLineDiff(text2a, text2b);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.left.length).toBeGreaterThan(0);
      expect(result2.left.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });
  });

  describe('Chunked processing', () => {
    it('should trigger chunked processing for large texts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create text larger than chunked processing threshold
      const largeContent = 'x'.repeat(100000); // 100KB
      const largeText1 = Array(6).fill(largeContent).join('\n'); // ~600KB
      const largeText2 = largeText1 + '\nextra line';

      const result = computeLineDiff(largeText1, largeText2);

      // Should log chunked processing warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Text extremely large')
      );

      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    it('should handle chunked processing with common prefix/suffix optimization', () => {
      const commonPrefix = 'common start\n'.repeat(100);
      const commonSuffix = '\ncommon end'.repeat(100);
      const middle1 = 'different middle 1\n'.repeat(50);
      const middle2 = 'different middle 2\n'.repeat(50);

      const text1 = commonPrefix + middle1 + commonSuffix;
      const text2 = commonPrefix + middle2 + commonSuffix;

      const result = computeLineDiff(text1, text2);

      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);

      // Should preserve common parts
      const leftValues = result.left.map(l => l.value);
      const rightValues = result.right.map(r => r.value);

      expect(leftValues.some(v => v.includes('common start'))).toBe(true);
      expect(rightValues.some(v => v.includes('common start'))).toBe(true);
    });
  });

  describe('Memory optimization', () => {
    it('should handle batch processing for large diffs', () => {
      // Create a diff with many changes
      const oldLines = Array(2000).fill(0).map((_, i) => `old line ${i}`);
      const newLines = Array(2000).fill(0).map((_, i) => `new line ${i}`);

      const oldText = oldLines.join('\n');
      const newText = newLines.join('\n');

      const startTime = Date.now();
      const result = computeLineDiff(oldText, newText);
      const endTime = Date.now();

      // Should complete in reasonable time despite large size
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);
    });

    it('should handle memory-efficient line processing', () => {
      // Test with alternating pattern to create many small changes
      const lines1 = Array(1000).fill(0).map((_, i) =>
        i % 2 === 0 ? `unchanged line ${i}` : `old line ${i}`
      );
      const lines2 = Array(1000).fill(0).map((_, i) =>
        i % 2 === 0 ? `unchanged line ${i}` : `new line ${i}`
      );

      const text1 = lines1.join('\n');
      const text2 = lines2.join('\n');

      const result = computeLineDiff(text1, text2);

      expect(result.left.length).toBe(result.right.length);
      expect(result.left.length).toBeGreaterThan(500); // Should have many lines
    });
  });

  describe('Performance edge cases', () => {
    it('should handle identical large texts efficiently', () => {
      const largeText = Array(5000).fill('identical line').join('\n');

      const startTime = Date.now();
      const result = computeLineDiff(largeText, largeText);
      const endTime = Date.now();

      // Should be very fast for identical texts
      expect(endTime - startTime).toBeLessThan(100); // Should be nearly instant
      expect(result.left.length).toBe(result.right.length);
      expect(result.left.every(line => !line.added && !line.removed)).toBe(true);
    });

    it('should handle worst-case diff scenarios', () => {
      // Create worst-case scenario: every line is different
      const text1 = Array(500).fill(0).map((_, i) => `line ${i} version A`).join('\n');
      const text2 = Array(500).fill(0).map((_, i) => `line ${i} version B`).join('\n');

      const startTime = Date.now();
      const result = computeLineDiff(text1, text2);
      const endTime = Date.now();

      // Should still complete in reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max
      expect(result.left.length).toBe(result.right.length);
    });

    it('should handle very long single lines', () => {
      const longLine1 = 'a'.repeat(50000) + 'different' + 'b'.repeat(50000);
      const longLine2 = 'a'.repeat(50000) + 'changed' + 'b'.repeat(50000);

      const startTime = Date.now();
      const result = computeLineDiff(longLine1, longLine2);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(2000); // 2 seconds max
      expect(result.left.length).toBe(1);
      expect(result.right.length).toBe(1);
      expect(result.left[0].inlineChanges).toBeDefined();
      expect(result.right[0].inlineChanges).toBeDefined();
    });

    it('should handle empty vs large text efficiently', () => {
      const largeText = Array(1000).fill('content line').join('\n');

      const startTime = Date.now();
      const result = computeLineDiff('', largeText);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1 second max
      expect(result.left.every(line => line.spacer)).toBe(true);
      expect(result.right.every(line => line.added)).toBe(true);
    });
  });

  describe('Error handling and fallbacks', () => {
    it('should fallback gracefully on processing errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create potentially problematic input
      const problematicText = '\x00\x01\x02\x03' + 'normal text' + '\xFF\xFE';

      const result = computeLineDiff(problematicText, 'normal text');

      // Should still return a valid result
      expect(result).toBeDefined();
      expect(result.left).toBeDefined();
      expect(result.right).toBeDefined();

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('should handle excessive removed lines detection', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create scenario that might trigger excessive removed lines warning
      const oldText = Array(1000).fill('line to remove').join('\n');
      const newText = 'single new line';

      const result = computeLineDiff(oldText, newText);

      expect(result).toBeDefined();
      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);

      warnSpy.mockRestore();
    });
  });
});
