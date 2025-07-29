#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const { generateDashboard } = require('../src/index');

const program = new Command();

program
  .name('dependency-dashboard')
  .description('Generate an HTML dashboard showing file dependencies')
  .version('1.0.0')
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

program.parse();