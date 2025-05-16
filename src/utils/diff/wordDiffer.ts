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

// 对文本进行差异比较，同时缓存结果
function cachedDiff(leftText: string, rightText: string, diffFn: typeof diffWords | typeof diffChars): DiffResult {
  const cacheKey = `${leftText}|${rightText}|${diffFn.name}`;
  
  if (diffCache.has(cacheKey)) {
    return diffCache.get(cacheKey)!;
  }
  
  const result = diffFn(leftText, rightText);
  diffCache.set(cacheKey, result);
  return result;
}

// 检查是否应该进行字符级别的差异比较
function shouldUseCharLevelDiff(leftText: string, rightText: string, wordDiffs: DiffResult): boolean {
  // 检查是否整行只有一个单词
  const leftWords = leftText.trim().split(/\s+/);
  const rightWords = rightText.trim().split(/\s+/);
  
  // 如果任一侧只有一个单词，使用字符级别比较
  if (leftWords.length === 1 || rightWords.length === 1) {
    return true;
  }
  
  // 检查每个有差异的单词对的相似度
  for (let i = 0; i < wordDiffs.length; i++) {
    const part = wordDiffs[i];
    
    if (part.added && i > 0 && wordDiffs[i - 1].removed) {
      const leftWord = wordDiffs[i - 1].value;
      const rightWord = part.value;
      const similarity = calculateSimilarity(leftWord, rightWord);
      
      // 如果相似度高于阈值，应该使用字符级别比较
      if (similarity > 0.5) {
        return true;
      }
    }
  }
  
  return false;
}

// 使用异步方式计算差异，优先使用Web Worker
async function computeDiffAsync(leftText: string, rightText: string, type: 'words' | 'chars'): Promise<DiffResult> {
  try {
    // 使用Worker管理器进行异步计算
    const task = type === 'words' ? 'diffWords' : 'diffChars';
    return await processDiffWithWorker<DiffResult>(task, leftText, rightText, undefined, type);
  } catch (e) {
    // 如果Worker不可用或计算失败，回退到同步计算
    console.warn(`Worker diff failed for ${type}, falling back to sync mode:`, e);
    return cachedDiff(
      leftText, 
      rightText, 
      type === 'words' ? diffWords : diffChars
    );
  }
}

// Function to apply diffs to modified lines
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
  
  // 处理每一对需要计算差异的行
  const processPromises = modifiedPairs.map(async ([leftIndex, rightIndex]) => {
    const leftLine = leftLines[leftIndex];
    const rightLine = rightLines[rightIndex];
    
    const leftText = leftLine.value;
    const rightText = rightLine.value;
    
    // 初始化 inlineChanges 数组
    leftLine.inlineChanges = [];
    rightLine.inlineChanges = [];
    
    // 首先计算单词级别的差异
    let wordDiffs: DiffResult;
    try {
      wordDiffs = await computeDiffAsync(leftText, rightText, 'words');
    } catch (e) {
      // 如果异步计算失败，回退到同步计算
      console.error('Async diff failed, falling back to sync:', e);
      wordDiffs = cachedDiff(leftText, rightText, diffWords);
    }
    
    // 根据单词差异决定是使用字符级别还是单词级别的比较
    const useCharLevel = shouldUseCharLevelDiff(leftText, rightText, wordDiffs);
    
    let diffs = wordDiffs;
    
    // 如果需要字符级别比较，重新计算
    if (useCharLevel) {
      try {
        diffs = await computeDiffAsync(leftText, rightText, 'chars');
      } catch (e) {
        console.error('Async char diff failed, falling back to sync:', e);
        diffs = cachedDiff(leftText, rightText, diffChars);
      }
    }
    
    // 处理差异并构建 inlineChanges
    for (const part of diffs) {
      if (part.added) {
        // 添加的部分只出现在右侧
        rightLine.inlineChanges.push({
          value: part.value,
          added: true,
          removed: false
        });
      } else if (part.removed) {
        // 删除的部分只出现在左侧
        leftLine.inlineChanges.push({
          value: part.value,
          removed: true,
          added: false
        });
      } else {
        // 共同部分出现在两侧
        leftLine.inlineChanges.push({
          value: part.value,
          removed: false,
          added: false
        });
        
        rightLine.inlineChanges.push({
          value: part.value,
          removed: false,
          added: false
        });
      }
    }
  });
  
  // 等待所有行的处理完成
  await Promise.all(processPromises);
}
