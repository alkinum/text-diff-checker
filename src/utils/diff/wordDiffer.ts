import { diffChars, diffWords } from 'diff';
import { DiffResultWithLineNumbers } from './types';
import { processDiffWithWorker } from './workerManager';

// 优化的相似度计算 - 使用早期退出和长度预检查
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // 长度差异过大时直接返回低相似度
  const lengthDiff = Math.abs(str1.length - str2.length);
  const maxLength = Math.max(str1.length, str2.length);
  if (lengthDiff / maxLength > 0.5) return 0;

  // 对于长字符串，使用采样比较
  if (str1.length > 100 || str2.length > 100) {
    return calculateSamplingSimilarity(str1, str2);
  }

  // 使用优化的莱文斯坦距离，带早期退出
  return calculateOptimizedLevenshtein(str1, str2);
}

// 采样相似度计算，用于长字符串
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

// 优化的莱文斯坦距离计算，使用滚动数组减少内存使用
function calculateOptimizedLevenshtein(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // 使用两个一维数组而不是二维矩阵
  let prevRow = new Array(len2 + 1);
  let currRow = new Array(len2 + 1);

  // 初始化第一行
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
          prevRow[j - 1] + 1, // 替换
          prevRow[j] + 1,     // 删除
          currRow[j - 1] + 1  // 插入
        );
      }
    }

    // 交换数组引用
    [prevRow, currRow] = [currRow, prevRow];
  }

  const distance = prevRow[len2];
  return 1 - distance / Math.max(len1, len2);
}

// 定义差异部分的接口
interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

// 定义差异结果的类型
type DiffResult = DiffPart[];

// 真正的LRU缓存实现
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 重新设置以更新LRU顺序
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最老的元素
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  size(): number {
    return this.cache.size;
  }
}

// 使用LRU缓存
const diffCache = new LRUCache<string, DiffResult>(500); // 增加缓存大小
const MAX_CACHE_KEY_LENGTH = 1000; // 减少缓存键长度限制
const cacheStats = { hits: 0, misses: 0 };

// 更高效的缓存键生成，使用简单哈希
function generateCacheKey(leftText: string, rightText: string, diffType: string): string {
  const totalLength = leftText.length + rightText.length;

  if (totalLength <= MAX_CACHE_KEY_LENGTH) {
    return `${leftText}|${rightText}|${diffType}`;
  }

  // 使用简单哈希而不是字符串拼接
  const leftHash = simpleHash(leftText);
  const rightHash = simpleHash(rightText);
  return `${leftHash}:${rightHash}:${totalLength}:${diffType}`;
}

// 简单但快速的字符串哈希函数
function simpleHash(str: string): number {
  let hash = 0;
  const step = Math.max(1, Math.floor(str.length / 100)); // 采样步长

  for (let i = 0; i < str.length; i += step) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }

  return Math.abs(hash);
}

// 对文本进行差异比较，同时缓存结果
function cachedDiff(leftText: string, rightText: string, diffFn: typeof diffWords | typeof diffChars): DiffResult {
  const cacheKey = generateCacheKey(leftText, rightText, diffFn.name);

  if (diffCache.has(cacheKey)) {
    cacheStats.hits++;
    return diffCache.get(cacheKey)!;
  }

  cacheStats.misses++;

  const result = diffFn(leftText, rightText);
  diffCache.set(cacheKey, result);
  return result;
}

// 文本分块处理函数
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

// 分块diff处理
async function computeChunkedDiff(leftText: string, rightText: string, type: 'words' | 'chars'): Promise<DiffResult> {
  const CHUNK_SIZE = 10000; // 10KB 块大小

  // 如果文本不是很长，直接处理
  if (leftText.length + rightText.length <= CHUNK_SIZE * 2) {
    return cachedDiff(leftText, rightText, type === 'words' ? diffWords : diffChars);
  }

  // 尝试找到共同的前缀和后缀，减少需要处理的内容
  const { prefix, suffix, leftMiddle, rightMiddle } = extractCommonParts(leftText, rightText);

  const middleResult: DiffResult = [];
  if (leftMiddle || rightMiddle) {
    // 对中间部分进行分块处理
    const leftChunks = chunkText(leftMiddle, CHUNK_SIZE);
    const rightChunks = chunkText(rightMiddle, CHUNK_SIZE);

    // 简化处理：如果块数差异过大，使用简单diff
    if (Math.abs(leftChunks.length - rightChunks.length) > 2) {
      if (leftMiddle) middleResult.push({ value: leftMiddle, removed: true });
      if (rightMiddle) middleResult.push({ value: rightMiddle, added: true });
    } else {
      // 逐块对比
      const maxChunks = Math.max(leftChunks.length, rightChunks.length);
      for (let i = 0; i < maxChunks; i++) {
        const leftChunk = leftChunks[i] || '';
        const rightChunk = rightChunks[i] || '';

        if (leftChunk === rightChunk) {
          if (leftChunk) middleResult.push({ value: leftChunk });
        } else {
          const chunkDiff = cachedDiff(leftChunk, rightChunk, type === 'words' ? diffWords : diffChars);
          middleResult.push(...chunkDiff);
        }
      }
    }
  }

  // 组合结果
  const result: DiffResult = [];
  if (prefix) result.push({ value: prefix });
  result.push(...middleResult);
  if (suffix) result.push({ value: suffix });

  return result;
}

// 提取文本的共同前缀和后缀
function extractCommonParts(str1: string, str2: string): {
  prefix: string;
  suffix: string;
  leftMiddle: string;
  rightMiddle: string;
} {
  let prefixEnd = 0;
  const minLength = Math.min(str1.length, str2.length);

  // 查找共同前缀
  while (prefixEnd < minLength && str1[prefixEnd] === str2[prefixEnd]) {
    prefixEnd++;
  }

  // 查找共同后缀
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

// 检查是否应该进行字符级别的差异比较 - 优化版本，更保守的策略
function shouldUseCharLevelDiff(leftText: string, rightText: string, wordDiffs: DiffResult): boolean {
  // 文本太长直接跳过字符级比较
  if (leftText.length + rightText.length > 200) {
    return false;
  }

  const leftWords = leftText.trim().split(/\s+/);
  const rightWords = rightText.trim().split(/\s+/);

  // 如果两边都只有一个单词，且单词长度不是太长，才考虑字符级比较
  if (leftWords.length === 1 && rightWords.length === 1) {
    const leftWord = leftWords[0];
    const rightWord = rightWords[0];

    if (leftWord.length <= 50 && rightWord.length <= 50) {
      const similarity = calculateSimilarity(leftWord, rightWord);
      return similarity > 0.7;
    }
  }

  // 对于多个单词的情况，更加保守
  if (leftWords.length <= 3 && rightWords.length <= 3) {
    // 检查是否有高度相似的相邻removed/added对
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

// 使用异步方式计算差异，优先使用Web Worker，支持分块处理
async function computeDiffAsync(leftText: string, rightText: string, type: 'words' | 'chars'): Promise<DiffResult> {
  // Early return for identical texts
  if (leftText === rightText) {
    return leftText ? [{ value: leftText }] : [];
  }

  const totalLength = leftText.length + rightText.length;

  // 对于超长文本使用分块处理
  if (totalLength > 50000) { // 提高阈值，使用分块处理
    console.warn(`Text very long (${totalLength} chars), using chunked diff for ${type}`);
    return computeChunkedDiff(leftText, rightText, type);
  }

  // 中等长度文本直接同步处理
  if (totalLength > 20000) {
    console.warn(`Text long (${totalLength} chars), using sync diff for ${type}`);
    return cachedDiff(leftText, rightText, type === 'words' ? diffWords : diffChars);
  }

  try {
    const task = type === 'words' ? 'diffWords' : 'diffChars';
    const result = await Promise.race([
      processDiffWithWorker<DiffResult>(task, leftText, rightText, undefined, type),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${type} diff timeout`)), 6000); // 减少超时时间
      })
    ]);
    return result;
  } catch (e) {
    console.warn(`Worker diff failed for ${type}, falling back to sync mode:`, e instanceof Error ? e.message : 'Unknown error');
    return cachedDiff(leftText, rightText, type === 'words' ? diffWords : diffChars);
  }
}

// 批处理优化的applyWordDiffs函数
export async function applyWordDiffs(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): Promise<void> {
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

  // 批处理：将大量diff任务分批执行
  const BATCH_SIZE = 10; // 每批处理10行
  const batches: Array<[number, number][]> = [];

  for (let i = 0; i < modifiedPairs.length; i += BATCH_SIZE) {
    batches.push(modifiedPairs.slice(i, i + BATCH_SIZE));
  }

  // 逐批处理，避免创建过多并发Promise
  for (const batch of batches) {
    const batchPromises = batch.map(async ([leftIndex, rightIndex]) => {
      try {
        const leftLine = leftLines[leftIndex];
        const rightLine = rightLines[rightIndex];

        const leftText = leftLine.value;
        const rightText = rightLine.value;

        // 早期退出：如果行内容相同
        if (leftText === rightText) {
          leftLine.inlineChanges = [{ value: leftText, removed: false, added: false }];
          rightLine.inlineChanges = [{ value: rightText, removed: false, added: false }];
          return;
        }

        // 初始化 inlineChanges 数组
        leftLine.inlineChanges = [];
        rightLine.inlineChanges = [];

        // 优先进行词汇级别的比较
        let wordDiffs: DiffResult;
        try {
          wordDiffs = await computeDiffAsync(leftText, rightText, 'words');
        } catch (e) {
          console.error('Async word diff failed, falling back to sync:', e instanceof Error ? e.message : 'Unknown error');
          wordDiffs = cachedDiff(leftText, rightText, diffWords);
        }

        // 检查是否需要进行字符级别的精细处理
        const needsCharDiff = shouldUseCharLevelDiff(leftText, rightText, wordDiffs);

        let finalDiffs = wordDiffs;

        // 只有在确实需要时才进行字符级比较
        if (needsCharDiff) {
          finalDiffs = await processCharLevelForSimilarWords(wordDiffs, leftText, rightText);
        }

        // 构建 inlineChanges
        await buildInlineChanges(leftLine, rightLine, finalDiffs);

      } catch (error) {
        console.error(`Failed to process diff for line pair ${leftIndex}:${rightIndex}:`, error instanceof Error ? error.message : 'Unknown error');

        // 确保至少有基本的inlineChanges
        if (!leftLines[leftIndex].inlineChanges) {
          leftLines[leftIndex].inlineChanges = [{ value: leftLines[leftIndex].value, removed: false, added: false }];
        }
        if (!rightLines[rightIndex].inlineChanges) {
          rightLines[rightIndex].inlineChanges = [{ value: rightLines[rightIndex].value, removed: false, added: false }];
        }
      }
    });

    // 等待当前批次完成再处理下一批
    await Promise.allSettled(batchPromises);
  }
}

// 新增：对相似词汇进行字符级处理
async function processCharLevelForSimilarWords(wordDiffs: DiffResult, leftText: string, rightText: string): Promise<DiffResult> {
  const result: DiffResult = [];

  for (let i = 0; i < wordDiffs.length; i++) {
    const current = wordDiffs[i];

    // 检查是否是相邻的removed/added对，且相似度高
    if (current.removed && i + 1 < wordDiffs.length && wordDiffs[i + 1].added) {
      const next = wordDiffs[i + 1];
      const similarity = calculateSimilarity(current.value.trim(), next.value.trim());

      // 只有高相似度的词汇才进行字符级分析
      if (similarity > 0.7) {
        try {
          const charDiffs = await computeDiffAsync(current.value, next.value, 'chars');
          result.push(...charDiffs);
          i++; // 跳过下一个，因为我们已经处理了
          continue;
        } catch (e) {
          // 字符级比较失败，回退到词汇级
          console.warn('Character diff failed, using word level:', e);
        }
      }
    }

    // 默认添加词汇级结果
    result.push(current);
  }

  return result;
}

// 新增：构建行内变化，确保词汇边界优先
async function buildInlineChanges(
  leftLine: DiffResultWithLineNumbers,
  rightLine: DiffResultWithLineNumbers,
  diffs: DiffResult
): Promise<void> {
  // 处理差异并构建 inlineChanges，保持词汇边界
  for (const part of diffs) {
    if (part.added) {
      // 添加的部分只出现在右侧
      rightLine.inlineChanges!.push({
        value: part.value,
        added: true,
        removed: false
      });
    } else if (part.removed) {
      // 删除的部分只出现在左侧
      leftLine.inlineChanges!.push({
        value: part.value,
        removed: true,
        added: false
      });
    } else {
      // 共同部分出现在两侧
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
