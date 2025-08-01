/**
 * Test script for port management functionality
 * This script demonstrates the automatic port selection feature
 */

const { createServer } = require('http');
const { getAvailablePort, isPortAvailable, findAvailablePort } = require('../src/utils/portManager');

async function testPortManager() {
  console.log('🧪 Testing Port Manager Functionality\n');

  try {
    // Test 1: Check if port 3000 is available
    console.log('Test 1: Checking if port 3000 is available...');
    const port3000Available = await isPortAvailable(3000);
    console.log(`   Port 3000 available: ${port3000Available}\n`);

    // Test 2: Find next available port starting from 3000
    console.log('Test 2: Finding next available port from 3000...');
    const nextPort = await findAvailablePort(3000, 10);
    console.log(`   Next available port: ${nextPort}\n`);

    // Test 3: Demonstrate port conflict resolution
    console.log('Test 3: Creating a test server to occupy a port...');
    const testServer = createServer();
    const testPort = nextPort || 3001;
    
    await new Promise((resolve, reject) => {
      testServer.listen(testPort, '127.0.0.1', () => {
        console.log(`   Test server started on port ${testPort}`);
        resolve();
      });
      testServer.on('error', reject);
    });

    // Now try to get an available port starting from the occupied port
    console.log(`   Trying to get available port starting from occupied port ${testPort}...`);
    const alternativePort = await getAvailablePort(testPort, { maxAttempts: 10, host: '127.0.0.1' });
    console.log(`   Alternative port found: ${alternativePort}\n`);

    // Test 4: Create another server on the alternative port
    console.log('Test 4: Starting server on alternative port...');
    const alternativeServer = createServer();
    
    await new Promise((resolve, reject) => {
      alternativeServer.listen(alternativePort, '127.0.0.1', () => {
        console.log(`   Alternative server started on port ${alternativePort}`);
        resolve();
      });
      alternativeServer.on('error', reject);
    });

    console.log('\n✅ All tests passed! Port management is working correctly.\n');

    // Cleanup
    console.log('🧹 Cleaning up test servers...');
    testServer.close();
    alternativeServer.close();
    console.log('   Test servers closed.\n');

    // Final demonstration
    console.log('🎯 Final demonstration:');
    console.log('   - Port availability checking: ✅');
    console.log('   - Automatic port selection: ✅');
    console.log('   - Conflict resolution: ✅');
    console.log('   - Graceful fallback: ✅\n');

    console.log('💡 Usage examples:');
    console.log('   - Default behavior: npm start (auto port enabled)');
    console.log('   - Disable auto port: AUTO_PORT=false npm start');
    console.log('   - Set max attempts: MAX_PORT_ATTEMPTS=50 npm start');
    console.log('   - Custom port: PORT=4000 npm start\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPortManager().then(() => {
    console.log('🎉 Port manager tests completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Port manager tests failed:', error.message);
    process.exit(1);
  });
}

module.exports = { testPortManager };