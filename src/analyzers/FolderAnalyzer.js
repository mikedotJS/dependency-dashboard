const fs = require('fs-extra');
const path = require('path');
const CircularDependencyDetector = require('./CircularDependencyDetector');
const DependencyDepthAnalyzer = require('./DependencyDepthAnalyzer');
const FileUtils = require('../utils/FileUtils');

class FolderAnalyzer {
  constructor(scanPath) {
    this.scanPath = scanPath;
    this.moduleFiles = new Map();
    this.dependencyMatrix = new Map(); // file -> { incoming: Set, outgoing: Set }
    this.dependencyCounts = new Map(); // file -> { incomingCount: number, outgoingCount: number }
    this.importDetails = new Map(); // file -> { incoming: Map, outgoing: Map }
  }

  async analyze() {
    await this.findModuleFiles();
    await this.analyzeAllDependencies();
    this.calculateDependencyMetrics();
    
    // Detect circular dependencies
    const circularDetector = new CircularDependencyDetector();
    circularDetector.buildDependencyGraph(this.dependencyMatrix);
    const circularDependencies = circularDetector.detectCircularDependencies();
    const circularReport = circularDetector.getCircularDependencyReport();
    
    // Analyze dependency depths
    const depthAnalyzer = new DependencyDepthAnalyzer();
    depthAnalyzer.buildDependencyGraph(this.dependencyMatrix);
    const depthReport = depthAnalyzer.getDepthAnalysisReport();
    
    return this.getFolderAnalysis(circularReport, depthReport);
  }

  async findModuleFiles() {
    this.moduleFiles = await FileUtils.findModuleFiles(this.scanPath);
    console.log('Module files found:', Array.from(this.moduleFiles.keys()));
  }

  async analyzeAllDependencies() {
    console.log(`Found ${this.moduleFiles.size} files to analyze`);
    
    // Get only files with extensions for analysis
    const filesWithExtensions = Array.from(this.moduleFiles.entries())
      .filter(([path]) => path.includes('.'));
    
    console.log(`Analyzing ${filesWithExtensions.length} files with extensions`);
    
    // Initialize dependency tracking for each file with extension
    for (const [relativePath] of filesWithExtensions) {
      this.dependencyMatrix.set(relativePath, {
        incoming: new Set(),
        outgoing: new Set()
      });
      this.importDetails.set(relativePath, {
        incoming: new Map(),
        outgoing: new Map()
      });
    }
    
    // Analyze each file with extension
    for (const [relativePath, fullPath] of filesWithExtensions) {
      try {
        const content = await fs.readFile(fullPath, 'utf8');
        console.log(`Analyzing: ${relativePath}`);
        this.findFileDependencies(content, relativePath);
      } catch (error) {
        console.warn(`Warning: Could not read file ${fullPath}:`, error.message);
      }
    }
  }

  findFileDependencies(content, currentFilePath) {
    console.log(`    Analyzing dependencies for: ${currentFilePath}`);
    const importRegex = /(?:import\s+(?:(\w+)\s*,\s*(\{[^}]*\})|(\{[^}]*\})|(\w+)|(\*\s+as\s+\w+)|(\w+\s*,\s*\w+))?\s+from\s+['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]\))/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const defaultAndNamed = match[1];
      const namedImports = match[2] || match[3];
      const defaultImport = match[4];
      const namespaceImport = match[5];
      const multipleImports = match[6];
      const es6ImportPath = match[7];
      const requirePath = match[8];
      
      const importPath = es6ImportPath || requirePath;
      console.log(`      Found import: ${importPath}`);
      
      if (!importPath || importPath.startsWith('.') === false) {
        console.log(`        -> Skipping external package`);
        continue; // Skip external packages
      }
      
      const resolvedPath = this.resolveImportPath(importPath, currentFilePath);
      console.log(`        -> Resolved to: ${resolvedPath}`);
      console.log(`        -> Exists in moduleFiles: ${this.moduleFiles.has(resolvedPath)}`);
      
      if (resolvedPath && resolvedPath !== currentFilePath && this.moduleFiles.has(resolvedPath)) {
        console.log(`        -> Adding dependency: ${currentFilePath} -> ${resolvedPath}`);
        
        // Get the actual file path with extension for the resolved path
        const resolvedFileWithExt = Array.from(this.moduleFiles.entries())
          .find(([path]) => path === resolvedPath || path === resolvedPath + '.js' || path === resolvedPath + '.ts' || path === resolvedPath + '.jsx' || path === resolvedPath + '.tsx');
        
        if (resolvedFileWithExt) {
          const actualResolvedPath = resolvedFileWithExt[0];
          
          // Add to dependency matrix
          this.dependencyMatrix.get(currentFilePath).outgoing.add(actualResolvedPath);
          this.dependencyMatrix.get(actualResolvedPath).incoming.add(currentFilePath);
          
          // Store import details
          const importDetails = FileUtils.extractImportDetails(defaultAndNamed, namedImports, defaultImport, namespaceImport, multipleImports);
          
          if (!this.importDetails.get(currentFilePath).outgoing.has(actualResolvedPath)) {
            this.importDetails.get(currentFilePath).outgoing.set(actualResolvedPath, []);
          }
          this.importDetails.get(currentFilePath).outgoing.get(actualResolvedPath).push(importDetails);
          
          if (!this.importDetails.get(actualResolvedPath).incoming.has(currentFilePath)) {
            this.importDetails.get(actualResolvedPath).incoming.set(currentFilePath, []);
          }
          this.importDetails.get(actualResolvedPath).incoming.get(currentFilePath).push(importDetails);
        }
      } else {
        console.log(`        -> Skipping: resolvedPath=${resolvedPath}, isCurrentFile=${resolvedPath === currentFilePath}, exists=${this.moduleFiles.has(resolvedPath)}`);
      }
    }
  }

  resolveImportPath(importPath, currentFilePath) {
    return FileUtils.resolveImportPath(importPath, currentFilePath, this.scanPath);
  }

  calculateDependencyMetrics() {
    for (const [file, deps] of this.dependencyMatrix) {
      this.dependencyCounts.set(file, {
        incomingCount: deps.incoming.size,
        outgoingCount: deps.outgoing.size,
        totalDependencies: deps.incoming.size + deps.outgoing.size,
        dependencyRatio: deps.incoming.size > 0 ? deps.outgoing.size / deps.incoming.size : deps.outgoing.size
      });
    }
  }

  getFolderAnalysis(circularReport = null, depthReport = null) {
    const files = Array.from(this.dependencyCounts.entries()).map(([file, counts]) => ({
      file,
      ...counts,
      incoming: Array.from(this.dependencyMatrix.get(file).incoming),
      outgoing: Array.from(this.dependencyMatrix.get(file).outgoing),
      importDetails: {
        incoming: Object.fromEntries(this.importDetails.get(file).incoming),
        outgoing: Object.fromEntries(this.importDetails.get(file).outgoing)
      }
    }));

    // Sort by different metrics
    const mostDependedOn = [...files].sort((a, b) => b.incomingCount - a.incomingCount);
    const mostDependent = [...files].sort((a, b) => b.outgoingCount - a.outgoingCount);
    const highestRatio = [...files].sort((a, b) => b.dependencyRatio - a.dependencyRatio);

    return {
      totalFiles: files.length,
      files,
      metrics: {
        mostDependedOn: mostDependedOn.slice(0, 10),
        mostDependent: mostDependent.slice(0, 10),
        highestRatio: highestRatio.slice(0, 10)
      },
      summary: {
        totalDependencies: files.reduce((sum, f) => sum + f.totalDependencies, 0),
        averageIncoming: files.reduce((sum, f) => sum + f.incomingCount, 0) / files.length,
        averageOutgoing: files.reduce((sum, f) => sum + f.outgoingCount, 0) / files.length
      },
      circularDependencies: circularReport,
      depthAnalysis: depthReport
    };
  }
}

module.exports = FolderAnalyzer; 