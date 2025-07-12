import { vi } from 'vitest';

// 模拟 Web Worker 环境
Object.defineProperty(globalThis, 'Worker', {
  value: vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onmessage: null,
    onerror: null,
  })),
  writable: true,
});

// 模拟 navigator.hardwareConcurrency
Object.defineProperty(globalThis.navigator, 'hardwareConcurrency', {
  value: 4,
  writable: true,
});

// 模拟 URL.createObjectURL
Object.defineProperty(globalThis.URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:mock-url'),
  writable: true,
});

// 模拟 Blob
Object.defineProperty(globalThis, 'Blob', {
  value: vi.fn().mockImplementation((parts, options) => ({
    size: parts.reduce((acc, part) => acc + part.length, 0),
    type: options?.type || '',
  })),
  writable: true,
});

// 模拟 importScripts（用于 Web Worker）
Object.defineProperty(globalThis, 'importScripts', {
  value: vi.fn(),
  writable: true,
});

// 模拟 setTimeout 和 clearTimeout
vi.stubGlobal('setTimeout', vi.fn((fn, delay) => {
  return setTimeout(fn, delay);
}));

vi.stubGlobal('clearTimeout', vi.fn((id) => {
  clearTimeout(id);
}));

// 设置测试超时时间
vi.setConfig({
  testTimeout: 10000,
}); 