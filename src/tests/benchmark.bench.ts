import { describe, it, bench, expect } from 'vitest';
import { computeLineDiff } from '../utils/diff/index';

// Test data generators
const generateRepeatedText = (lines: number, lineLength: number = 50): string => {
  const baseLine = 'A'.repeat(lineLength);
  return Array.from({ length: lines }, (_, i) => `${baseLine}_${i}`).join('\n');
};

const generateRandomText = (lines: number, lineLength: number = 50): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?;:';
  return Array.from({ length: lines }, () => {
    return Array.from({ length: lineLength }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }).join('\n');
};

const generateCodeLikeText = (lines: number): string => {
  const codePatterns = [
    'function processData(input) {',
    '  const result = [];',
    '  for (let i = 0; i < input.length; i++) {',
    '    result.push(input[i] * 2);',
    '  }',
    '  return result;',
    '}',
    '',
    'class DataProcessor {',
    '  constructor(options) {',
    '    this.options = options;',
    '  }',
    '',
    '  process(data) {',
    '    return data.map(item => item.value);',
    '  }',
    '}',
  ];
  
  const result = [];
  for (let i = 0; i < lines; i++) {
    result.push(codePatterns[i % codePatterns.length]);
  }
  return result.join('\n');
};

// Modify text to create realistic diff scenarios
const addRandomChanges = (text: string, changeRatio: number = 0.1): string => {
  const lines = text.split('\n');
  const changesToMake = Math.floor(lines.length * changeRatio);
  
  for (let i = 0; i < changesToMake; i++) {
    const randomIndex = Math.floor(Math.random() * lines.length);
    const line = lines[randomIndex];
    
    // Random modification types
    const modificationType = Math.random();
    if (modificationType < 0.3) {
      // Add prefix
      lines[randomIndex] = `// Modified: ${line}`;
    } else if (modificationType < 0.6) {
      // Change some characters
      const chars = line.split('');
      const changeCount = Math.min(5, Math.floor(chars.length * 0.2));
      for (let j = 0; j < changeCount; j++) {
        const charIndex = Math.floor(Math.random() * chars.length);
        chars[charIndex] = chars[charIndex] === 'a' ? 'b' : 'a';
      }
      lines[randomIndex] = chars.join('');
    } else {
      // Add suffix
      lines[randomIndex] = `${line} // Added comment`;
    }
  }
  
  return lines.join('\n');
};

const insertRandomLines = (text: string, insertRatio: number = 0.05): string => {
  const lines = text.split('\n');
  const insertCount = Math.floor(lines.length * insertRatio);
  
  for (let i = 0; i < insertCount; i++) {
    const randomIndex = Math.floor(Math.random() * lines.length);
    lines.splice(randomIndex, 0, `// New line inserted at position ${randomIndex}`);
  }
  
  return lines.join('\n');
};

const deleteRandomLines = (text: string, deleteRatio: number = 0.05): string => {
  const lines = text.split('\n');
  const deleteCount = Math.floor(lines.length * deleteRatio);
  
  for (let i = 0; i < deleteCount; i++) {
    const randomIndex = Math.floor(Math.random() * lines.length);
    if (lines.length > 1) {
      lines.splice(randomIndex, 1);
    }
  }
  
  return lines.join('\n');
};

describe('Diff Algorithm Benchmarks', () => {
  
  describe('Small Text Performance', () => {
    const smallOriginal = generateCodeLikeText(50);
    const smallModified = addRandomChanges(smallOriginal, 0.2);
    
    bench('Small text diff (50 lines)', () => {
      computeLineDiff(smallOriginal, smallModified);
    });
    
    it('should handle small text correctly', () => {
      const result = computeLineDiff(smallOriginal, smallModified);
      expect(result).toHaveProperty('left');
      expect(result).toHaveProperty('right');
      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);
    });
  });

  describe('Medium Text Performance', () => {
    const mediumOriginal = generateCodeLikeText(500);
    const mediumModified = addRandomChanges(mediumOriginal, 0.15);
    
    bench('Medium text diff (500 lines)', () => {
      computeLineDiff(mediumOriginal, mediumModified);
    });
    
    it('should handle medium text correctly', () => {
      const result = computeLineDiff(mediumOriginal, mediumModified);
      expect(result).toHaveProperty('left');
      expect(result).toHaveProperty('right');
    });
  });

  describe('Large Text Performance', () => {
    const largeOriginal = generateCodeLikeText(2000);
    const largeModified = addRandomChanges(largeOriginal, 0.1);
    
    bench('Large text diff (2000 lines)', () => {
      computeLineDiff(largeOriginal, largeModified);
    });
    
    it('should handle large text correctly', () => {
      const result = computeLineDiff(largeOriginal, largeModified);
      expect(result).toHaveProperty('left');
      expect(result).toHaveProperty('right');
    });
  });

  describe('Very Large Text Performance', () => {
    const veryLargeOriginal = generateCodeLikeText(5000);
    const veryLargeModified = addRandomChanges(veryLargeOriginal, 0.05);
    
    bench('Very large text diff (5000 lines)', () => {
      computeLineDiff(veryLargeOriginal, veryLargeModified);
    });
    
    it('should handle very large text correctly', () => {
      const result = computeLineDiff(veryLargeOriginal, veryLargeModified);
      expect(result).toHaveProperty('left');
      expect(result).toHaveProperty('right');
    });
  });

  describe('Different Change Patterns', () => {
    const baseText = generateCodeLikeText(1000);
    
    bench('Heavy modifications (30% changes)', () => {
      const modified = addRandomChanges(baseText, 0.3);
      computeLineDiff(baseText, modified);
    });
    
    bench('Light modifications (5% changes)', () => {
      const modified = addRandomChanges(baseText, 0.05);
      computeLineDiff(baseText, modified);
    });
    
    bench('Line insertions (10% new lines)', () => {
      const modified = insertRandomLines(baseText, 0.1);
      computeLineDiff(baseText, modified);
    });
    
    bench('Line deletions (10% removed lines)', () => {
      const modified = deleteRandomLines(baseText, 0.1);
      computeLineDiff(baseText, modified);
    });
    
    bench('Mixed changes (modify + insert + delete)', () => {
      let modified = addRandomChanges(baseText, 0.1);
      modified = insertRandomLines(modified, 0.05);
      modified = deleteRandomLines(modified, 0.05);
      computeLineDiff(baseText, modified);
    });
  });

  describe('Edge Cases Performance', () => {
    bench('Identical texts', () => {
      const text = generateCodeLikeText(1000);
      computeLineDiff(text, text);
    });
    
    bench('Completely different texts', () => {
      const text1 = generateCodeLikeText(500);
      const text2 = generateRandomText(500);
      computeLineDiff(text1, text2);
    });
    
    bench('Empty to text', () => {
      const text = generateCodeLikeText(100);
      computeLineDiff('', text);
    });
    
    bench('Text to empty', () => {
      const text = generateCodeLikeText(100);
      computeLineDiff(text, '');
    });
    
    bench('Single character changes', () => {
      const text1 = generateRepeatedText(500, 100);
      const text2 = text1.replace(/A/g, 'B');
      computeLineDiff(text1, text2);
    });
  });

  describe('Real-world Scenarios', () => {
    const codeBase = `import React from 'react';
import { useState, useEffect } from 'react';

const MyComponent = () => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleClick = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <h1>My Component</h1>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Click me</button>
      <ul>
        {data.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default MyComponent;`;

    const codeModified = `import React from 'react';
import { useState, useEffect, useCallback } from 'react';

const MyComponent = () => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClick = () => {
    setCount(prevCount => prevCount + 1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>My Component</h1>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
      <ul>
        {data.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default MyComponent;`;

    bench('Code refactoring diff', () => {
      computeLineDiff(codeBase, codeModified);
    });
  });

  describe('Memory and Performance Stress Tests', () => {
    bench('Extremely large text (10000 lines)', () => {
      const hugeOriginal = generateCodeLikeText(10000);
      const hugeModified = addRandomChanges(hugeOriginal, 0.02);
      computeLineDiff(hugeOriginal, hugeModified);
    });
    
    bench('Long lines (500 chars per line)', () => {
      const longLinesOriginal = generateRepeatedText(200, 500);
      const longLinesModified = addRandomChanges(longLinesOriginal, 0.1);
      computeLineDiff(longLinesOriginal, longLinesModified);
    });
    
    bench('Many small changes', () => {
      const original = generateCodeLikeText(1000);
      const modified = addRandomChanges(original, 0.5);
      computeLineDiff(original, modified);
    });
  });

  describe('Algorithm Correctness Tests', () => {
    it('should preserve line count relationships', () => {
      const original = generateCodeLikeText(100);
      const modified = addRandomChanges(original, 0.2);
      
      const result = computeLineDiff(original, modified);
      
      // Both sides should have the same number of entries (including spacers)
      expect(result.left.length).toBe(result.right.length);
      
      // Should have at least some content
      expect(result.left.length).toBeGreaterThan(0);
      expect(result.right.length).toBeGreaterThan(0);
    });

    it('should handle empty strings correctly', () => {
      const result = computeLineDiff('', '');
      expect(result.left).toEqual([]);
      expect(result.right).toEqual([]);
    });

    it('should handle single line correctly', () => {
      const result = computeLineDiff('hello', 'world');
      expect(result.left.length).toBe(1);
      expect(result.right.length).toBe(1);
    });

    it('should maintain consistent line numbering', () => {
      const original = generateCodeLikeText(50);
      const modified = addRandomChanges(original, 0.1);
      
      const result = computeLineDiff(original, modified);
      
      // Check that non-spacer lines have valid line numbers
      const leftNonSpacers = result.left.filter(line => !line.spacer);
      const rightNonSpacers = result.right.filter(line => !line.spacer);
      
      expect(leftNonSpacers.every(line => line.lineNumber > 0)).toBe(true);
      expect(rightNonSpacers.every(line => line.lineNumber > 0)).toBe(true);
    });
  });
});