import { generateDashboard, DependencyAnalyzer } from './index.js';
import fs from 'fs-extra';
import path from 'path';

// Test with specific imports
const { readFile, writeFile } = fs;
const { join, resolve } = path;

export function testFunction() {
  return 'test';
}

export default class TestClass {
  constructor() {
    this.name = 'test';
  }
} 