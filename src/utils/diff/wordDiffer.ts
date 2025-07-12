import { diffChars, diffWords } from 'diff';
import { xxHash32 } from 'js-xxhash';
import { LRUCache } from '../lruCache';
import { DiffResultWithLineNumbers } from './types';

// Optimized similarity calculation with early exit and length pre-check
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // Return low similarity when length difference is too large
  const lengthDiff = Math.abs(str1.length - str2.length);
  const maxLength = Math.max(str1.length, str2.length);
  if (lengthDiff / maxLength > 0.5) return 0;

  // Use sampling comparison for long strings
  if (str1.length > 100 || str2.length > 100) {
    return calculateSamplingSimilarity(str1, str2);
  }

  // Use optimized Levenshtein distance with early exit
  return calculateOptimizedLevenshtein(str1, str2);
}

// Sampling similarity calculation for long strings
function calculateSamplingSimilarity(str1: string, str2: string): number {
  const sampleSize = Math.min(50, str1.length, str2.length);
  const sample1 = str1.substring(0, sampleSize);
  const sample2 = str2.substring(0, sampleSize);

  let matches = 0;
  for (let i = 0; i < sampleSize; i++) {
    if (sample1[i] === sample2[i]) matches++;
  }

  return matches / sampleSize;
}

// Optimized Levenshtein distance calculation using rolling arrays to reduce memory usage
function calculateOptimizedLevenshtein(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Use two one-dimensional arrays instead of a two-dimensional matrix
  let prevRow = new Array(len2 + 1);
  let currRow = new Array(len2 + 1);

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;

    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        currRow[j] = prevRow[j - 1];
      } else {
        currRow[j] = Math.min(
          prevRow[j - 1] + 1, // replacement
          prevRow[j] + 1,     // deletion
          currRow[j - 1] + 1  // insertion
        );
      }
    }

    // Swap array references
    [prevRow, currRow] = [currRow, prevRow];
  }

  const distance = prevRow[len2];
  return 1 - distance / Math.max(len1, len2);
}

// Define diff part interface
interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

// Define diff result type
type DiffResult = DiffPart[];

// Use safer cache system
const diffCache = new LRUCache<string, DiffResult>(200); // Reduce cache size to avoid excessive memory usage
const MAX_CACHEABLE_LENGTH = 500; // Only cache shorter texts to avoid hash collision issues with long texts
const cacheStats = { hits: 0, misses: 0, collisions: 0 };

// Unified hash function using xxHash32
function computeHash(str: string, seed: number = 0): number {
  return xxHash32(str, seed);
}

// Extract text features for generating safer cache keys
function extractTextFeatures(text: string): {
  length: number;
  prefix: string;
  suffix: string;
  hash: number;
  middleHash?: number;
} {
  const length = text.length;
  const prefixLen = Math.min(20, length);
  const suffixLen = Math.min(20, length);

  const prefix = text.substring(0, prefixLen);
  const suffix = length > suffixLen ? text.substring(length - suffixLen) : '';

  // Primary hash
  const hash = computeHash(text);

  // If text is long, calculate middle part hash to increase uniqueness
  let middleHash: number | undefined;
  if (length > 100) {
    const middleStart = Math.floor(length * 0.4);
    const middleEnd = Math.floor(length * 0.6);
    const middleText = text.substring(middleStart, middleEnd);
    middleHash = computeHash(middleText, 12345); // Use different seed
  }

  return { length, prefix, suffix, hash, middleHash };
}

// Refactored cache key generation function using multiple features to ensure uniqueness
function generateSecureCacheKey(leftText: string, rightText: string, diffType: string): string {
  const totalLength = leftText.length + rightText.length;

  // For very short texts, use complete text as cache key
  if (totalLength <= 100) {
    return `${leftText}|||${rightText}|||${diffType}`;
  }

  // Don't cache texts that exceed cache length limit
  if (totalLength > MAX_CACHEABLE_LENGTH) {
    return ''; // Empty string means no caching
  }

  // Extract features from both texts
  const leftFeatures = extractTextFeatures(leftText);
  const rightFeatures = extractTextFeatures(rightText);

  // Build multi-feature cache key
  const keyParts = [
    diffType,
    leftFeatures.length.toString(),
    rightFeatures.length.toString(),
    leftFeatures.hash.toString(),
    rightFeatures.hash.toString(),
    leftFeatures.prefix,
    rightFeatures.prefix,
    leftFeatures.suffix,
    rightFeatures.suffix
  ];

  // If middle hash exists, add it to cache key
  if (leftFeatures.middleHash !== undefined) {
    keyParts.push(leftFeatures.middleHash.toString());
  }
  if (rightFeatures.middleHash !== undefined) {
    keyParts.push(rightFeatures.middleHash.toString());
  }

  return keyParts.join('::');
}

// Refactored cached diff calculation function
function cachedDiff(leftText: string, rightText: string, diffFn: typeof diffWords | typeof diffChars): DiffResult {
  // Early exit for identical texts
  if (leftText === rightText) {
    return leftText ? [{ value: leftText }] : [];
  }

  const cacheKey = generateSecureCacheKey(leftText, rightText, diffFn.name);

  // Empty cache key means no caching
  if (!cacheKey) {
    cacheStats.misses++;
    return diffFn(leftText, rightText);
  }

  // Check cache
  if (diffCache.has(cacheKey)) {
    cacheStats.hits++;
    const cachedResult = diffCache.get(cacheKey)!;

    // Validate cache result reasonableness to prevent hash collisions
    if (validateCachedResult(cachedResult, leftText, rightText)) {
      // Clone cached result to prevent reference sharing
      return cachedResult.map(part => ({ ...part }));
    } else {
      cacheStats.collisions++;
      console.warn('Cache collision detected, clearing cache and recalculating');
      diffCache.clear(); // Clear entire cache to avoid more collisions
    }
  }

  cacheStats.misses++;

  // Calculate difference
  const result = diffFn(leftText, rightText);

  // Only cache reasonably sized results
  if (result.length < 100) {
    // Store the original result in the cache, but return a clone
    diffCache.set(cacheKey, result);
  }

  // Always return a clone to the caller to prevent cache pollution
  return result.map(part => ({ ...part }));
}

// Validate cache result reasonableness
function validateCachedResult(result: DiffResult, leftText: string, rightText: string): boolean {
  // Basic length check
  const resultLength = result.reduce((sum, part) => sum + part.value.length, 0);
  const expectedLength = Math.max(leftText.length, rightText.length);

  // If result length differs too much from expected, might be hash collision
  if (Math.abs(resultLength - expectedLength) > expectedLength * 0.1) {
    return false;
  }

  // Check if expected text fragments are included
  const leftChars = leftText.substring(0, Math.min(10, leftText.length));
  const rightChars = rightText.substring(0, Math.min(10, rightText.length));

  const resultText = result.map(part => part.value).join('');
  if (leftChars && !resultText.includes(leftChars) && rightChars && !resultText.includes(rightChars)) {
    return false;
  }

  return true;
}

// Text chunking function
function chunkText(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Chunked diff processing - synchronous version
function computeChunkedDiffSync(leftText: string, rightText: string, type: 'words' | 'chars'): DiffResult {
  const CHUNK_SIZE = 10000; // 10KB chunk size

  // If text is not very long, process directly (no caching)
  if (leftText.length + rightText.length <= CHUNK_SIZE * 2) {
    return type === 'words' ? diffWords(leftText, rightText) : diffChars(leftText, rightText);
  }

  // Try to find common prefix and suffix to reduce content that needs processing
  const { prefix, suffix, leftMiddle, rightMiddle } = extractCommonParts(leftText, rightText);

  const middleResult: DiffResult = [];
  if (leftMiddle || rightMiddle) {
    // Process middle part in chunks
    const leftChunks = chunkText(leftMiddle, CHUNK_SIZE);
    const rightChunks = chunkText(rightMiddle, CHUNK_SIZE);

    // Simplified processing: if chunk count difference is too large, use simple diff
    if (Math.abs(leftChunks.length - rightChunks.length) > 2) {
      if (leftMiddle) middleResult.push({ value: leftMiddle, removed: true });
      if (rightMiddle) middleResult.push({ value: rightMiddle, added: true });
    } else {
      // Process chunk by chunk (no caching)
      const maxChunks = Math.max(leftChunks.length, rightChunks.length);
      for (let i = 0; i < maxChunks; i++) {
        const leftChunk = leftChunks[i] || '';
        const rightChunk = rightChunks[i] || '';

        // Fast path: identical chunks
        if (leftChunk === rightChunk) {
          if (leftChunk) middleResult.push({ value: leftChunk });
          continue;
        }

        // Perform line-by-line diff inside this chunk to avoid repeating changes
        const leftLinesInChunk = leftChunk.split('\n');
        const rightLinesInChunk = rightChunk.split('\n');
        const maxLinesInChunk = Math.max(leftLinesInChunk.length, rightLinesInChunk.length);

        for (let j = 0; j < maxLinesInChunk; j++) {
          const leftLine = leftLinesInChunk[j] ?? '';
          const rightLine = rightLinesInChunk[j] ?? '';

          // Preserve trailing newline except for the very last physical line in the whole text
          const isLastPhysicalLine = i === maxChunks - 1 && j === maxLinesInChunk - 1;
          const lineEnding = isLastPhysicalLine ? '' : '\n';

          if (leftLine === rightLine) {
            middleResult.push({ value: leftLine + lineEnding });
          } else {
            const originalLineDiff = type === 'words' ? diffWords(leftLine, rightLine) : diffChars(leftLine, rightLine);

            // Clone diff parts to prevent shared reference side-effects
            const lineDiff = originalLineDiff.map(part => ({ ...part }));

            // Ensure newline character is appended to the last diff part so line structure is preserved
            if (lineDiff.length > 0) {
              lineDiff[lineDiff.length - 1].value += lineEnding;
            } else {
              // Extremely rare: diff library returns empty array – just add newline
              lineDiff.push({ value: lineEnding, added: false, removed: false });
            }

            middleResult.push(...lineDiff);
          }
        }
      }
    }
  }

  // Combine results
  const result: DiffResult = [];
  if (prefix) result.push({ value: prefix });
  result.push(...middleResult);
  if (suffix) result.push({ value: suffix });

  return result;
}

// Compute diff synchronously, optimized for performance
function computeDiff(leftText: string, rightText: string, type: 'words' | 'chars'): DiffResult {
  // Early return for identical texts
  if (leftText === rightText) {
    return leftText ? [{ value: leftText }] : [];
  }

  const totalLength = leftText.length + rightText.length;

  // Use chunked processing for very long texts
  if (totalLength > 50000) { // Increase threshold, use chunked processing
    console.warn(`Text very long (${totalLength} chars), using chunked diff for ${type}`);
    return computeChunkedDiffSync(leftText, rightText, type);
  }

  // For all other texts, use cached diff directly
  return cachedDiff(leftText, rightText, type === 'words' ? diffWords : diffChars);
}

// Extract common prefix and suffix from text
function extractCommonParts(str1: string, str2: string): {
  prefix: string;
  suffix: string;
  leftMiddle: string;
  rightMiddle: string;
} {
  let prefixEnd = 0;
  const minLength = Math.min(str1.length, str2.length);

  // Find common prefix
  while (prefixEnd < minLength && str1[prefixEnd] === str2[prefixEnd]) {
    prefixEnd++;
  }

  // Find common suffix
  let suffixStart1 = str1.length;
  let suffixStart2 = str2.length;

  while (suffixStart1 > prefixEnd && suffixStart2 > prefixEnd &&
         str1[suffixStart1 - 1] === str2[suffixStart2 - 1]) {
    suffixStart1--;
    suffixStart2--;
  }

  return {
    prefix: str1.substring(0, prefixEnd),
    suffix: str1.substring(suffixStart1),
    leftMiddle: str1.substring(prefixEnd, suffixStart1),
    rightMiddle: str2.substring(prefixEnd, suffixStart2)
  };
}

// Check if character-level diff should be performed - optimized version with more conservative strategy
function shouldUseCharLevelDiff(leftText: string, rightText: string, wordDiffs: DiffResult): boolean {
  // Skip character-level comparison for text that's too long
  if (leftText.length + rightText.length > 200) {
    return false;
  }

  const leftWords = leftText.trim().split(/\s+/);
  const rightWords = rightText.trim().split(/\s+/);

  // Only consider character-level comparison if both sides have one word and word length is not too long
  if (leftWords.length === 1 && rightWords.length === 1) {
    const leftWord = leftWords[0];
    const rightWord = rightWords[0];

    if (leftWord.length <= 50 && rightWord.length <= 50) {
      const similarity = calculateSimilarity(leftWord, rightWord);
      return similarity > 0.7;
    }
  }

  // More conservative for multiple words
  if (leftWords.length <= 3 && rightWords.length <= 3) {
    // Check if there are highly similar adjacent removed/added pairs
    for (let i = 0; i < wordDiffs.length - 1; i++) {
      const current = wordDiffs[i];
      const next = wordDiffs[i + 1];

      if (current.removed && next.added) {
        const similarity = calculateSimilarity(current.value.trim(), next.value.trim());
        if (similarity > 0.8) {
          return true;
        }
      }
    }
  }

  return false;
}



// Batch processing optimized applyWordDiffs function
export function applyWordDiffs(
  leftLines: DiffResultWithLineNumbers[],
  rightLines: DiffResultWithLineNumbers[]
): void {
  // Identify corresponding modified line pairs
  const modifiedPairs: [number, number][] = [];

  let leftIdx = 0;
  let rightIdx = 0;

  while (leftIdx < leftLines.length && rightIdx < rightLines.length) {
    if (leftLines[leftIdx].spacer) {
      leftIdx++;
      continue;
    }

    if (rightLines[rightIdx].spacer) {
      rightIdx++;
      continue;
    }

    if ((leftLines[leftIdx].removed && rightLines[rightIdx].added) ||
        (leftLines[leftIdx].modified && rightLines[rightIdx].modified)) {
      modifiedPairs.push([leftIdx, rightIdx]);
    }

    leftIdx++;
    rightIdx++;
  }

  // Batch processing: execute large number of diff tasks in batches
  const BATCH_SIZE = 10; // Process 10 lines per batch
  const batches: Array<[number, number][]> = [];

  for (let i = 0; i < modifiedPairs.length; i += BATCH_SIZE) {
    batches.push(modifiedPairs.slice(i, i + BATCH_SIZE));
  }

  // Process batches sequentially
  for (const batch of batches) {
    batch.forEach(([leftIndex, rightIndex]) => {
      try {
        const leftLine = leftLines[leftIndex];
        const rightLine = rightLines[rightIndex];

        // If line already has inlineChanges, it's already been processed (e.g., indent-only diff), skip
        if ((leftLine.inlineChanges && leftLine.inlineChanges.length > 0 &&
             rightLine.inlineChanges && rightLine.inlineChanges.length > 0) ||
            (leftLine.indentOnly && rightLine.indentOnly)) {
          return;
        }

        const leftText = leftLine.value;
        const rightText = rightLine.value;

        // Early exit: if line content is identical
        if (leftText === rightText) {
          leftLine.inlineChanges = [{ value: leftLine.value, removed: false, added: false }];
          rightLine.inlineChanges = [{ value: rightLine.value, removed: false, added: false }];
          return;
        }

        // Initialize inlineChanges arrays
        leftLine.inlineChanges = [];
        rightLine.inlineChanges = [];

        // Prioritize word-level comparison
        let wordDiffs: DiffResult;
        try {
          wordDiffs = computeDiff(leftText, rightText, 'words');
        } catch (e) {
          console.error('Word diff failed, falling back to cached diff:', e instanceof Error ? e.message : 'Unknown error');
          wordDiffs = cachedDiff(leftText, rightText, diffWords);
        }

        // Check if character-level fine processing is needed
        const needsCharDiff = shouldUseCharLevelDiff(leftText, rightText, wordDiffs);

        let finalDiffs = wordDiffs;

        // Only perform character-level comparison when actually needed
        if (needsCharDiff) {
          finalDiffs = processCharLevelForSimilarWords(wordDiffs, leftText, rightText);
        }

        // Build inlineChanges
        buildInlineChanges(leftLine, rightLine, finalDiffs);

      } catch (error) {
        console.error(`Failed to process diff for line pair ${leftIndex}:${rightIndex}:`, error instanceof Error ? error.message : 'Unknown error');

        // Ensure at least basic inlineChanges exist
        if (!leftLines[leftIndex].inlineChanges) {
          leftLines[leftIndex].inlineChanges = [{ value: leftLines[leftIndex].value, removed: false, added: false }];
        }
        if (!rightLines[rightIndex].inlineChanges) {
          rightLines[rightIndex].inlineChanges = [{ value: rightLines[rightIndex].value, removed: false, added: false }];
        }
      }
    });
  }
}

// Process character-level for similar words
function processCharLevelForSimilarWords(wordDiffs: DiffResult, leftText: string, rightText: string): DiffResult {
  const result: DiffResult = [];

  for (let i = 0; i < wordDiffs.length; i++) {
    const current = wordDiffs[i];

    // Check if it's adjacent removed/added pair with high similarity
    if (current.removed && i + 1 < wordDiffs.length && wordDiffs[i + 1].added) {
      const next = wordDiffs[i + 1];
      const similarity = calculateSimilarity(current.value.trim(), next.value.trim());

      // Only perform character-level analysis for highly similar words
      if (similarity > 0.7) {
        try {
          const charDiffs = computeDiff(current.value, next.value, 'chars');
          // Clone each diff part to prevent reference sharing
          result.push(...charDiffs.map(part => ({ ...part })));
          i++; // Skip next one as we've already processed it
          continue;
        } catch (e) {
          // Character-level comparison failed, fall back to word-level
          console.warn('Character diff failed, using word level:', e);
        }
      }
    }

    // Default to word-level result - clone to prevent reference sharing
    result.push({ ...current });
  }

  return result;
}

// Build inline changes, ensuring word boundary priority
function buildInlineChanges(
  leftLine: DiffResultWithLineNumbers,
  rightLine: DiffResultWithLineNumbers,
  diffs: DiffPart[]
): void {
  // Process differences and build inlineChanges, maintaining word boundaries
  for (const part of diffs) {
    if (part.added) {
      // Added parts only appear on the right side
      rightLine.inlineChanges!.push({
        value: part.value,
        added: true,
        removed: false
      });
    } else if (part.removed) {
      // Removed parts only appear on the left side
      leftLine.inlineChanges!.push({
        value: part.value,
        removed: true,
        added: false
      });
    } else {
      // Common parts appear on both sides - create separate objects to avoid reference sharing
      leftLine.inlineChanges!.push({
        value: part.value,
        removed: false,
        added: false
      });

      rightLine.inlineChanges!.push({
        value: part.value,
        removed: false,
        added: false
      });
    }
  }
}
