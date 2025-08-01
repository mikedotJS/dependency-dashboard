#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const { generateDashboard, generateFolderDashboard } = require('../src/index');

const program = new Command();

program
  .name('dependency-dashboard')
  .description('Generate an HTML dashboard showing file dependencies')
  .version('1.0.0');

// Single file analysis command
program
  .command('file')
  .description('Analyze dependencies for a specific file')
  .argument('<file>', 'Target file to analyze (relative to scan folder)')
  .argument('<folder>', 'Folder path to scan for dependencies')
  .action((file, folder) => {
    const absoluteFolder = path.resolve(folder);
    
    // Resolve the target file relative to the scan folder
    const targetFile = path.relative(absoluteFolder, path.resolve(file));
    
    console.log(`Analyzing file: ${file}`);
    console.log(`Scanning folder: ${absoluteFolder}`);
    console.log(`Target file (relative to scan folder): ${targetFile}`);
    
    generateDashboard(targetFile, absoluteFolder)
      .then(() => {
        console.log('Dashboard generated successfully!');
      })
      .catch((error) => {
        console.error('Error generating dashboard:', error.message);
        process.exit(1);
      });
  });

// Folder analysis command
program
  .command('folder')
  .description('Analyze dependencies for all files in a folder')
  .argument('<folder>', 'Folder path to analyze')
  .action((folder) => {
    const absoluteFolder = path.resolve(folder);
    
    console.log(`Analyzing folder: ${absoluteFolder}`);
    
    generateFolderDashboard(absoluteFolder)
      .then((results) => {
        console.log('Folder dashboard generated successfully!');
        console.log(`Analyzed ${results.totalFiles} files`);
        console.log(`Total dependencies: ${results.summary.totalDependencies}`);
      })
      .catch((error) => {
        console.error('Error generating folder dashboard:', error.message);
        process.exit(1);
      });
  });

// Default command (backward compatibility)
program
  .argument('[file]', 'Target file to analyze (relative to scan folder)')
  .argument('[folder]', 'Folder path to scan for dependencies')
  .action((file, folder) => {
    if (!file || !folder) {
      console.log('Usage: dependency-dashboard <file> <folder>');
      console.log('Or use: dependency-dashboard folder <folder> for folder analysis');
      process.exit(1);
    }
    
    const absoluteFolder = path.resolve(folder);
    const targetFile = path.relative(absoluteFolder, path.resolve(file));
    
    console.log(`Analyzing file: ${file}`);
    console.log(`Scanning folder: ${absoluteFolder}`);
    console.log(`Target file (relative to scan folder): ${targetFile}`);
    
    generateDashboard(targetFile, absoluteFolder)
      .then(() => {
        console.log('Dashboard generated successfully!');
      })
      .catch((error) => {
        console.error('Error generating dashboard:', error.message);
        process.exit(1);
      });
  });

program.parse();