class CircularDependencyDetector {
  constructor() {
    this.dependencyGraph = new Map(); // file -> Set of dependencies
    this.visited = new Set();
    this.recursionStack = new Set();
    this.circularDependencies = [];
  }

  buildDependencyGraph(dependencyMatrix) {
    // Convert dependency matrix to adjacency list
    for (const [file, deps] of dependencyMatrix) {
      if (!this.dependencyGraph.has(file)) {
        this.dependencyGraph.set(file, new Set());
      }
      
      // Add outgoing dependencies
      for (const outgoingDep of deps.outgoing) {
        this.dependencyGraph.get(file).add(outgoingDep);
      }
    }
  }

  detectCircularDependencies() {
    this.circularDependencies = [];
    this.visited.clear();
    this.recursionStack.clear();

    // Use DFS to detect cycles
    for (const file of this.dependencyGraph.keys()) {
      if (!this.visited.has(file)) {
        this.dfs(file, []);
      }
    }

    return this.circularDependencies;
  }

  dfs(currentFile, path) {
    if (this.recursionStack.has(currentFile)) {
      // Found a cycle
      const cycleStartIndex = path.indexOf(currentFile);
      const cycle = path.slice(cycleStartIndex).concat([currentFile]);
      this.circularDependencies.push({
        cycle: cycle,
        severity: this.calculateSeverity(cycle),
        description: this.generateCycleDescription(cycle)
      });
      return;
    }

    if (this.visited.has(currentFile)) {
      return;
    }

    this.visited.add(currentFile);
    this.recursionStack.add(currentFile);
    path.push(currentFile);

    const dependencies = this.dependencyGraph.get(currentFile) || new Set();
    for (const dependency of dependencies) {
      this.dfs(dependency, [...path]);
    }

    this.recursionStack.delete(currentFile);
  }

  calculateSeverity(cycle) {
    // Calculate severity based on cycle length and complexity
    if (cycle.length === 2) {
      return 'critical'; // Direct circular dependency
    } else if (cycle.length <= 4) {
      return 'warning'; // Short indirect cycle
    } else {
      return 'info'; // Long indirect cycle
    }
  }

  generateCycleDescription(cycle) {
    const cycleString = cycle.join(' → ');
    return `Circular dependency detected: ${cycleString}`;
  }

  getCircularDependencyReport() {
    return {
      totalCircularDependencies: this.circularDependencies.length,
      critical: this.circularDependencies.filter(cd => cd.severity === 'critical').length,
      warnings: this.circularDependencies.filter(cd => cd.severity === 'warning').length,
      info: this.circularDependencies.filter(cd => cd.severity === 'info').length,
      circularDependencies: this.circularDependencies
    };
  }
}

module.exports = CircularDependencyDetector; 