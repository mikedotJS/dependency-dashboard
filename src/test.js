const { generateDashboard } = require('./index');

// Test function that uses the dashboard generator
async function testDashboard() {
  try {
    await generateDashboard('test', './src');
    console.log('Test dashboard generated!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

module.exports = { testDashboard }; 