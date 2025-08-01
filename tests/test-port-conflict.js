const http = require('http');

// Create a simple server to occupy port 3000
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Test server occupying port 3000\n');
});

server.listen(3000, () => {
  console.log('🔒 Test server started on port 3000 to simulate port conflict');
  console.log('   Now try running: npm start');
  console.log('   The main app should automatically use port 3001');
  console.log('   Press Ctrl+C to stop this test server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping test server...');
  server.close(() => {
    console.log('✅ Test server stopped');
    process.exit(0);
  });
});