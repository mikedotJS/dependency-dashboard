import { generateDashboard } from './index.js';
import testFunction, { TestClass } from './test-with-imports.js';

// Use the imported items
const analyzer = new TestClass();
const result = testFunction();

console.log('Testing enhanced imports'); 