# Dependency Dashboard

A Node.js CLI tool that generates an HTML dashboard showing incoming and outgoing dependencies for a specified module within a given folder scope.

## Installation

### Global installation (recommended)
```bash
npm install -g dependency-dashboard
```

### Local installation
```bash
npm install dependency-dashboard
```

## Usage

### Global installation
```bash
dependency-dashboard file <module> <folder>
dependency-dashboard folder <folder>
```

### Local installation
```bash
npx dependency-dashboard file <module> <folder>
npx dependency-dashboard folder <folder>
```

### Parameters

- `<module>`: The target module to analyze (without file extension)
- `<folder>`: The folder path to scan for dependencies

### Examples

```bash
# Analyze a specific file
dependency-dashboard file src/utils ./src

# Analyze all files in a folder
dependency-dashboard folder ./src
```

This will:
1. Analyze the specified module(s)
2. Scan all files in the specified directory
3. Generate an HTML dashboard showing which modules depend on the target (incoming) and which modules the target depends on (outgoing)
4. Save the dashboard as `dependency-dashboard.html` in the current directory

## Features

- 📊 Interactive HTML dashboard with modern styling
- 🔍 Analyzes JavaScript/TypeScript files (.js, .ts, .jsx, .tsx, .mjs, .cjs)
- 📈 Shows incoming and outgoing dependencies
- ⚠️ **Circular dependency detection** - Identifies and highlights circular imports with severity levels
- 📊 **Dependency depth analysis** - Tracks how deep dependency chains go and warns about complex structures
- 📱 Responsive design that works on mobile devices
- 🎨 Beautiful gradient styling and animations
- 📊 Statistics overview with comprehensive metrics

## How it works

The tool:
1. Scans the specified folder recursively for JavaScript/TypeScript files
2. Parses import/require statements to build dependency relationships
3. Identifies modules that depend on the target module (incoming dependencies)
4. Identifies modules that the target module depends on (outgoing dependencies)
5. **Detects circular dependencies** using graph traversal algorithms
6. **Analyzes dependency depths** using breadth-first search to calculate dependency chain lengths
7. Generates a beautiful HTML dashboard with the results

## Advanced Features

### Dependency Depth Analysis

The tool now includes sophisticated dependency depth analysis that helps identify complex dependency structures:

- **Maximum Depth Tracking**: Shows the deepest dependency chains in your project
- **Average Depth Calculation**: Provides insights into overall project complexity
- **Deep Dependency Warnings**: Automatically identifies files with dependency chains deeper than 5 levels
- **Severity Levels**: Categorizes depth issues as info, warning, or critical based on complexity
- **Performance Recommendations**: Suggests refactoring approaches for deeply nested dependencies

### CLI Output

The CLI now provides comprehensive analysis output including:

```bash
📊 DEPENDENCY DEPTH ANALYSIS:
Average outgoing depth: 2.5
Average incoming depth: 1.8
Maximum outgoing depth: 6
Maximum incoming depth: 4

⚠️ DEEP DEPENDENCY WARNINGS (2):

1. CRITICAL: src/complex/deeply-nested.js
   File has deep dependency chains (outgoing: 8, incoming: 2)
   💡 Consider breaking down this module or refactoring the dependency structure
```

## Output

The tool generates `dependency-dashboard.html` in your current working directory, which you can open in any web browser to view the interactive dashboard with dependency depth visualization.

## Development

For local development:

```bash
git clone https://github.com/mikedotJS/dependency-dashboard.git
cd dependency-dashboard
npm install
node bin/cli.js file <module> <folder>
```