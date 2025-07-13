
// Function to detect the probable language from content
export function detectLanguage(content: string): string {
  if (!content.trim()) return 'plaintext';

  const trimmedContent = content.trim();

  // JSON detection - must be valid JSON
  if (/^\s*[{\[]/.test(content) && /[}\]]\s*$/.test(content)) {
    try {
      JSON.parse(content);
      return 'json';
    } catch (e) {
      // Not valid JSON, continue with other checks
    }
  }

  // XML detection
  if (/^\s*<\?xml/.test(content)) return 'xml';

  // HTML detection
  if (/^\s*<!DOCTYPE\s+html>/i.test(content) || /^\s*<html>/i.test(content)) return 'html';

  // EJS detection (check before other template languages)
  if (/^\s*<%/.test(content)) return 'ejs';

  // JavaScript/TypeScript detection (check early for strong JS indicators)
  if (/^\s*import\s+.*\s+from\s+['"][^'"]*['"];?\s*$/m.test(content) ||
      /^\s*export\s+(default\s+|const\s+|function\s+|class\s+)/m.test(content) ||
      /\bconsole\.(log|error|warn)/m.test(content) ||
      /\b(async|await)\b/m.test(content) ||
      /=>\s*{/m.test(content)) {
    return 'javascript';
  }

  // C++ detection (more specific patterns first)
  if (/^\s*#include\s*</.test(content) ||
      /^\s*#define\s+/.test(content) ||
      /^\s*using\s+namespace\s+/.test(content) ||
      /^\s*(public|private|protected):\s*$/m.test(content) ||
      /\bcout\s*<</.test(content) ||
      /\bstd::/m.test(content)) {
    return 'cpp';
  }

  // Perl detection (check before Java to avoid package conflicts)
  if (/^\s*use\s+(strict|warnings)/m.test(content) ||
      /^\s*sub\s+\w+\s*{/m.test(content) ||
      /\bmy\s*\(/m.test(content) ||
      /\$\w+/m.test(content) ||
      /\@\w+/m.test(content) ||
      /\bour\s+\@/m.test(content) ||
      /\bqw\s*\(/m.test(content) ||
      (/^\s*package\s+\w+\s*;/m.test(content) && /\buse\s+/m.test(content))) {  // Perl package with use statement
    return 'perl';
  }

  // Java detection (specific Java patterns)
  if (/^\s*package\s+[a-zA-Z][a-zA-Z0-9_.]*\s*;/m.test(content) ||
      /^\s*import\s+java\./m.test(content) ||
      /^\s*public\s+class\s+/m.test(content) ||
      /\bSystem\.out\.print/m.test(content) ||
      /\bString\[\]\s+args/m.test(content)) {
    return 'java';
  }

  // Python detection (specific Python patterns)
  if (/^\s*def\s+\w+\s*\(/m.test(content) ||
      /^\s*class\s+\w+\s*:/m.test(content) ||
      /^\s*from\s+\w+\s+import\s+/m.test(content) ||
      /^\s*import\s+\w+$/m.test(content) ||
      /\bprint\s*\(/m.test(content) ||
      /\bself\./m.test(content) ||
      /^\s*if\s+__name__\s*==\s*['"']__main__['"']/m.test(content)) {
    return 'python';
  }

  // JavaScript/TypeScript detection (less specific patterns)
  if (/^\s*function\s+\w+\s*\(/m.test(content) ||
      /^\s*(const|let|var)\s+\w+\s*=/m.test(content) ||
      /^\s*class\s+\w+\s*{/m.test(content)) {
    return 'javascript';
  }

  // C-like languages (generic patterns)
  if (/^\s*(\/\*|\/\/)/.test(content)) return 'clike';

  // YAML detection
  if (/^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/m.test(content) &&
      !/^\s*\[/.test(content) &&
      !/{/.test(content)) {
    return 'yaml';
  }

  // INI detection
  if (/^\s*\[.+\]/m.test(content) && /^\s*\w+\s*=/m.test(content)) return 'ini';

  // Default to plaintext if no pattern is matched
  return 'plaintext';
}
