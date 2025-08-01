const fs = require('fs-extra');
const path = require('path');
const DependencyAnalyzer = require('./analyzers/DependencyAnalyzer');
const FolderAnalyzer = require('./analyzers/FolderAnalyzer');
const HTMLGenerator = require('./generators/HTMLGenerator');

async function generateDashboard(targetFile, scanPath) {
  const analyzer = new DependencyAnalyzer(targetFile, scanPath);
  const results = await analyzer.analyze();
  
  const htmlContent = HTMLGenerator.generateHTML(results);
  const outputPath = path.join(process.cwd(), 'dependency-dashboard.html');
  
  await fs.writeFile(outputPath, htmlContent);
  console.log(`Dashboard saved to: ${outputPath}`);
  
  return results;
}

async function generateFolderDashboard(scanPath) {
  const analyzer = new FolderAnalyzer(scanPath);
  const results = await analyzer.analyze();
  
  const htmlContent = HTMLGenerator.generateFolderHTML(results);
  const outputPath = path.join(process.cwd(), 'folder-dependency-dashboard.html');
  
  await fs.writeFile(outputPath, htmlContent);
  console.log(`Folder Dashboard saved to: ${outputPath}`);
  
  return results;
}

module.exports = { generateDashboard, generateFolderDashboard };