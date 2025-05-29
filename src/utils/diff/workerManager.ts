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
const MAX_WORKERS = 2; // Use 2 workers for better parallel processing
const workerInitPromises = new Map<Worker, Promise<boolean>>();

// Worker script code - optimized with preloaded library
const workerScript = `
  // Define fallback diff functions
  const fallbackDiff = {
    diffLines: function(oldStr, newStr) {
      const oldLines = oldStr.split('\\n');
      const newLines = newStr.split('\\n');
      const result = [];

      // Simple line comparison implementation as fallback
      let oldIndex = 0;
      let newIndex = 0;

      while (oldIndex < oldLines.length || newIndex < newLines.length) {
        if (oldIndex >= oldLines.length) {
          result.push({ value: newLines[newIndex] + '\\n', added: true });
          newIndex++;
        } else if (newIndex >= newLines.length) {
          result.push({ value: oldLines[oldIndex] + '\\n', removed: true });
          oldIndex++;
        } else if (oldLines[oldIndex] === newLines[newIndex]) {
          result.push({ value: oldLines[oldIndex] + '\\n' });
          oldIndex++;
          newIndex++;
        } else {
          result.push({ value: oldLines[oldIndex] + '\\n', removed: true });
          result.push({ value: newLines[newIndex] + '\\n', added: true });
          oldIndex++;
          newIndex++;
        }
      }

      return result;
    },

    diffWords: function(oldStr, newStr) {
      const oldWords = oldStr.split(/\\s+/);
      const newWords = newStr.split(/\\s+/);
      const result = [];

      // Simple word comparison implementation
      let oldIndex = 0;
      let newIndex = 0;

      while (oldIndex < oldWords.length || newIndex < newWords.length) {
        if (oldIndex >= oldWords.length) {
          result.push({ value: newWords[newIndex], added: true });
          newIndex++;
        } else if (newIndex >= newWords.length) {
          result.push({ value: oldWords[oldIndex], removed: true });
          oldIndex++;
        } else if (oldWords[oldIndex] === newWords[newIndex]) {
          result.push({ value: oldWords[oldIndex] });
          oldIndex++;
          newIndex++;
        } else {
          result.push({ value: oldWords[oldIndex], removed: true });
          result.push({ value: newWords[newIndex], added: true });
          oldIndex++;
          newIndex++;
        }
      }

      return result;
    },

    diffChars: function(oldStr, newStr) {
      // Optimized character diff for better performance
      const result = [];
      let oldIndex = 0;
      let newIndex = 0;
      let commonStart = '';
      let commonEnd = '';

      // Find common prefix to avoid unnecessary character comparisons
      while (oldIndex < oldStr.length && newIndex < newStr.length &&
             oldStr[oldIndex] === newStr[newIndex]) {
        commonStart += oldStr[oldIndex];
        oldIndex++;
        newIndex++;
      }

      // Find common suffix
      let oldEnd = oldStr.length - 1;
      let newEnd = newStr.length - 1;
      while (oldEnd >= oldIndex && newEnd >= newIndex &&
             oldStr[oldEnd] === newStr[newEnd]) {
        commonEnd = oldStr[oldEnd] + commonEnd;
        oldEnd--;
        newEnd--;
      }

      // Add common prefix
      if (commonStart) {
        result.push({ value: commonStart });
      }

      // Add different middle part
      const oldMiddle = oldStr.substring(oldIndex, oldEnd + 1);
      const newMiddle = newStr.substring(newIndex, newEnd + 1);

      if (oldMiddle) {
        result.push({ value: oldMiddle, removed: true });
      }
      if (newMiddle) {
        result.push({ value: newMiddle, added: true });
      }

      // Add common suffix
      if (commonEnd) {
        result.push({ value: commonEnd });
      }

      return result.length > 0 ? result : [{ value: oldStr }];
    }
  };

  let Diff = null;
  let isInitialized = false;

  // Optimized library loading with immediate fallback
  const initializeDiff = () => {
    if (isInitialized) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        // Try to load from CDN with shorter timeout
        const timeout = setTimeout(() => {
          console.warn('CDN loading timeout, using optimized fallback diff implementation');
          Diff = fallbackDiff;
          isInitialized = true;
          resolve();
        }, 3000); // Reduced to 3 seconds for faster fallback

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

    // Wait for worker initialization
    const initPromise = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Worker initialization timeout');
        resolve(false);
      }, 5000);

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
  // Initialize worker pool if empty
  if (diffWorkerPool.length === 0) {
    const initPromises = [];
    for (let i = 0; i < MAX_WORKERS; i++) {
      initPromises.push(createInitializedWorker());
    }

    const workers = await Promise.all(initPromises);
    diffWorkerPool = workers.filter(w => w !== null) as Worker[];

    if (diffWorkerPool.length === 0) {
      return null;
    }
  }

  // Use round-robin to get next worker
  const worker = diffWorkerPool[currentWorkerIndex];
  currentWorkerIndex = (currentWorkerIndex + 1) % diffWorkerPool.length;

  return worker;
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
  currentWorkerIndex = 0;
  console.log('All Diff Workers terminated');
}

/**
 * Process diff calculation using Worker with optimized pooling
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
      // Shorter timeout for better responsiveness
      const timeout = setTimeout(() => {
        reject(new Error('Worker timeout after 10 seconds'));
      }, 10000); // Reduced to 10 seconds

      let isResolved = false;

      const cleanup = () => {
        if (timeout) {
          clearTimeout(timeout);
        }
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