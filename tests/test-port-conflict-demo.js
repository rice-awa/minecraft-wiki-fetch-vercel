const http = require('http');
const { spawn } = require('child_process');

async function testPortConflictHandling() {
  console.log('🧪 Testing Port Conflict Handling\n');
  
  // Step 1: Create a server to occupy port 3000
  console.log('Step 1: Creating test server on port 3000...');
  const testServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Test server occupying port 3000\n');
  });
  
  await new Promise((resolve, reject) => {
    testServer.listen(3000, '127.0.0.1', (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('✅ Test server started on port 3000\n');
      resolve();
    });
  });
  
  // Step 2: Test our port manager
  console.log('Step 2: Testing port manager with conflict...');
  const { startServerSafely } = require('../src/utils/portManager');
  const express = require('express');
  
  const app = express();
  app.get('/', (req, res) => {
    res.json({ message: 'Main app running on alternative port' });
  });
  
  try {
    const result = await startServerSafely(app, 3000, '127.0.0.1', {
      maxAttempts: 10,
      logAttempts: true
    });
    
    console.log(`✅ Main app started successfully on port ${result.port}`);
    console.log(`   Original port: 3000, Actual port: ${result.port}\n`);
    
    // Step 3: Verify both servers are running
    console.log('Step 3: Verifying both servers are accessible...');
    
    // Test the conflict server
    const testResponse = await fetch('http://127.0.0.1:3000');
    const testText = await testResponse.text();
    console.log(`✅ Test server response: ${testText.trim()}`);
    
    // Test the main app
    const mainResponse = await fetch(`http://127.0.0.1:${result.port}`);
    const mainData = await mainResponse.json();
    console.log(`✅ Main app response: ${mainData.message}\n`);
    
    // Cleanup
    console.log('🧹 Cleaning up...');
    result.server.close();
    testServer.close();
    console.log('✅ All servers stopped\n');
    
    console.log('🎉 Port conflict handling test completed successfully!');
    console.log('   - Port conflict detection: ✅');
    console.log('   - Automatic port selection: ✅');
    console.log('   - Server startup on alternative port: ✅');
    console.log('   - Both servers running simultaneously: ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    testServer.close();
    process.exit(1);
  }
}

// Run the test
testPortConflictHandling().catch(console.error);