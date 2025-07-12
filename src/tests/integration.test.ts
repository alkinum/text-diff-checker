import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeLineDiff } from '@/utils/diff/index';

// Real integration tests without mocking
describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Real-world code diff scenarios', () => {
    it('should handle JavaScript code changes', () => {
      const oldCode = `function calculateSum(a, b) {
  return a + b;
}

const result = calculateSum(5, 3);
console.log(result);`;

      const newCode = `function calculateSum(a, b) {
  // Add input validation
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both parameters must be numbers');
  }
  return a + b;
}

const result = calculateSum(5, 3);
console.log('Result:', result);`;

      const diff = computeLineDiff(oldCode, newCode);
      
      expect(diff.left.length).toBeGreaterThan(0);
      expect(diff.right.length).toBeGreaterThan(0);
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect added lines
      const addedLines = diff.right.filter(line => line.added);
      expect(addedLines.length).toBeGreaterThan(0);
      
      // Should detect modified lines
      const modifiedLines = diff.left.filter(line => line.modified);
      expect(modifiedLines.length).toBeGreaterThan(0);
    });

    it('should handle CSS changes', () => {
      const oldCSS = `.container {
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.button {
  background-color: blue;
  color: white;
  border: none;
  padding: 10px 20px;
}`;

      const newCSS = `.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}`;

      const diff = computeLineDiff(oldCSS, newCSS);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect changes in existing properties
      const changedLines = diff.left.filter(line => line.modified || line.removed);
      expect(changedLines.length).toBeGreaterThan(0);
      
      // Should detect new properties and rules
      const newLines = diff.right.filter(line => line.added);
      expect(newLines.length).toBeGreaterThan(0);
    });

    it('should handle JSON configuration changes', () => {
      const oldJSON = `{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}`;

      const newJSON = `{
  "name": "my-app",
  "version": "1.1.0",
  "description": "A sample application",
  "scripts": {
    "start": "node server.js",
    "test": "jest",
    "build": "webpack --mode production"
  },
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "webpack": "^5.0.0"
  }
}`;

      const diff = computeLineDiff(oldJSON, newJSON);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect version change
      const versionChanges = diff.left.filter(line => 
        line.value.includes('version') && (line.modified || line.removed)
      );
      expect(versionChanges.length).toBeGreaterThan(0);
      
      // Should detect new dependencies
      const newDeps = diff.right.filter(line => 
        line.added && (line.value.includes('lodash') || line.value.includes('devDependencies'))
      );
      expect(newDeps.length).toBeGreaterThan(0);
    });

    it('should handle HTML markup changes', () => {
      const oldHTML = `<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <h1>Welcome</h1>
    <p>This is a simple website.</p>
</body>
</html>`;

      const newHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome Website</title>
</head>
<body>
    <header>
        <h1>Welcome</h1>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <p>This is a modern website with better structure.</p>
    </main>
</body>
</html>`;

      const diff = computeLineDiff(oldHTML, newHTML);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect structural changes
      const structuralChanges = diff.right.filter(line => 
        line.added && (line.value.includes('<header>') || line.value.includes('<nav>') || line.value.includes('<main>'))
      );
      expect(structuralChanges.length).toBeGreaterThan(0);
    });

    it('should handle Python code refactoring', () => {
      const oldPython = `def calculate_area(radius):
    return 3.14 * radius * radius

def calculate_circumference(radius):
    return 2 * 3.14 * radius

radius = 5
area = calculate_area(radius)
circumference = calculate_circumference(radius)
print(f"Area: {area}, Circumference: {circumference}")`;

      const newPython = `import math

class Circle:
    def __init__(self, radius):
        self.radius = radius
    
    def area(self):
        return math.pi * self.radius ** 2
    
    def circumference(self):
        return 2 * math.pi * self.radius

circle = Circle(5)
print(f"Area: {circle.area()}, Circumference: {circle.circumference()}")`;

      const diff = computeLineDiff(oldPython, newPython);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect class-based refactoring
      const classChanges = diff.right.filter(line => 
        line.added && line.value.includes('class Circle')
      );
      expect(classChanges.length).toBeGreaterThan(0);
    });
  });

  describe('Complex diff scenarios', () => {
    it('should handle large content blocks', () => {
      const oldContent = Array.from({ length: 1000 }, (_, i) => `Line ${i + 1}`).join('\n');
      const newContent = Array.from({ length: 1000 }, (_, i) => 
        i % 100 === 0 ? `Modified Line ${i + 1}` : `Line ${i + 1}`
      ).join('\n');

      const diff = computeLineDiff(oldContent, newContent);
      
      expect(diff.left.length).toBe(diff.right.length);
      expect(diff.left.length).toBeGreaterThanOrEqual(1000);
      
      // Should detect approximately 10 modifications
      const modifiedLines = diff.left.filter(line => line.modified);
      expect(modifiedLines.length).toBeGreaterThan(5);
      expect(modifiedLines.length).toBeLessThan(15);
    });

    it('should handle mixed content types', () => {
      const oldContent = `# Configuration File
name: my-app
version: 1.0.0

# Database settings
database:
  host: localhost
  port: 5432
  name: mydb

# API settings
api:
  endpoint: /api/v1
  timeout: 30`;

      const newContent = `# Configuration File
name: my-app
version: 2.0.0
description: Updated application

# Database settings
database:
  host: db.example.com
  port: 5432
  name: mydb
  ssl: true

# API settings
api:
  endpoint: /api/v2
  timeout: 60
  retries: 3

# New cache settings
cache:
  enabled: true
  ttl: 3600`;

      const diff = computeLineDiff(oldContent, newContent);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect version change
      const versionChanges = diff.left.filter(line => 
        line.value.includes('version') && line.modified
      );
      expect(versionChanges.length).toBeGreaterThan(0);
      
      // Should detect new cache section
      const cacheSection = diff.right.filter(line => 
        line.added && line.value.includes('cache')
      );
      expect(cacheSection.length).toBeGreaterThan(0);
    });

    it('should handle whitespace-only changes', () => {
      const oldContent = `function test() {
return true;
}`;

      const newContent = `function test() {
  return true;
}`;

      const diff = computeLineDiff(oldContent, newContent);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect indentation change
      const indentChanges = diff.left.filter(line => line.modified || line.removed);
      expect(indentChanges.length).toBeGreaterThan(0);
    });

    it('should handle line reordering', () => {
      const oldContent = `Line A
Line B
Line C
Line D`;

      const newContent = `Line A
Line C
Line B
Line D`;

      const diff = computeLineDiff(oldContent, newContent);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect reordering as changes
      const changes = diff.left.filter(line => line.removed || line.modified);
      expect(changes.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and memory tests', () => {
    it('should handle large files efficiently', () => {
      const largeContent1 = Array.from({ length: 5000 }, (_, i) => 
        `Line ${i + 1}: This is a longer line with more content to test performance`
      ).join('\n');
      
      const largeContent2 = Array.from({ length: 5000 }, (_, i) => 
        i % 500 === 0 ? 
          `Modified Line ${i + 1}: This is a CHANGED longer line with more content` :
          `Line ${i + 1}: This is a longer line with more content to test performance`
      ).join('\n');

      const startTime = performance.now();
      const diff = computeLineDiff(largeContent1, largeContent2);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(diff.left.length).toBe(diff.right.length);
    });

    it('should handle memory efficiently with large diffs', () => {
      const oldContent = Array.from({ length: 2000 }, (_, i) => `Original line ${i + 1}`).join('\n');
      const newContent = Array.from({ length: 2000 }, (_, i) => `Modified line ${i + 1}`).join('\n');

      const initialMemory = process.memoryUsage().heapUsed;
      const diff = computeLineDiff(oldContent, newContent);
      const finalMemory = process.memoryUsage().heapUsed;

      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      expect(diff.left.length).toBe(diff.right.length);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty files', () => {
      const diff = computeLineDiff('', '');
      
      expect(diff.left.length).toBe(0);
      expect(diff.right.length).toBe(0);
    });

    it('should handle one empty file', () => {
      const old = '';
      const newContent = 'New content\nSecond line';

      const diff = computeLineDiff(old, newContent);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should show all lines as added
      const addedLines = diff.right.filter(line => line.added);
      expect(addedLines.length).toBe(2);
    });

    it('should handle binary-like content', () => {
      const binaryContent1 = '\x00\x01\x02\x03\x04\x05';
      const binaryContent2 = '\x00\x01\xFF\x03\x04\x05';

      const diff = computeLineDiff(binaryContent1, binaryContent2);
      
      expect(diff.left.length).toBe(diff.right.length);
      expect(diff.left.length).toBeGreaterThan(0);
    });

    it('should handle deeply nested structures', () => {
      const nestedOld = `{
  "level1": {
    "level2": {
      "level3": {
        "value": "old"
      }
    }
  }
}`;

      const nestedNew = `{
  "level1": {
    "level2": {
      "level3": {
        "value": "new",
        "additional": "data"
      }
    }
  }
}`;

      const diff = computeLineDiff(nestedOld, nestedNew);
      
      expect(diff.left.length).toBe(diff.right.length);
      
      // Should detect nested changes
      const changes = diff.right.filter(line => line.added || line.modified);
      expect(changes.length).toBeGreaterThan(0);
    });

    it('should handle concurrent diff operations', () => {
      const content1 = 'Content A\nLine 2\nLine 3';
      const content2 = 'Content B\nLine 2\nLine 3';

      // Run multiple diffs concurrently
      const diff1 = computeLineDiff(content1, content2);
      const diff2 = computeLineDiff(content1, content2);
      const diff3 = computeLineDiff(content1, content2);

      // All should produce identical results
      expect(diff1.left.length).toBe(diff2.left.length);
      expect(diff2.left.length).toBe(diff3.left.length);
      
      // Results should be consistent
      expect(diff1.left[0].value).toBe(diff2.left[0].value);
      expect(diff2.left[0].value).toBe(diff3.left[0].value);
    });
  });
}); 