const net = require('net');

async function testPort(port) {
  console.log(`Testing port ${port}...`);
  
  // Create a test server
  const testServer = net.createServer();
  
  try {
    await new Promise((resolve, reject) => {
      testServer.listen(port, '127.0.0.1', () => {
        console.log(`✅ Test server started on port ${port}`);
        resolve();
      });
      testServer.on('error', reject);
    });
    
    // Now test if our detection function works
    const { isPortAvailable } = require('../src/utils/portManager');
    const available = await isPortAvailable(port, '127.0.0.1');
    console.log(`Port ${port} available according to isPortAvailable: ${available}`);
    
    // Close test server
    testServer.close();
    console.log(`Test server on port ${port} closed`);
    
    // Wait a bit and test again
    await new Promise(resolve => setTimeout(resolve, 100));
    const availableAfter = await isPortAvailable(port, '127.0.0.1');
    console.log(`Port ${port} available after closing: ${availableAfter}`);
    
  } catch (error) {
    console.error(`❌ Error testing port ${port}:`, error.message);
    testServer.close();
  }
}

async function main() {
  await testPort(3000);
  await testPort(3001);
}

main().catch(console.error);