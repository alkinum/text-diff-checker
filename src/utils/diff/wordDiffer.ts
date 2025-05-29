import { diffChars, diffWords } from 'diff';
import { DiffResultWithLineNumbers } from './types';
import { processDiffWithWorker } from './workerManager';

// 判断两个单词的相似度
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  // 使用莱文斯坦距离计算相似度
  const matrix: number[][] = [];

  // 初始化矩阵
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }

  // 填充矩阵
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          Math.min(
            matrix[i][j - 1] + 1,   // 插入
            matrix[i - 1][j] + 1    // 删除
          )
        );
      }
    }
  }

  // 计算相似度
  const distance = matrix[str1.length][str2.length];
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

// 定义差异部分的接口
interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

// 定义差异结果的类型
type DiffResult = DiffPart[];

// 缓存计算结果，避免重复计算
const diffCache = new Map<string, DiffResult>();
const MAX_CACHE_SIZE = 200; // Increased cache size
const MAX_CACHE_KEY_LENGTH = 2000; // Increased cache key length limit
const cacheStats = { hits: 0, misses: 0 }; // Track cache performance

// 智能缓存键生成，使用内容哈希而不是完整文本
function generateCacheKey(leftText: string, rightText: string, diffType: string): string {
  const totalLength = leftText.length + rightText.length;

  // For short texts, use full content
  if (totalLength <= MAX_CACHE_KEY_LENGTH) {
    return `${leftText}|${rightText}|${diffType}`;
  }

  // For longer texts, use a hash-like approach
  const leftSample = leftText.substring(0, 100) + leftText.substring(leftText.length - 100);
  const rightSample = rightText.substring(0, 100) + rightText.substring(rightText.length - 100);
  return `${leftSample}|${rightSample}|${totalLength}|${diffType}`;
}

// 对文本进行差异比较，同时缓存结果
function cachedDiff(leftText: string, rightText: string, diffFn: typeof diffWords | typeof diffChars): DiffResult {
  const cacheKey = generateCacheKey(leftText, rightText, diffFn.name);

  if (diffCache.has(cacheKey)) {
    cacheStats.hits++;
    return diffCache.get(cacheKey)!;
  }

  cacheStats.misses++;

  // 如果缓存太大，使用LRU策略清理
  if (diffCache.size >= MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(diffCache.keys()).slice(0, 50); // 删除50个最旧的条目
    keysToDelete.forEach(key => diffCache.delete(key));
  }

  const result = diffFn(leftText, rightText);
  diffCache.set(cacheKey, result);
  return result;
}

// 检查是否应该进行字符级别的差异比较 - 优化版本，更保守的策略
function shouldUseCharLevelDiff(leftText: string, rightText: string, wordDiffs: DiffResult): boolean {
  // 如果文本很短且只有少量单词，可以考虑字符级比较
  const leftWords = leftText.trim().split(/\s+/);
  const rightWords = rightText.trim().split(/\s+/);

  // 如果两边都只有一个单词，且单词长度不是太长，才考虑字符级比较
  if (leftWords.length === 1 && rightWords.length === 1) {
    const leftWord = leftWords[0];
    const rightWord = rightWords[0];

    // 只有当单词长度适中且相似度很高时才使用字符级比较
    if (leftWord.length <= 50 && rightWord.length <= 50) {
      const similarity = calculateSimilarity(leftWord, rightWord);
      return similarity > 0.7; // 提高阈值，只有非常相似的单词才用字符级比较
    }
  }

  // 对于多个单词的情况，更加保守
  if (leftWords.length <= 3 && rightWords.length <= 3 && leftText.length + rightText.length <= 100) {
    // 检查是否有高度相似的相邻removed/added对
    for (let i = 0; i < wordDiffs.length - 1; i++) {
      const current = wordDiffs[i];
      const next = wordDiffs[i + 1];

      if (current.removed && next.added) {
        const similarity = calculateSimilarity(current.value.trim(), next.value.trim());
        // 只有相似度很高的情况才使用字符级比较
        if (similarity > 0.8) {
          return true;
        }
      }
    }
  }

  // 默认使用词汇级比较
  return false;
}

// 使用异步方式计算差异，优先使用Web Worker
async function computeDiffAsync(leftText: string, rightText: string, type: 'words' | 'chars'): Promise<DiffResult> {
  // Early return for identical texts
  if (leftText === rightText) {
    return leftText ? [{ value: leftText }] : [];
  }

  // 如果文本过长，直接使用同步计算避免Worker超时
  const totalLength = leftText.length + rightText.length;
  if (totalLength > 20000) { // Reduced threshold for better responsiveness
    console.warn(`Text too long (${totalLength} chars), using sync diff for ${type}`);
    return cachedDiff(leftText, rightText, type === 'words' ? diffWords : diffChars);
  }

  try {
    // 使用Worker管理器进行异步计算，添加更短的超时时间
    const task = type === 'words' ? 'diffWords' : 'diffChars';
    const result = await Promise.race([
      processDiffWithWorker<DiffResult>(task, leftText, rightText, undefined, type),
      // 添加额外的超时保护
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${type} diff timeout`)), 8000); // Reduced to 8 seconds
      })
    ]);
    return result;
  } catch (e) {
    // 如果Worker不可用或计算失败，回退到同步计算
    console.warn(`Worker diff failed for ${type}, falling back to sync mode:`, e instanceof Error ? e.message : 'Unknown error');
    return cachedDiff(leftText, rightText, type === 'words' ? diffWords : diffChars);
  }
}

// Function to apply diffs to modified lines - 优化为优先词汇级别
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

    // Look for pairs of lines that should be compared for word diffs
    // This includes both explicit 'modified' lines and removed/added pairs
    if ((leftLines[leftIdx].removed && rightLines[rightIdx].added) ||
        (leftLines[leftIdx].modified && rightLines[rightIdx].modified)) {
      modifiedPairs.push([leftIdx, rightIdx]);
    }

    leftIdx++;
    rightIdx++;
  }

  // 处理每一对需要计算差异的行 - 优先词汇级别
  const processPromises = modifiedPairs.map(async ([leftIndex, rightIndex]) => {
    try {
      const leftLine = leftLines[leftIndex];
      const rightLine = rightLines[rightIndex];

      const leftText = leftLine.value;
      const rightText = rightLine.value;

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

      // 只有在确实需要时才进行字符级比较，并且只对特定的词汇对进行
      if (needsCharDiff) {
        finalDiffs = await processCharLevelForSimilarWords(wordDiffs, leftText, rightText);
      }

      // 构建 inlineChanges，确保以词汇为主要边界
      await buildInlineChanges(leftLine, rightLine, finalDiffs);

    } catch (error) {
      // 如果单个行的处理失败，记录错误但不影响其他行
      console.error(`Failed to process diff for line pair ${leftIndex}:${rightIndex}:`, error instanceof Error ? error.message : 'Unknown error');

      // 确保至少有基本的inlineChanges，使用词汇级别的fallback
      if (!leftLines[leftIndex].inlineChanges) {
        leftLines[leftIndex].inlineChanges = [{ value: leftLines[leftIndex].value, removed: false, added: false }];
      }
      if (!rightLines[rightIndex].inlineChanges) {
        rightLines[rightIndex].inlineChanges = [{ value: rightLines[rightIndex].value, removed: false, added: false }];
      }
    }
  });

  // 等待所有行的处理完成，使用Promise.allSettled防止单个失败影响整体
  const results = await Promise.allSettled(processPromises);

  // 检查是否有失败的Promise，记录但不抛出错误
  const failedCount = results.filter(result => result.status === 'rejected').length;
  if (failedCount > 0) {
    console.warn(`${failedCount} out of ${results.length} line diff operations failed, but continuing with available results`);
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
