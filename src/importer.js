import { generateDashboard } from './index';
import testFunction, { TestClass } from './test-with-imports';

// This file imports from test-with-imports.js
const instance = new TestClass();
const result = testFunction();

console.log('Imported from test-with-imports.js'); 