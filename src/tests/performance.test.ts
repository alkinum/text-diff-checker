import { computeLineDiff } from '@/utils/diff/index';
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(async () => {
  // Setup for performance tests
});

describe('Performance Benchmarks', () => {
  describe('Small file performance', () => {
    it('should handle small files (< 1KB) quickly', () => {
      const smallText1 = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
      const smallText2 = Array.from({ length: 20 }, (_, i) => 
        i % 5 === 0 ? `Modified Line ${i + 1}` : `Line ${i + 1}`
      ).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(smallText1, smallText2);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(diff.left.length).toBe(diff.right.length);
      expect(diff.left.length).toBeGreaterThan(0);
    });

    it('should handle identical small files instantly', () => {
      const text = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(text, text);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast for identical content
      expect(diff.left.length).toBe(diff.right.length);
      expect(diff.left.length).toBe(50);
    });
  });

  describe('Medium file performance', () => {
    it('should handle medium files (1-10KB) efficiently', () => {
      const mediumText1 = Array.from({ length: 200 }, (_, i) => 
        `Line ${i + 1}: This is some content for line ${i + 1} with additional text to make it longer`
      ).join('\n');

      const mediumText2 = Array.from({ length: 200 }, (_, i) => 
        i % 10 === 0 ? 
          `Modified Line ${i + 1}: This is CHANGED content for line ${i + 1} with additional text` :
          `Line ${i + 1}: This is some content for line ${i + 1} with additional text to make it longer`
      ).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(mediumText1, mediumText2);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should complete within 500ms
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect approximately 20 changes
      const modifiedLines = diff.left.filter(line => line.modified);
      expect(modifiedLines.length).toBeGreaterThan(15);
      expect(modifiedLines.length).toBeLessThan(25);
    });

    it('should handle medium files with many additions', () => {
      const originalText = Array.from({ length: 100 }, (_, i) => `Original line ${i + 1}`).join('\n');
      const expandedText = Array.from({ length: 200 }, (_, i) => 
        i < 100 ? `Original line ${i + 1}` : `Added line ${i + 1}`
      ).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(originalText, expandedText);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect many additions
      const addedLines = diff.right.filter(line => line.added);
      expect(addedLines.length).toBeGreaterThan(90);
    });
  });

  describe('Large file performance', () => {
    it('should handle large files (10-100KB) reasonably', () => {
      const largeText1 = Array.from({ length: 1000 }, (_, i) => 
        `Line ${i + 1}: This is a longer line with more content to simulate a real file with substantial content per line`
      ).join('\n');
      
      const largeText2 = Array.from({ length: 1000 }, (_, i) => 
        i % 50 === 0 ? 
          `Modified Line ${i + 1}: This is a CHANGED longer line with more content to simulate a real file` :
          `Line ${i + 1}: This is a longer line with more content to simulate a real file with substantial content per line`
      ).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(largeText1, largeText2);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
      expect(diff.left.length).toBe(diff.right.length);
      expect(diff.left.length).toBeGreaterThanOrEqual(1000);
    });

    it('should handle large files with minimal changes efficiently', () => {
      const baseText = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}`).join('\n');
      const modifiedText = baseText.replace('Line 500', 'Modified Line 500');

      const startTime = performance.now();
      const diff = computeLineDiff(baseText, modifiedText);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should be faster with minimal changes
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect exactly one change
      const modifiedLines = diff.left.filter(line => line.modified);
      expect(modifiedLines.length).toBe(1);
    });
  });

  describe('Very large file performance', () => {
    it('should handle very large files (100KB+) with chunked processing', () => {
      const veryLargeText1 = Array.from({ length: 2000 }, (_, i) => 
        `Line ${i + 1}: This is a very long line with lots of content to make the file size substantial enough for chunked processing tests`
      ).join('\n');
      
      const veryLargeText2 = Array.from({ length: 2000 }, (_, i) => 
        i % 100 === 0 ? 
          `Modified Line ${i + 1}: This is a CHANGED very long line with lots of content for chunked processing` :
          `Line ${i + 1}: This is a very long line with lots of content to make the file size substantial enough for chunked processing tests`
      ).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(veryLargeText1, veryLargeText2);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(diff.left.length).toBe(diff.right.length);
      expect(diff.left.length).toBeGreaterThanOrEqual(2000);
    });

    it('should handle extremely long single lines', () => {
      const longLine1 = 'a'.repeat(50000);
      const longLine2 = 'a'.repeat(25000) + 'b'.repeat(25000);
      
      const text1 = `Short line\n${longLine1}\nAnother short line`;
      const text2 = `Short line\n${longLine2}\nAnother short line`;

      const startTime = performance.now();
      const diff = computeLineDiff(text1, text2);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should handle long lines within 5 seconds
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect the long line change
      const longLines = diff.left.filter(line => line.value.length > 40000);
      expect(longLines.length).toBeGreaterThan(0);
    });
  });

  describe('Memory efficiency tests', () => {
    it('should not consume excessive memory for large diffs', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const largeText1 = Array.from({ length: 1000 }, (_, i) => 
        `Line ${i + 1}: Content with some variation ${i % 10}`
      ).join('\n');
      
      const largeText2 = Array.from({ length: 1000 }, (_, i) => 
        `Line ${i + 1}: Modified content with some variation ${i % 10}`
      ).join('\n');

      const diff = computeLineDiff(largeText1, largeText2);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      expect(diff.left.length).toBe(diff.right.length);
    });

    it('should handle multiple concurrent diffs efficiently', () => {
      const texts = Array.from({ length: 5 }, (_, i) => ({
        old: Array.from({ length: 100 }, (_, j) => `File ${i} Line ${j + 1}`).join('\n'),
        new: Array.from({ length: 100 }, (_, j) => `File ${i} Modified Line ${j + 1}`).join('\n')
      }));

      const startTime = performance.now();
      const diffs = texts.map(({ old, new: newText }) => computeLineDiff(old, newText));
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000); // Should handle concurrent processing
      expect(diffs).toHaveLength(5);
      
      diffs.forEach(diff => {
        expect(diff.left.length).toBe(diff.right.length);
        expect(diff.left.length).toBeGreaterThanOrEqual(100);
      });
    });
  });

  describe('Specific algorithm performance', () => {
    it('should handle worst-case scenario efficiently', () => {
      // Worst case: every line is different
      const text1 = Array.from({ length: 500 }, (_, i) => `A${i}`).join('\n');
      const text2 = Array.from({ length: 500 }, (_, i) => `B${i}`).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(text1, text2);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should handle worst case within 5 seconds
      expect(diff.left.length).toBe(diff.right.length);
      expect(diff.left.length).toBeGreaterThanOrEqual(500);
    });

    it('should handle best-case scenario (identical files) instantly', () => {
      const largeText = Array.from({ length: 1000 }, (_, i) => 
        `Line ${i + 1}: This is identical content`
      ).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(largeText, largeText);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be very fast for identical content
      expect(diff.left.length).toBe(diff.right.length);
      expect(diff.left.length).toBe(1000);
    });
  });

  describe('Edge case performance', () => {
    it('should handle empty files quickly', () => {
      const startTime = performance.now();
      const diff = computeLineDiff('', '');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should be instant
      expect(diff.left.length).toBe(0);
      expect(diff.right.length).toBe(0);
    });

    it('should handle single character changes in large files', () => {
      const baseText = 'a'.repeat(100000);
      const modifiedText = 'a'.repeat(50000) + 'b' + 'a'.repeat(49999);

      const startTime = performance.now();
      const diff = computeLineDiff(baseText, modifiedText);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should handle single char change
      expect(diff.left.length).toBe(diff.right.length);
    });
  });

  describe('Performance regression tests', () => {
    it('should maintain consistent performance across runs', () => {
      const text1 = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n');
      const text2 = Array.from({ length: 100 }, (_, i) => 
        i % 10 === 0 ? `Modified Line ${i + 1}` : `Line ${i + 1}`
      ).join('\n');

      const times: number[] = [];
      
      // Run multiple times to check consistency
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        computeLineDiff(text1, text2);
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      // Check that performance is consistent (no extreme outliers)
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      expect(maxTime - minTime).toBeLessThan(avgTime * 2); // Variance should be reasonable
      expect(avgTime).toBeLessThan(1000); // Average should be under 1 second
    });
  });
}); 