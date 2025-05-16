// Workeru7ba1u7406u6a21u5757uff0cu4e3au5deeu5f02u8ba1u7b97u63d0u4f9bu901au7528u7684Workeru652fu6301

// u5b9au4e49u53efu7528u7684u5deeu5f02u4efbu52a1u7c7bu578b
type DiffTaskType = 'diffLines' | 'diffWords' | 'diffChars';

// u5b9au4e49Workeru5de5u4f5cu6d88u606fu63a5u53e3
interface WorkerMessage {
  action: DiffTaskType;
  oldText: string;
  newText: string;
  id?: number;
  type?: 'words' | 'chars';
}

// u5168u5c40Workeru5b9eu4f8b
let diffWorker: Worker | null = null;

// u521bu5efaWorkeru7684u4ee3u7801
const workerScript = `
  // u4ece CDN u52a0u8f7d diff u5e93
  importScripts('https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.0.0/diff.min.js');
  
  self.onmessage = function(e) {
    const { action, oldText, newText, id, type } = e.data;
    let result;
    
    // u6839u636eu4e0du540cu7684u4efbu52a1u7c7bu578bu6267u884cu76f8u5e94u7684u5deeu5f02u8ba1u7b97
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
        result = { error: 'Unknown action' };
    }
    
    // u5c06u7ed3u679cu53d1u9001u56deu4e3bu7ebfu7a0b
    self.postMessage({ id, result });
  };
`;

/**
 * u521bu5efau5e76u8fd4u56deu5deeu5f02u8ba1u7b97Worker
 * @returns u521bu5efau7684Workeru5b9eu4f8buff0cu5982u679cu4e0du652fu6301u5219u8fd4u56denull
 */
export function createDiffWorker(): Worker | null {
  if (typeof Worker === 'undefined') {
    return null;
  }
  
  try {
    if (!diffWorker) {
      // u521bu5efa Blob u5bf9u8c61u5305u542b Worker u4ee3u7801
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      
      // u4f7fu7528 Blob URL u521bu5efa Worker
      diffWorker = new Worker(URL.createObjectURL(blob));
      console.log('Diff Worker created and ready');
    }
    
    return diffWorker;
  } catch (e) {
    console.error('Failed to create Diff Worker:', e);
    return null;
  }
}

/**
 * u7ec8u6b62u5deeu5f02u8ba1u7b97Worker
 */
export function terminateDiffWorker(): void {
  if (diffWorker) {
    diffWorker.terminate();
    diffWorker = null;
    console.log('Diff Worker terminated');
  }
}

/**
 * u4f7fu7528Workeru5904u7406u5deeu5f02u8ba1u7b97
 * @param task u4efbu52a1u7c7bu578b
 * @param oldText u65e7u6587u672c
 * @param newText u65b0u6587u672c
 * @param id u53efu9009u7684u8bf7u6c42ID
 * @param type u5deeu5f02u7c7bu578buff0cu9002u7528u4e8eu5355u8bcdu6216u5b57u7b26u7ea7u522b
 * @returns u8fd4u56deu5deeu5f02u8ba1u7b97u7ed3u679cu7684Promise
 */
export function processDiffWithWorker<T>(
  task: DiffTaskType, 
  oldText: string, 
  newText: string, 
  id?: number,
  type?: 'words' | 'chars'
): Promise<T> {
  const worker = createDiffWorker();
  
  // u5982u679cWorkeru4e0du53efu7528uff0cu629bu51fau9519u8bef
  if (!worker) {
    return Promise.reject(new Error('Web Worker is not supported'));
  }
  
  return new Promise<T>((resolve, reject) => {
    worker.onmessage = function(e) {
      const { id: responseId, result, error } = e.data;
      
      // u5982u679cu6709IDuff0cu786eu4fddu5339u914du8bf7u6c42ID
      if (id !== undefined && responseId !== id) {
        return;
      }
      
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result as T);
      }
    };
    
    worker.onerror = function(e) {
      reject(new Error(`Worker error: ${e.message}`));
    };
    
    // u53d1u9001u5deeu5f02u8ba1u7b97u8bf7u6c42
    worker.postMessage({
      action: task,
      oldText,
      newText,
      id,
      type
    } as WorkerMessage);
  });
} 