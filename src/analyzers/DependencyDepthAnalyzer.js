class DependencyDepthAnalyzer {
  constructor() {
    this.dependencyGraph = new Map();
    this.depthCache = new Map();
    this.incomingDepthCache = new Map();
    this.outgoingDepthCache = new Map();
  }

  buildDependencyGraph(dependencyMatrix) {
    this.dependencyGraph.clear();
    
    for (const [file, deps] of dependencyMatrix) {
      if (!this.dependencyGraph.has(file)) {
        this.dependencyGraph.set(file, { incoming: new Set(), outgoing: new Set() });
      }
      
      this.dependencyGraph.get(file).incoming = new Set(deps.incoming);
      this.dependencyGraph.get(file).outgoing = new Set(deps.outgoing);
    }
  }

  calculateMaxDepth(startFile, direction = 'outgoing', visited = new Set()) {
    const cacheKey = `${startFile}-${direction}`;
    if (this.depthCache.has(cacheKey)) {
      return this.depthCache.get(cacheKey);
    }

    if (visited.has(startFile)) {
      return 0;
    }

    if (!this.dependencyGraph.has(startFile)) {
      this.depthCache.set(cacheKey, 0);
      return 0;
    }

    visited.add(startFile);
    
    const dependencies = this.dependencyGraph.get(startFile)[direction];
    let maxDepth = 0;

    for (const dep of dependencies) {
      const depthFromDep = this.calculateMaxDepth(dep, direction, new Set(visited));
      maxDepth = Math.max(maxDepth, depthFromDep + 1);
    }

    visited.delete(startFile);
    this.depthCache.set(cacheKey, maxDepth);
    return maxDepth;
  }

  calculateAllDepths() {
    const results = new Map();
    
    for (const file of this.dependencyGraph.keys()) {
      const outgoingDepth = this.calculateMaxDepth(file, 'outgoing');
      const incomingDepth = this.calculateMaxDepth(file, 'incoming');
      
      results.set(file, {
        outgoingDepth,
        incomingDepth,
        maxDepth: Math.max(outgoingDepth, incomingDepth)
      });
    }
    
    return results;
  }

  findDependencyChains(startFile, direction = 'outgoing', maxLength = 10) {
    const chains = [];
    const visited = new Set();
    
    this.findChainsRecursive(startFile, direction, [], chains, visited, maxLength);
    
    return chains.sort((a, b) => b.length - a.length);
  }

  findChainsRecursive(currentFile, direction, currentChain, allChains, visited, maxLength) {
    if (currentChain.length >= maxLength || visited.has(currentFile)) {
      return;
    }

    const newChain = [...currentChain, currentFile];
    visited.add(currentFile);

    if (!this.dependencyGraph.has(currentFile)) {
      if (newChain.length > 1) {
        allChains.push(newChain);
      }
      visited.delete(currentFile);
      return;
    }

    const dependencies = this.dependencyGraph.get(currentFile)[direction];
    
    if (dependencies.size === 0) {
      if (newChain.length > 1) {
        allChains.push(newChain);
      }
    } else {
      for (const dep of dependencies) {
        this.findChainsRecursive(dep, direction, newChain, allChains, new Set(visited), maxLength);
      }
    }

    visited.delete(currentFile);
  }

  calculateDepthStatistics() {
    const allDepths = this.calculateAllDepths();
    const files = Array.from(allDepths.keys());
    
    if (files.length === 0) {
      return {
        totalFiles: 0,
        averageOutgoingDepth: 0,
        averageIncomingDepth: 0,
        maxOutgoingDepth: 0,
        maxIncomingDepth: 0,
        deepDependencies: [],
        depthDistribution: {}
      };
    }

    const outgoingDepths = files.map(f => allDepths.get(f).outgoingDepth);
    const incomingDepths = files.map(f => allDepths.get(f).incomingDepth);
    
    const averageOutgoingDepth = outgoingDepths.reduce((sum, d) => sum + d, 0) / files.length;
    const averageIncomingDepth = incomingDepths.reduce((sum, d) => sum + d, 0) / files.length;
    const maxOutgoingDepth = Math.max(...outgoingDepths);
    const maxIncomingDepth = Math.max(...incomingDepths);

    const deepDependencies = files
      .filter(file => {
        const depths = allDepths.get(file);
        return depths.outgoingDepth > 5 || depths.incomingDepth > 5;
      })
      .map(file => ({
        file,
        ...allDepths.get(file)
      }))
      .sort((a, b) => b.maxDepth - a.maxDepth);

    const depthDistribution = this.calculateDepthDistribution(allDepths);

    return {
      totalFiles: files.length,
      averageOutgoingDepth: Math.round(averageOutgoingDepth * 100) / 100,
      averageIncomingDepth: Math.round(averageIncomingDepth * 100) / 100,
      maxOutgoingDepth,
      maxIncomingDepth,
      deepDependencies,
      depthDistribution,
      allDepths: Object.fromEntries(allDepths)
    };
  }

  calculateDepthDistribution(allDepths) {
    const distribution = {
      outgoing: {},
      incoming: {},
      combined: {}
    };

    for (const [file, depths] of allDepths) {
      // Outgoing depth distribution
      const outgoingKey = depths.outgoingDepth.toString();
      distribution.outgoing[outgoingKey] = (distribution.outgoing[outgoingKey] || 0) + 1;

      // Incoming depth distribution
      const incomingKey = depths.incomingDepth.toString();
      distribution.incoming[incomingKey] = (distribution.incoming[incomingKey] || 0) + 1;

      // Combined max depth distribution
      const combinedKey = depths.maxDepth.toString();
      distribution.combined[combinedKey] = (distribution.combined[combinedKey] || 0) + 1;
    }

    return distribution;
  }

  getDepthAnalysisReport() {
    const statistics = this.calculateDepthStatistics();
    
    return {
      statistics,
      deepDependencyWarnings: this.generateDepthWarnings(statistics.deepDependencies),
      recommendations: this.generateRecommendations(statistics)
    };
  }

  generateDepthWarnings(deepDependencies) {
    return deepDependencies.map(dep => ({
      file: dep.file,
      severity: this.getDepthSeverity(dep.maxDepth),
      message: `File has deep dependency chains (outgoing: ${dep.outgoingDepth}, incoming: ${dep.incomingDepth})`,
      recommendation: this.getDepthRecommendation(dep.maxDepth)
    }));
  }

  getDepthSeverity(depth) {
    if (depth > 8) return 'critical';
    if (depth > 5) return 'warning';
    return 'info';
  }

  getDepthRecommendation(depth) {
    if (depth > 8) {
      return 'Consider breaking down this module or refactoring the dependency structure';
    } else if (depth > 5) {
      return 'Review the dependency chain and consider simplification';
    }
    return 'Dependency depth is within acceptable range';
  }

  generateRecommendations(statistics) {
    const recommendations = [];

    if (statistics.averageOutgoingDepth > 4) {
      recommendations.push({
        type: 'architecture',
        severity: 'warning',
        message: `Average outgoing dependency depth (${statistics.averageOutgoingDepth}) is high`,
        suggestion: 'Consider implementing a more modular architecture with clearer separation of concerns'
      });
    }

    if (statistics.deepDependencies.length > statistics.totalFiles * 0.2) {
      recommendations.push({
        type: 'refactoring',
        severity: 'warning',
        message: `${statistics.deepDependencies.length} files have deep dependency chains`,
        suggestion: 'Consider refactoring deeply nested dependencies to reduce complexity'
      });
    }

    if (statistics.maxOutgoingDepth > 10) {
      recommendations.push({
        type: 'performance',
        severity: 'critical',
        message: `Maximum dependency depth (${statistics.maxOutgoingDepth}) is very high`,
        suggestion: 'This may impact bundle size and loading performance. Consider code splitting or lazy loading'
      });
    }

    return recommendations;
  }

  clearCache() {
    this.depthCache.clear();
    this.incomingDepthCache.clear();
    this.outgoingDepthCache.clear();
  }
}

module.exports = DependencyDepthAnalyzer;