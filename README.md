# Dependency Dashboard

A Node.js CLI tool that generates an HTML dashboard showing incoming and outgoing dependencies for a specified module within a given folder scope.

## Installation

```bash
npm install
```

## Usage

```bash
node bin/cli.js <module> <folder>
```

### Parameters

- `<module>`: The target module to analyze (without file extension)
- `<folder>`: The folder path to scan for dependencies

### Example

```bash
node bin/cli.js src/utils ./src
```

This will:
1. Analyze the `src/utils` module
2. Scan all files in the `./src` directory
3. Generate an HTML dashboard showing which modules depend on `src/utils` (incoming) and which modules `src/utils` depends on (outgoing)
4. Save the dashboard as `dependency-dashboard.html` in the current directory

## Features

- 📊 Interactive HTML dashboard with modern styling
- 🔍 Analyzes JavaScript/TypeScript files (.js, .ts, .jsx, .tsx, .mjs, .cjs)
- 📈 Shows incoming and outgoing dependencies
- 📱 Responsive design that works on mobile devices
- 🎨 Beautiful gradient styling and animations
- 📊 Statistics overview with total files scanned

## How it works

The tool:
1. Scans the specified folder recursively for JavaScript/TypeScript files
2. Parses import/require statements to build dependency relationships
3. Identifies modules that depend on the target module (incoming dependencies)
4. Identifies modules that the target module depends on (outgoing dependencies)
5. Generates a beautiful HTML dashboard with the results

## Output

The tool generates `dependency-dashboard.html` in your current working directory, which you can open in any web browser to view the interactive dashboard.