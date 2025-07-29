const { testDashboard } = require('./test');

// This file imports test.js, so test.js should have an incoming dependency
async function runTest() {
  await testDashboard();
}

module.exports = { runTest }; 