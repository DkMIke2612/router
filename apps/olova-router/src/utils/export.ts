import fs from 'fs';

export function detectExportType(filePath: string): {
  hasDefault: boolean;
  namedExport: string | null;
  hasMetadata: boolean;
  hasRoute: boolean;
} {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const hasMetadata = /export\s+(?:const|let|var)\s+metadata\s*=/.test(content) ||
                       /export\s*\{\s*metadata\s*\}/.test(content);

    const hasRoute = /export\s+(?:const|let|var)\s+route\s*=/.test(content) ||
                    /export\s*\{\s*route\s*\}/.test(content);

    if (/export\s+default\s+/.test(content)) {
      return { hasDefault: true, namedExport: null, hasMetadata, hasRoute };
    }

    const namedMatch = content.match(/export\s+(?:const|function|class)\s+(\w+)/);
    if (namedMatch) {
      return { hasDefault: false, namedExport: namedMatch[1], hasMetadata, hasRoute };
    }

    const exportMatch = content.match(/export\s*\{\s*(\w+)(?:\s+as\s+default)?\s*\}/);
    if (exportMatch) {
      if (content.includes('as default')) {
        return { hasDefault: true, namedExport: null, hasMetadata, hasRoute };
      }
      return { hasDefault: false, namedExport: exportMatch[1], hasMetadata, hasRoute };
    }

    return { hasDefault: false, namedExport: null, hasMetadata, hasRoute };
  } catch {
    return { hasDefault: true, namedExport: null, hasMetadata: false, hasRoute: false };
  }
}
