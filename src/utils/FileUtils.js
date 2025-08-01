const fs = require('fs-extra');
const path = require('path');

class FileUtils {
  static async getAllFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      if (item === 'node_modules' || item.startsWith('.')) continue;
      
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  static async findModuleFiles(scanPath) {
    const files = await this.getAllFiles(scanPath);
    const moduleFiles = new Map();
    
    for (const file of files) {
      const relativePath = path.relative(scanPath, file);
      const ext = path.extname(file);
      
      if (['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) {
        moduleFiles.set(relativePath, file);
        // Also store without extension for matching
        const withoutExt = relativePath.replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, '');
        moduleFiles.set(withoutExt, file);
      }
    }
    
    return moduleFiles;
  }

  static resolveImportPath(importPath, currentFilePath, scanPath) {
    if (!importPath || importPath.startsWith('.') === false) {
      return null;
    }
    
    try {
      // Get the full path of the current file
      const currentFileFullPath = path.join(scanPath, currentFilePath);
      const currentDir = path.dirname(currentFileFullPath);
      
      // Resolve the import path relative to the current file's directory
      const resolvedPath = path.resolve(currentDir, importPath);
      
      // Make it relative to the scan path
      const relativeToScanPath = path.relative(scanPath, resolvedPath);
      
      // Convert to forward slashes and remove extension
      const finalPath = relativeToScanPath.replace(/\\/g, '/').replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, '');
      
      return finalPath;
    } catch (error) {
      console.warn(`Warning: Could not resolve import path ${importPath} from ${currentFilePath}:`, error.message);
      return null;
    }
  }

  static extractImportDetails(defaultAndNamed, namedImports, defaultImport, namespaceImport, multipleImports) {
    if (defaultAndNamed && namedImports) {
      // Handle: import default, { named1, named2 } from 'module'
      const defaultName = defaultAndNamed.trim();
      const namedList = namedImports
        .replace(/[{}]/g, '')
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp.length > 0)
        .map(imp => {
          const parts = imp.split(/\s+as\s+/);
          return parts.length > 1 ? `${parts[0]} as ${parts[1]}` : parts[0];
        });
      return `Default import: ${defaultName}, Named imports: ${namedList.join(', ')}`;
    } else if (namedImports) {
      // Extract named imports: { foo, bar, baz as qux }
      const imports = namedImports
        .replace(/[{}]/g, '')
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp.length > 0)
        .map(imp => {
          const parts = imp.split(/\s+as\s+/);
          return parts.length > 1 ? `${parts[0]} as ${parts[1]}` : parts[0];
        });
      return `Named imports: ${imports.join(', ')}`;
    } else if (defaultImport) {
      return `Default import: ${defaultImport}`;
    } else if (namespaceImport) {
      return `Namespace import: ${namespaceImport}`;
    } else if (multipleImports) {
      return `Multiple imports: ${multipleImports}`;
    } else {
      return 'Module import (no specific items)';
    }
  }

  static isTargetFile(filePath, targetFile) {
    // Remove extension from target file for comparison (since resolved paths don't have extensions)
    const targetFileWithoutExt = targetFile.replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, '');
    
    // Check if this is the target file we're analyzing
    const isTarget = filePath === targetFile || 
           filePath === targetFileWithoutExt ||
           filePath.endsWith('/' + targetFile) ||
           filePath.endsWith('/' + targetFileWithoutExt) ||
           filePath.endsWith('\\' + targetFile) ||
           filePath.endsWith('\\' + targetFileWithoutExt);
    
    return isTarget;
  }
}

module.exports = FileUtils; 