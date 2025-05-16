import { diffChars, diffWords } from 'diff';
import { DiffResultWithLineNumbers } from './types';

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

// 检查是否应该进行字符级别的差异比较
function shouldUseCharLevelDiff(leftText: string, rightText: string): boolean {
  // 检查是否整行只有一个单词
  const leftWords = leftText.trim().split(/\s+/);
  const rightWords = rightText.trim().split(/\s+/);
  
  // 如果任一侧只有一个单词，使用字符级别比较
  if (leftWords.length === 1 || rightWords.length === 1) {
    return true;
  }
  
  // 对单词进行比较，查看它们是否足够相似
  const wordDiffs = diffWords(leftText, rightText);
  
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

// Function to apply character-level diffs to modified lines
export function applyWordDiffs(leftLines: DiffResultWithLineNumbers[], rightLines: DiffResultWithLineNumbers[]): void {
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
  
  // Now handle modified line pairs with proper highlighting
  for (const [leftIndex, rightIndex] of modifiedPairs) {
    const leftLine = leftLines[leftIndex];
    const rightLine = rightLines[rightIndex];
    
    const leftText = leftLine.value;
    const rightText = rightLine.value;
    
    // 初始化 inlineChanges 数组
    leftLine.inlineChanges = [];
    rightLine.inlineChanges = [];
    
    // 判断是否应该使用字符级别比较
    if (shouldUseCharLevelDiff(leftText, rightText)) {
      // 使用字符级别比较
      const charDiffs = diffChars(leftText, rightText);
      
      // 处理字符级别差异
      for (const part of charDiffs) {
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
    } else {
      // 使用单词级别比较
      const wordDiffs = diffWords(leftText, rightText);
      
      // 处理单词级别差异
      for (const part of wordDiffs) {
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
    }
  }
}
