// Worker manager module for providing universal Worker support for diff calculations

// Define available diff task types
type DiffTaskType = 'diffLines' | 'diffWords' | 'diffChars';

// Define Worker work message interface
interface WorkerMessage {
  action: DiffTaskType;
  oldText: string;
  newText: string;
  id?: number;
  type?: 'words' | 'chars';
}

// Worker pool for reusing workers
let diffWorkerPool: Worker[] = [];
let currentWorkerIndex = 0;
const MAX_WORKERS = navigator.hardwareConcurrency || 4; // 根据CPU核心数动态调整
const workerInitPromises = new Map<Worker, Promise<boolean>>();
const workerBusyStatus = new Map<Worker, boolean>(); // 跟踪worker繁忙状态

// Worker script code - 进一步优化
const workerScript = `
  // 高性能fallback diff函数
  const fallbackDiff = {
    diffLines: function(oldStr, newStr) {
      // 早期退出优化
      if (oldStr === newStr) {
        return oldStr ? [{ value: oldStr }] : [];
      }

      const oldLines = oldStr.split('\\n');
      const newLines = newStr.split('\\n');
      const result = [];

      // 优化的行比较，使用LCS算法的简化版本
      const minLines = Math.min(oldLines.length, newLines.length);
      let commonStart = 0;
      let commonEnd = 0;

      // 找到共同开头
      while (commonStart < minLines && oldLines[commonStart] === newLines[commonStart]) {
        commonStart++;
      }

      // 找到共同结尾
      while (commonEnd < minLines - commonStart &&
             oldLines[oldLines.length - 1 - commonEnd] === newLines[newLines.length - 1 - commonEnd]) {
        commonEnd++;
      }

      // 添加共同开头
      for (let i = 0; i < commonStart; i++) {
        result.push({ value: oldLines[i] + '\\n' });
      }

      // 处理中间的差异部分
      const oldMiddleStart = commonStart;
      const oldMiddleEnd = oldLines.length - commonEnd;
      const newMiddleStart = commonStart;
      const newMiddleEnd = newLines.length - commonEnd;

      // 添加删除的行
      for (let i = oldMiddleStart; i < oldMiddleEnd; i++) {
        result.push({ value: oldLines[i] + '\\n', removed: true });
      }

      // 添加新增的行
      for (let i = newMiddleStart; i < newMiddleEnd; i++) {
        result.push({ value: newLines[i] + '\\n', added: true });
      }

      // 添加共同结尾
      for (let i = oldLines.length - commonEnd; i < oldLines.length; i++) {
        result.push({ value: oldLines[i] + '\\n' });
      }

      return result;
    },

    diffWords: function(oldStr, newStr) {
      // 早期退出优化
      if (oldStr === newStr) {
        return oldStr ? [{ value: oldStr }] : [];
      }

      // 使用更智能的分词策略
      const wordRegex = /\\S+|\\s+/g;
      const oldWords = oldStr.match(wordRegex) || [];
      const newWords = newStr.match(wordRegex) || [];

      return this.computeWordDiff(oldWords, newWords);
    },

    diffChars: function(oldStr, newStr) {
      // 早期退出优化
      if (oldStr === newStr) {
        return oldStr ? [{ value: oldStr }] : [];
      }

      // 对于长字符串使用优化算法
      if (oldStr.length + newStr.length > 1000) {
        return this.computeOptimizedCharDiff(oldStr, newStr);
      }

      // 标准字符diff
      return this.computeCharDiff(oldStr, newStr);
    },

    // 优化的单词diff算法
    computeWordDiff: function(oldWords, newWords) {
      const result = [];
      const minLength = Math.min(oldWords.length, newWords.length);
      let commonStart = 0;
      let commonEnd = 0;

      // 找到共同开头
      while (commonStart < minLength && oldWords[commonStart] === newWords[commonStart]) {
        commonStart++;
      }

      // 找到共同结尾
      while (commonEnd < minLength - commonStart &&
             oldWords[oldWords.length - 1 - commonEnd] === newWords[newWords.length - 1 - commonEnd]) {
        commonEnd++;
      }

      // 添加共同开头
      for (let i = 0; i < commonStart; i++) {
        result.push({ value: oldWords[i] });
      }

      // 处理中间差异
      const oldMiddle = oldWords.slice(commonStart, oldWords.length - commonEnd);
      const newMiddle = newWords.slice(commonStart, newWords.length - commonEnd);

      if (oldMiddle.length > 0) {
        result.push({ value: oldMiddle.join(''), removed: true });
      }
      if (newMiddle.length > 0) {
        result.push({ value: newMiddle.join(''), added: true });
      }

      // 添加共同结尾
      for (let i = oldWords.length - commonEnd; i < oldWords.length; i++) {
        result.push({ value: oldWords[i] });
      }

      return result;
    },

    // 优化的字符diff算法
    computeOptimizedCharDiff: function(oldStr, newStr) {
      const result = [];
      let oldIndex = 0;
      let newIndex = 0;

      // 找共同前缀
      while (oldIndex < oldStr.length && newIndex < newStr.length &&
             oldStr[oldIndex] === newStr[newIndex]) {
        oldIndex++;
        newIndex++;
      }

      // 找共同后缀
      let oldEnd = oldStr.length - 1;
      let newEnd = newStr.length - 1;
      while (oldEnd >= oldIndex && newEnd >= newIndex &&
             oldStr[oldEnd] === newStr[newEnd]) {
        oldEnd--;
        newEnd--;
      }

      // 添加共同前缀
      if (oldIndex > 0) {
        result.push({ value: oldStr.substring(0, oldIndex) });
      }

      // 添加差异部分
      const oldMiddle = oldStr.substring(oldIndex, oldEnd + 1);
      const newMiddle = newStr.substring(newIndex, newEnd + 1);

      if (oldMiddle) {
        result.push({ value: oldMiddle, removed: true });
      }
      if (newMiddle) {
        result.push({ value: newMiddle, added: true });
      }

      // 添加共同后缀
      if (oldEnd + 1 < oldStr.length) {
        result.push({ value: oldStr.substring(oldEnd + 1) });
      }

      return result.length > 0 ? result : [{ value: oldStr }];
    },

    // 标准字符diff
    computeCharDiff: function(oldStr, newStr) {
      const result = [];
      const dp = Array(oldStr.length + 1).fill(null).map(() => Array(newStr.length + 1).fill(0));

      // 简化的动态规划算法
      for (let i = 0; i <= oldStr.length; i++) dp[i][0] = i;
      for (let j = 0; j <= newStr.length; j++) dp[0][j] = j;

      for (let i = 1; i <= oldStr.length; i++) {
        for (let j = 1; j <= newStr.length; j++) {
          if (oldStr[i-1] === newStr[j-1]) {
            dp[i][j] = dp[i-1][j-1];
          } else {
            dp[i][j] = Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1;
          }
        }
      }

      // 回溯构建结果
      let i = oldStr.length;
      let j = newStr.length;
      const ops = [];

      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldStr[i-1] === newStr[j-1]) {
          ops.unshift({ type: 'equal', char: oldStr[i-1] });
          i--;
          j--;
        } else if (i > 0 && (j === 0 || dp[i-1][j] <= dp[i][j-1])) {
          ops.unshift({ type: 'delete', char: oldStr[i-1] });
          i--;
        } else {
          ops.unshift({ type: 'insert', char: newStr[j-1] });
          j--;
        }
      }

      // 合并连续操作
      let currentValue = '';
      let currentType = null;

      for (const op of ops) {
        if (op.type === currentType) {
          currentValue += op.char;
        } else {
          if (currentValue) {
            const diffPart = { value: currentValue };
            if (currentType === 'delete') diffPart.removed = true;
            if (currentType === 'insert') diffPart.added = true;
            result.push(diffPart);
          }
          currentValue = op.char;
          currentType = op.type;
        }
      }

      if (currentValue) {
        const diffPart = { value: currentValue };
        if (currentType === 'delete') diffPart.removed = true;
        if (currentType === 'insert') diffPart.added = true;
        result.push(diffPart);
      }

      return result;
    }
  };

  let Diff = null;
  let isInitialized = false;

  // 更快的初始化，更短的CDN超时
  const initializeDiff = () => {
    if (isInitialized) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        // 更短的CDN超时，更快的fallback
        const timeout = setTimeout(() => {
          console.warn('CDN loading timeout, using optimized fallback diff implementation');
          Diff = fallbackDiff;
          isInitialized = true;
          resolve();
        }, 2000); // 减少到2秒

        importScripts('https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.0.0/diff.min.js');
        clearTimeout(timeout);

        if (typeof self.Diff !== 'undefined' && self.Diff.diffLines) {
          Diff = self.Diff;
          console.log('Successfully loaded jsdiff library from CDN');
        } else {
          Diff = fallbackDiff;
        }
      } catch (e) {
        console.warn('Failed to load jsdiff from CDN, using optimized fallback:', e.message);
        Diff = fallbackDiff;
      }

      isInitialized = true;
      resolve();
    });
  };

  // Initialize immediately when worker starts
  initializeDiff().then(() => {
    // Send initialization complete signal
    self.postMessage({ type: 'init', ready: true });

    self.onmessage = function(e) {
      try {
        const { action, oldText, newText, id, type } = e.data;
        let result;

        // Quick empty check
        if (!oldText && !newText) {
          result = [];
        } else if (!oldText) {
          result = [{ value: newText, added: true }];
        } else if (!newText) {
          result = [{ value: oldText, removed: true }];
        } else {
          // Execute corresponding diff calculation based on different task types
          switch (action) {
            case 'diffLines':
              result = Diff.diffLines(oldText, newText);
              break;
            case 'diffWords':
              result = Diff.diffWords(oldText, newText);
              break;
            case 'diffChars':
              result = Diff.diffChars(oldText, newText);
              break;
            default:
              throw new Error('Unknown action: ' + action);
          }
        }

        // Send result back to main thread
        self.postMessage({ id, result, action });
      } catch (error) {
        // Send error back to main thread
        self.postMessage({
          id: e.data.id,
          error: error.message || 'Unknown error in worker'
        });
      }
    };
  });
`;

/**
 * 计算基于文本长度的动态超时时间
 */
function calculateTimeout(textLength: number): number {
  const baseTimeout = 3000; // 基础3秒
  const lengthFactor = Math.min(textLength / 10000, 5); // 每10K字符增加时间，最多5倍
  return baseTimeout + (lengthFactor * 2000); // 最多13秒
}

/**
 * Create and return diff calculation Worker with initialization
 * @returns Promise resolving to initialized Worker instance
 */
async function createInitializedWorker(): Promise<Worker | null> {
  if (typeof Worker === 'undefined') {
    return null;
  }

  try {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    // 标记为未繁忙
    workerBusyStatus.set(worker, false);

    // 更短的初始化超时
    const initPromise = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Worker initialization timeout');
        resolve(false);
      }, 3000); // 减少到3秒

      worker.onmessage = function(e) {
        if (e.data.type === 'init' && e.data.ready) {
          clearTimeout(timeout);
          resolve(true);
        }
      };
    });

    const initialized = await initPromise;
    if (initialized) {
      workerInitPromises.set(worker, Promise.resolve(true));
      return worker;
    } else {
      worker.terminate();
      return null;
    }
  } catch (e) {
    console.error('Failed to create initialized Worker:', e);
    return null;
  }
}

/**
 * Get an available worker from the pool or create a new one
 * @returns Available Worker instance or null
 */
export async function getAvailableWorker(): Promise<Worker | null> {
  // 首先尝试找到不繁忙的worker
  for (const worker of diffWorkerPool) {
    if (!workerBusyStatus.get(worker)) {
      return worker;
    }
  }

  // 如果没有可用的worker且pool未满，创建新的
  if (diffWorkerPool.length < MAX_WORKERS) {
    const newWorker = await createInitializedWorker();
    if (newWorker) {
      diffWorkerPool.push(newWorker);
      return newWorker;
    }
  }

  // 如果pool已满且都繁忙，返回第一个worker（会等待它完成）
  if (diffWorkerPool.length > 0) {
    currentWorkerIndex = (currentWorkerIndex + 1) % diffWorkerPool.length;
    return diffWorkerPool[currentWorkerIndex];
  }

  return null;
}

/**
 * Create and return diff calculation Worker (legacy function for compatibility)
 * @returns Created Worker instance, returns null if not supported
 */
export function createDiffWorker(): Worker | null {
  // For backward compatibility, return first available worker synchronously
  return diffWorkerPool.length > 0 ? diffWorkerPool[0] : null;
}

/**
 * Terminate all workers in the pool
 */
export function terminateDiffWorker(): void {
  diffWorkerPool.forEach(worker => {
    worker.terminate();
  });
  diffWorkerPool = [];
  workerBusyStatus.clear();
  workerInitPromises.clear();
  currentWorkerIndex = 0;
  console.log('All Diff Workers terminated');
}

/**
 * Process diff calculation using Worker with optimized pooling and dynamic timeout
 * @param task Task type
 * @param oldText Old text
 * @param newText New text
 * @param id Optional request ID
 * @param type Diff type, applicable to word or character level
 * @returns Promise returning diff calculation result
 */
export function processDiffWithWorker<T>(
  task: DiffTaskType,
  oldText: string,
  newText: string,
  id?: number,
  type?: 'words' | 'chars'
): Promise<T> {
  return getAvailableWorker().then(worker => {
    // If Worker is not available, throw error
    if (!worker) {
      throw new Error('Web Worker is not supported or failed to initialize');
    }

    return new Promise<T>((resolve, reject) => {
      // 根据文本长度计算动态超时时间
      const textLength = oldText.length + newText.length;
      const timeout = setTimeout(() => {
        // 标记worker为不繁忙
        workerBusyStatus.set(worker, false);
        reject(new Error(`Worker timeout after ${calculateTimeout(textLength)}ms for text length ${textLength}`));
      }, calculateTimeout(textLength));

      let isResolved = false;

      // 标记worker为繁忙
      workerBusyStatus.set(worker, true);

      const cleanup = () => {
        if (timeout) {
          clearTimeout(timeout);
        }
        // 标记worker为不繁忙
        workerBusyStatus.set(worker, false);
        isResolved = true;
      };

      const messageHandler = (e: MessageEvent) => {
        if (isResolved) return;

        const { id: responseId, result, error, action } = e.data;

        // If there's an ID, ensure it matches the request ID
        if (id !== undefined && responseId !== id) {
          return;
        }

        // Only handle our specific action type
        if (action && action !== task) {
          return;
        }

        cleanup();
        worker.removeEventListener('message', messageHandler);

        if (error) {
          reject(new Error(error));
        } else {
          resolve(result as T);
        }
      };

      worker.addEventListener('message', messageHandler);

      try {
        // Send diff calculation request
        worker.postMessage({
          action: task,
          oldText,
          newText,
          id: id || Date.now() + Math.random(), // Ensure unique ID
          type
        } as WorkerMessage);
      } catch (e) {
        cleanup();
        worker.removeEventListener('message', messageHandler);
        reject(new Error(`Failed to send message to worker: ${e instanceof Error ? e.message : 'Unknown error'}`));
      }
    });
  }).catch(e => {
    throw new Error(`Failed to process with worker: ${e instanceof Error ? e.message : 'Unknown error'}`);
  });
}