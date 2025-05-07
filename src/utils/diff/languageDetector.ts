
// Function to detect the probable language from content
export function detectLanguage(content: string): string {
  if (!content.trim()) return 'plaintext';
  
  // Simple language detection based on file content patterns
  if (/^\s*[{\[]/.test(content) && /[}\]]\s*$/.test(content)) {
    try {
      JSON.parse(content);
      return 'json';
    } catch (e) {
      // Not valid JSON
    }
  }
  
  if (/^\s*<\?xml/.test(content)) return 'xml';
  if (/^\s*<!DOCTYPE\s+html>/i.test(content) || /^\s*<html>/i.test(content)) return 'html';
  if (/^\s*import\s+|^\s*export\s+|^\s*function\s+|^\s*const\s+|^\s*let\s+|^\s*var\s+|^\s*class\s+/.test(content)) return 'javascript';
  if (/^\s*#include|^\s*#define|^\s*(public|private|protected):\s*$/.test(content)) return 'cpp';
  if (/^\s*(def\s+|class\s+|import\s+|from\s+\w+\s+import)/.test(content)) return 'python';
  if (/^\s*(package\s+|import\s+|public\s+class)/.test(content)) return 'java';
  if (/^\s*(use\s+|package\s+|sub\s+)/.test(content)) return 'perl';
  if (/^\s*<%/.test(content)) return 'ejs';
  if (/^\s*(\/\*|\/\/)/.test(content)) return 'clike';
  if (/^\s*[a-zA-Z]+:/.test(content)) return 'yaml';
  if (/^\s*\[.+\]/.test(content) && /=/.test(content)) return 'ini';
  
  // Default to plaintext if no pattern is matched
  return 'plaintext';
}
