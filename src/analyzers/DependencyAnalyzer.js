const fs = require('fs-extra');
const path = require('path');
const CircularDependencyDetector = require('./CircularDependencyDetector');
const DependencyDepthAnalyzer = require('./DependencyDepthAnalyzer');
const FileUtils = require('../utils/FileUtils');

class DependencyAnalyzer {
  constructor(targetFile, scanPath) {
    this.targetFile = targetFile;
    this.scanPath = scanPath;
    this.dependencies = {
      incoming: new Map(), // Changed from Set to Map to store import details
      outgoing: new Map()  // Changed from Set to Map to store import details
    };
    this.moduleFiles = new Map();
  }

  async analyze() {
    await this.findModuleFiles();
    await this.analyzeDependencies();
    
    // Build complete dependency matrix for circular detection
    const dependencyMatrix = new Map();
    
    // Initialize all files in the dependency matrix
    const allFiles = new Set([this.targetFile]);
    for (const [file] of this.dependencies.incoming) {
      allFiles.add(file);
    }
    for (const [file] of this.dependencies.outgoing) {
      allFiles.add(file);
    }
    
    // Normalize file paths to match moduleFiles keys
    const normalizedFiles = new Set();
    for (const file of allFiles) {
      // Try different variations of the file path
      const variations = [
        file,
        file.replace(/\.(js|ts|jsx|tsx|mjs|cjs)$/, ''),
        file + '.js',
        file + '.ts',
        file + '.jsx',
        file + '.tsx'
      ];
      
      for (const variation of variations) {
        if (this.moduleFiles.has(variation)) {
          normalizedFiles.add(variation);
          break;
        }
      }
    }
    
    // Analyze dependencies for all files to build complete graph
    for (const file of normalizedFiles) {
      if (!dependencyMatrix.has(file)) {
        dependencyMatrix.set(file, { incoming: new Set(), outgoing: new Set() });
      }
      
      // Get the full path for the file
      const fullPath = this.moduleFiles.get(file) || this.moduleFiles.get(file + '.js') || 
                      this.moduleFiles.get(file + '.ts') || this.moduleFiles.get(file + '.jsx') || 
                      this.moduleFiles.get(file + '.tsx');
      
      if (fullPath) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          this.findFileDependenciesForMatrix(content, file, dependencyMatrix);
        } catch (error) {
          console.warn(`Warning: Could not read file ${fullPath}:`, error.message);
        }
      }
    }
    
    // Also check for files without extensions
    for (const file of normalizedFiles) {
      const fullPath = this.moduleFiles.get(file);
      if (fullPath) {
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          this.findFileDependenciesForMatrix(content, file, dependencyMatrix);
        } catch (error) {
          console.warn(`Warning: Could not read file ${fullPath}:`, error.message);
        }
      }
    }
    
    // Debug: Print dependency matrix (only in verbose mode)
    if (process.env.VERBOSE) {
      console.log('Module files keys:', Array.from(this.moduleFiles.keys()));
      console.log('Dependency matrix for circular detection:');
      for (const [file, deps] of dependencyMatrix) {
        console.log(`  ${file}:`);
        console.log(`    outgoing: ${Array.from(deps.outgoing).join(', ')}`);
        console.log(`    incoming: ${Array.from(deps.incoming).join(', ')}`);
      }
    }
    
    // Detect circular dependencies
    const circularDetector = new CircularDependencyDetector();
    circularDetector.buildDependencyGraph(dependencyMatrix);
    const circularDependencies = circularDetector.detectCircularDependencies();
    const circularReport = circularDetector.getCircularDependencyReport();
    
    // Analyze dependency depths
    const depthAnalyzer = new DependencyDepthAnalyzer();
    depthAnalyzer.buildDependencyGraph(dependencyMatrix);
    const depthReport = depthAnalyzer.getDepthAnalysisReport();
    
    return {
      targetFile: this.targetFile,
      incoming: Object.fromEntries(this.dependencies.incoming),
      outgoing: Object.fromEntries(this.dependencies.outgoing),
      totalFiles: this.moduleFiles.size,
      circularDependencies: circularReport,
      depthAnalysis: depthReport
    };
  }

  async findModuleFiles() {
    this.moduleFiles = await FileUtils.findModuleFiles(this.scanPath);
  }

  async analyzeDependencies() {
    console.log(`Found ${this.moduleFiles.size} files to analyze`);
    console.log(`Target file: ${this.targetFile}`);
    console.log(`Scan path: ${this.scanPath}`);
    
    for (const [relativePath, fullPath] of this.moduleFiles) {
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        
        console.log(`\nAnalyzing: ${relativePath}`);
        
        if (this.isTargetFile(relativePath)) {
          console.log(`  -> This is target file`);
          this.findOutgoingDependencies(content, relativePath);
        } else {
          this.findIncomingDependencies(content, relativePath);
        }
      } catch (error) {
        console.warn(`Warning: Could not read file ${fullPath}:`, error.message);
      }
    }
    
    console.log(`\nFinal results:`);
    console.log(`  Incoming: ${Array.from(this.dependencies.incoming).join(', ') || 'none'}`);
    console.log(`  Outgoing: ${Array.from(this.dependencies.outgoing).join(', ') || 'none'}`);
  }

  isTargetFile(filePath) {
    return FileUtils.isTargetFile(filePath, this.targetFile);
  }

  findOutgoingDependencies(content, currentFilePath) {
    console.log(`    Looking for outgoing dependencies...`);
    
    // Enhanced regex to capture import details - handles default + named imports
    const importRegex = /(?:import\s+(?:(\w+)\s*,\s*(\{[^}]*\})|(\{[^}]*\})|(\w+)|(\*\s+as\s+\w+)|(\w+\s*,\s*\w+))?\s+from\s+['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]\))/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const defaultAndNamed = match[1]; // default, { foo, bar }
      const namedImports = match[2] || match[3]; // { foo, bar }
      const defaultImport = match[4]; // default
      const namespaceImport = match[5]; // * as namespace
      const multipleImports = match[6]; // foo, bar
      const es6ImportPath = match[7]; // from 'path'
      const requirePath = match[8]; // require('path')
      
      const importPath = es6ImportPath || requirePath;
      console.log(`    Found import: ${importPath}`);
      
      if (!importPath || importPath.startsWith('.') === false) {
        console.log(`      -> Skipping external package`);
        continue; // Skip external packages
      }
      
      const resolvedPath = this.resolveImportPath(importPath, currentFilePath);
      console.log(`      -> Resolved to: ${resolvedPath}`);
      
      if (resolvedPath && resolvedPath !== this.targetFile) {
        // Extract import details
        const importDetails = FileUtils.extractImportDetails(defaultAndNamed, namedImports, defaultImport, namespaceImport, multipleImports);
        
        if (!this.dependencies.outgoing.has(resolvedPath)) {
          this.dependencies.outgoing.set(resolvedPath, []);
        }
        this.dependencies.outgoing.get(resolvedPath).push(importDetails);
        console.log(`      -> Added to outgoing dependencies: ${importDetails}`);
      }
    }
  }

  findIncomingDependencies(content, currentFilePath) {
    console.log(`    Looking for incoming dependencies...`);
    
    // Enhanced regex to capture import details - handles default + named imports
    const importRegex = /(?:import\s+(?:(\w+)\s*,\s*(\{[^}]*\})|(\{[^}]*\})|(\w+)|(\*\s+as\s+\w+)|(\w+\s*,\s*\w+))?\s+from\s+['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]\))/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const defaultAndNamed = match[1]; // default, { foo, bar }
      const namedImports = match[2] || match[3]; // { foo, bar }
      const defaultImport = match[4]; // default
      const namespaceImport = match[5]; // * as namespace
      const multipleImports = match[6]; // foo, bar
      const es6ImportPath = match[7]; // from 'path'
      const requirePath = match[8]; // require('path'
      
      const importPath = es6ImportPath || requirePath;
      console.log(`    Found import: ${importPath}`);
      
      if (!importPath || importPath.startsWith('.') === false) {
        console.log(`      -> Skipping external package`);
        continue; // Skip external packages
      }
      
      const resolvedPath = this.resolveImportPath(importPath, currentFilePath);
      console.log(`      -> Resolved to: ${resolvedPath}`);
      console.log(`      -> Is target file? ${this.isTargetFile(resolvedPath)}`);
      
      if (resolvedPath && this.isTargetFile(resolvedPath)) {
        // Extract import details
        const importDetails = FileUtils.extractImportDetails(defaultAndNamed, namedImports, defaultImport, namespaceImport, multipleImports);
        
        if (!this.dependencies.incoming.has(currentFilePath)) {
          this.dependencies.incoming.set(currentFilePath, []);
        }
        this.dependencies.incoming.get(currentFilePath).push(importDetails);
        console.log(`      -> Added to incoming dependencies: ${importDetails}`);
      }
    }
  }

  resolveImportPath(importPath, currentFilePath) {
    return FileUtils.resolveImportPath(importPath, currentFilePath, this.scanPath);
  }

  findFileDependenciesForMatrix(content, currentFilePath, dependencyMatrix) {
    const importRegex = /(?:import\s+(?:(\w+)\s*,\s*(\{[^}]*\})|(\{[^}]*\})|(\w+)|(\*\s+as\s+\w+)|(\w+\s*,\s*\w+))?\s+from\s+['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]\))/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const es6ImportPath = match[7];
      const requirePath = match[8];
      
      const importPath = es6ImportPath || requirePath;
      
      if (!importPath || importPath.startsWith('.') === false) {
        continue; // Skip external packages
      }
      
      const resolvedPath = this.resolveImportPath(importPath, currentFilePath);
      
      // Try to find the actual file path in moduleFiles
      let actualResolvedPath = resolvedPath;
      if (!this.moduleFiles.has(resolvedPath)) {
        // Try with different extensions
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];
        for (const ext of extensions) {
          const withExt = resolvedPath + ext;
          if (this.moduleFiles.has(withExt)) {
            actualResolvedPath = withExt;
            break;
          }
        }
      }
      
      if (actualResolvedPath && actualResolvedPath !== currentFilePath && this.moduleFiles.has(actualResolvedPath)) {
        // Add to dependency matrix
        if (!dependencyMatrix.has(currentFilePath)) {
          dependencyMatrix.set(currentFilePath, { incoming: new Set(), outgoing: new Set() });
        }
        if (!dependencyMatrix.has(actualResolvedPath)) {
          dependencyMatrix.set(actualResolvedPath, { incoming: new Set(), outgoing: new Set() });
        }
        
        dependencyMatrix.get(currentFilePath).outgoing.add(actualResolvedPath);
        dependencyMatrix.get(actualResolvedPath).incoming.add(currentFilePath);
      }
    }
  }
}

module.exports = DependencyAnalyzer; 